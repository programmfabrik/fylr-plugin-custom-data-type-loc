const fs = require('fs')
const https = require('https')
const fetch = (...args) => import('node-fetch').then(({
  default: fetch
}) => fetch(...args));

let databaseLanguages = [];

let info = {}

let access_token = '';

if (process.argv.length >= 3) {
  info = JSON.parse(process.argv[2])
}

function hasChanges(objectOne, objectTwo) {
  const ref = ["conceptName", "conceptURI", "_standard", "_fulltext", "facetTerm"];
  for (let i = 0; i < ref.length; i++) {
    let key = ref[i];
    if (!LocUtil.isEqual(objectOne[key], objectTwo[key])) {
      return true;
    }
  }
  return false;
}

function getConfigFromAPI() {
  return new Promise((resolve, reject) => {
    var url = 'http://fylr.localhost:8081/api/v1/config?access_token=' + access_token
    fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
    })
      .then(response => {
        if (response.ok) {
          resolve(response.json());
        } else {
          console.error("LoC-Updater: Fehler bei der Anfrage an /config ");
        }
      })
      .catch(error => {
        console.error(error);
        console.error("LoC-Updater: Fehler bei der Anfrage an /config");
      });
  });
}

function isInTimeRange(currentHour, fromHour, toHour) {
  if (fromHour === toHour) {
    return true;
  }

  if (fromHour < toHour) { // same day
    return currentHour >= fromHour && currentHour < toHour;
  } else { // through the night
    return currentHour >= fromHour || currentHour < toHour;
  }
}

function uriToSuggestUrl(uri) {
  const uriParts = uri.split('/');
  const path = uriParts.slice(3, -1).join('/');
  const locID = uriParts[uriParts.length - 1]

  return `https://id.loc.gov/${path}/suggest2?q=token:${locID}&searchtype=keyword`
}

main = (payload) => {
  console.error("main " + payload.action)
  switch (payload.action) {
    case "start_update":
      outputData({
        "state": {
          "personal": 2
        },
        "log": ["started logging"]
      })
      break
    case "update":
      ////////////////////////////////////////////////////////////////////////////
      // run LoC-api-call for every given uri
      ////////////////////////////////////////////////////////////////////////////

      // collect URIs
      let URIList = [];
      for (var i = 0; i < payload.objects.length; i++) {
        URIList.push(payload.objects[i].data.conceptURI);
      }
      // unique urilist
      URIList = [...new Set(URIList)]

      let requestUrls = [];
      let requests = [];

      URIList.forEach((uri) => {

        let dataRequestUrl = uriToSuggestUrl(uri)
        const options = {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Node'
          }
        }
        let dataRequest = fetch(dataRequestUrl, options);
        requests.push({
          url: dataRequestUrl,
          uri: uri,
          request: dataRequest
        });
        requestUrls.push(dataRequest);
      });

      Promise.all(requestUrls).then(function (responses) {
        let results = [];
        // console.error(responses)
        // Get a JSON object from each of the responses
        responses.forEach((response, index) => {
          let url = requests[index].url;
          let uri = requests[index].uri;
          let result = {
            url: url,
            uri: uri,
            data: null,
            error: null
          };
          if (response.ok) {
            result.data = response.json();
          } else {
            result.error = "Error fetching data from " + url + ": " + response.status + " " + response.statusText;
          }
          results.push(result);
        });
        console.error(results);

        return Promise.all(results.map(result => result.data));
      }).then(function (data) {
        // console.error("2nd then");
        // console.error(data);

        let results = [];
        data.forEach((data, index) => {
          let url = requests[index].url;
          let uri = requests[index].uri;
          let result = {
            url: url,
            uri: uri,
            data: data,
            error: null
          };
          if (data instanceof Error) {
            result.error = "Error parsing data from " + url + ": " + data.message;
          }
          results.push(result);
        });

        payload.objects.forEach((result, index) => {
          let originalCdata = payload.objects[index].data;

          let newCdata = {};
          let originalURI = originalCdata.conceptURI;

          const matchingRecordData = results.find(record => record.uri === originalURI);

          if (matchingRecordData) {
            ///////////////////////////////////////////////////////
            // conceptName, conceptURI, conceptSource, _standard, _fulltext, facet
            resultJSON = matchingRecordData.data;
            resultObject = Array.isArray(resultJSON?.hits) ? resultJSON.hits[0] : null

            if (resultObject) {
              // save conceptName
              // newCdata.conceptName = '??_' + resultObject.aLabel;
              newCdata.conceptName = resultObject.aLabel;
              // save conceptURI
              newCdata.conceptURI = resultObject.uri;
              // save _fulltext
              newCdata._fulltext = LocUtil.getFullTextFromLocJSON(resultObject, databaseLanguages);
              // save _standard
              newCdata._standard = LocUtil.getStandardFromLocJSON(null, resultObject, newCdata, databaseLanguages);
              if (hasChanges(payload.objects[index].data, newCdata)) {
                payload.objects[index].data = newCdata;
              } else { }
            }
          } else {
            console.error('No matching record found');
          }
        });
        outputData({
          "payload": payload.objects,
          "log": [payload.objects.length + " objects in payload"]
        });
      });
      // send data back for update
      break;
    case "end_update":
      outputData({
        "state": {
          "theend": 2,
          "log": ["done logging"]
        }
      });
      break;
    default:
      outputErr("Unsupported action " + payload.action);
  }
}

