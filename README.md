> This Plugin / Repo is being maintained by a community of developers.
There is no warranty given or bug fixing guarantee; especially not by
Programmfabrik GmbH. Please use the github issue tracking to report bugs
and self organize bug fixing. Feel free to directly contact the committing
developers.

# custom-data-type-loc

This is a plugin for [fylr](https://docs.fylr.io/) with Custom Data Type `CustomDataTypeLoc` for references to [Subject Headings](https://id.loc.gov/search/?q=cs:http://id.loc.gov/authorities/subjects) of the Library of Congress.

The Plugins uses <https://id.loc.gov/authorities/subjects/suggest> for the autocomplete-suggestions.

## installation

The latest version of this plugin can be found [here](https://github.com/programmfabrik/fylr-plugin-custom-data-type-loc/releases/latest/download/customDataTypeLoc.zip).

The ZIP can be downloaded and installed using the plugin manager, or used directly (recommended).

Github has an overview page to get a list of [all releases](https://github.com/programmfabrik/fylr-plugin-custom-data-type-loc/releases/).

## configuration

As defined in `manifest.yml` this datatype can be configured:

### Schema options

* Which LOC-Schema is searched. Available schemas can be found [on the LOC site](https://id.loc.gov/search/).
    * Select a Scheme on the left side
    * Check the URL. It should look like this https://id.loc.gov/search/?q=cs:http://id.loc.gov/vocabulary/graphicMaterials
    * Everything after http://id.loc.gov/ in the q parameter is the schema. In this example the schema would be **vocabulary/graphicMaterials**

* Limits the search to entries that are part of this schema. If not Schema is set, the plugin will search every schema.
     * examples:
        * authorities/subjects for [Subject Headings](https://id.loc.gov/search/?q=cs:http://id.loc.gov/authorities/subjects)
        * authorities/names for [Name Authority](https://id.loc.gov/search/?q=cs:http://id.loc.gov/authorities/names)
        * vocabulary/graphicMaterials for [Thesaurus Graphic Materials](https://id.loc.gov/search/?q=cs:http://id.loc.gov/vocabulary/graphicMaterials)
        * vocabulary/languages for [MARC Languages](https://id.loc.gov/search/?q=cs:http://id.loc.gov/vocabulary/languages)

### Mask options

* whether additional informationen is loaded if the mouse hovers a suggestion in the search result
* editordisplay: default or condensed (oneline)

## saved data
* conceptName
    * Preferred label of the linked record
* conceptURI
    * URI to linked record
* conceptGeoJSON
    * geoJSON, if given in places 
* _fulltext
    * easydb-fulltext
* _standard
    * easydb-standard

## updater
Note: The automatic updater is implemented and can be configured in the baseconfig. You need to enable the "custom-data-type"-update-service globally too.



## sources

The source code of this plugin is managed in a git repository at <https://github.com/programmfabrik/easydb-custom-data-type-loc>.
