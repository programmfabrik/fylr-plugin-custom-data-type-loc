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

* which loc-vocabularys are offered for search. One or multiple of
    * aat
    * tgn
    * ulan
* starting point for searching within a hierarchical vocabulary. Limits the search to entries that are children of this node, including all of its children and grandchildren.
     * examples:
        * aat:300194567
        * aat:300312045
        * tgn:7000084

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
Note: The automatic nightly updater is implemented and can be configured in the baseconfig. You need to enable the "custom-data-type"-update-service globally too.



## sources

The source code of this plugin is managed in a git repository at <https://github.com/programmfabrik/easydb-custom-data-type-loc>. Please use [the issue tracker](https://github.com/programmfabrik/easydb-custom-data-type-loc/issues) for bug reports and feature requests!