outputData = (data) => {
  out = {
    "status_code": 200,
    "body": data
  }
  process.stdout.write(JSON.stringify(out))
  process.exit(0);
}

outputErr = (err2) => {
  let err = {
    "status_code": 400,
    "body": {
      "error": err2.toString()
    }
  }
  console.error(JSON.stringify(err))
  process.stdout.write(JSON.stringify(err))
  process.exit(0);
}

(() => {
  let data = ""

  process.stdin.setEncoding('utf8');

  ////////////////////////////////////////////////////////////////////////////
  // check if hour-restriction is set
  ////////////////////////////////////////////////////////////////////////////

  if (info?.config?.plugin?.['custom-data-type-loc']?.config?.update_loc?.restrict_time === true) {
    loc_config = info.config.plugin['custom-data-type-loc'].config.update_loc;
    // check if hours are configured
    if (loc_config?.from_time !== false && loc_config?.to_time !== false) {
      const now = new Date();
      const hour = now.getHours();
      // check if hours do not match
      if (!isInTimeRange(hour, loc_config.from_time, loc_config.to_time)) {
        // exit if hours do not match
        outputData({
          "state": {
            "theend": 2,
            "log": ["hours do not match, cancel update"]
          }
        });
      }
    }
  }

  access_token = info && info.plugin_user_access_token;

  if (access_token) {

    ////////////////////////////////////////////////////////////////////////////
    // get config and read the languages
    ////////////////////////////////////////////////////////////////////////////

    getConfigFromAPI().then(config => {
      databaseLanguages = config.system.config.languages.database;
      databaseLanguages = databaseLanguages.map((value, key, array) => {
        return value.value;
      });

      ////////////////////////////////////////////////////////////////////////////
      // availabilityCheck for LoC-api
      ////////////////////////////////////////////////////////////////////////////

      const testURL = "https://id.loc.gov/authorities/subjects/suggest2?q=token:sh85038796&searchtype=keyword"
      const options = {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Node'
        }
      }
      https.get(testURL, options, res => {
        let testData = [];
        res.on('data', chunk => {
          testData.push(chunk);
        });
        res.on('end', () => {
          testData = Buffer.concat(testData).toString();
          const testJSON = JSON.parse(testData);

          if (!Array.isArray(testJSON?.hits)) {
            return console.error("Error: Json parse complete, result does not contain hits or hits is not an array.")
          }

          if (testJSON.hits.length < 1) {
            return console.error('Error: Hits array is empty.')
          }
          if (!testJSON.hits[0].token === 'sh85038796') {
            return console.error('Error: First element of hits array does not contain requested token.')
          }

          ////////////////////////////////////////////////////////////////////////////
          // test successfull --> continue with custom-data-type-update
          ////////////////////////////////////////////////////////////////////////////
          process.stdin.on('readable', () => {
            let chunk;
            while ((chunk = process.stdin.read()) !== null) {
              data = data + chunk
            }
          });
          process.stdin.on('end', () => {
            ///////////////////////////////////////
            // continue with update-routine
            ///////////////////////////////////////
            try {
              let payload = JSON.parse(data)
              main(payload)
            } catch (error) {
              console.error("caught error", error)
              outputErr(error)
            }
          });

        });
      }).on('error', err => {
        console.error('Error while receiving data from LoC-API: ', err.message);
      });
    }).catch(error => {
      console.error('Es gab einen Fehler beim Laden der Konfiguration:', error);
    });
  }
  else {
    console.error("kein Accesstoken gefunden");
  }

})();
