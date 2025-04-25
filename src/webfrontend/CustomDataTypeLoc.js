var CustomDataTypeLoc = class extends CustomDataTypeWithCommons {
    /*###################################################################*/
    // return name of plugin
    getCustomDataTypeName() {
        return "custom:base.custom-data-type-loc.loc"
    }

    /*###################################################################*/
    // return name(l10n) of plugin
    getCustomDataTypeNameLocalized() {
        return $$("custom.data.type.loc.name")
    }

    /*###################################################################*/
    // support geostandard in frontend?
    supportsGeoStandard() {
        return false
    }

    /*###################################################################*/
    // get frontend-language
    getFrontendLanguage() {
        // language
        let desiredLanguage = ez5?.loca?.getLanguage()
        if (desiredLanguage) {
            desiredLanguage = desiredLanguage.split('-')
            desiredLanguage = desiredLanguage[0]
        }
        else {
            desiredLanguage = false
        }
        return desiredLanguage
    }

    /*###################################################################*/
    // get frontend-language
    getUrl(schema) {
        let url = location.protocol + '//id.loc.gov'
        if (!schema) {
            return url + '/suggest2'
        }

        if (!schema.startsWith('/')) {
            url += '/'
        }

        url += schema

        if (!schema.endsWith('/')) {
            url += '/'
        }

        url += 'suggest2'

        return url
    }

    /*###################################################################*/
    // get more info about record
    __getAdditionalTooltipInfo(uri, tooltip, extendedInfo_xhr) {
        let uriParts = uri.split('/');
        if (uriParts.length <= 1) {
            uriParts = uri.split('%2F');
        }

        if (uriParts.length < 6) {
            tooltip.hide();
            tooltip.destroy();
            return false;
        }

        const schema = uriParts.slice(3, -1).join('/');
        const locID = uriParts[uriParts.length - 1];
        let url = this.getUrl(schema);
        url += '?q=token:' + locID + '&searchtype=keyword';
        extendedInfo_xhr = new CUI.XHR({
            url: url
        });

        extendedInfo_xhr.start().done((data, status, statusText) => {
            if (!Array.isArray(data.hits) || data.hits.length === 0) {
                tooltip.hide();
                tooltip.destroy();
                return false;
            }
            const object = data.hits[0];
            let htmlContent = '<span style="padding: 10px 10px 0px 10px; font-weight: bold">' + $$('custom.data.type.loc.config.parameter.mask.infopop.info.label') + '</span>';
            htmlContent += '<table style="border-spacing: 10px; border-collapse: separate;">';
            htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.uri') + ":</td>";
            htmlContent += "<td>" + object.token + "</td></tr>";
            htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.preflabel') + ":</td>";
            htmlContent += "<td>" + object.aLabel + "</td></tr>";
            if (object.vLabel) {
                htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.varlabel') + ":</td>";
                htmlContent += "<td>" + object.vLabel + "</td></tr>";
            }
            if (schema) {
                htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.schema.schema.value.label') + ":</td>";
                htmlContent += "<td>" + schema + "</td></tr>";
            }
            htmlContent += "</table>";
            tooltip.DOM.innerHTML = htmlContent;
            return tooltip.autoSize();
        });
    }

    /*###################################################################*/
    // handle suggestions-menu
    __updateSuggestionsMenu(cdata, cdata_form, searchstring, input, suggest_Menu, searchsuggest_xhr, layout, opts) {
        const delayMillisseconds = 200;

        return setTimeout(() => {
            const customSchema = this.getCustomSchemaSettings().schema

            const loc_searchtype = 'keyword';
            let locSearchterm = searchstring;
            let locCountSuggestions = 20;
            let locSchema = customSchema != null ? customSchema.value : null;

            if (cdata_form) {
                locSearchterm = cdata_form.getFieldsByName("searchbarInput")[0].getValue();
                locCountSuggestions = cdata_form.getFieldsByName("countOfSuggestions")[0].getValue();
                if (!locSchema) {
                    const schemaInput = cdata_form.getFieldsByName("schemaInput")
                    locSchema = schemaInput != null ? schemaInput[0].getValue() : null;
                }
            }

            if (locSearchterm.length === 0) {
                return;
            }
            // if a search term exists we add a wildcard marker at the end. otherwise the term 'Ted' would not find 'Teddy'
            locSearchterm += '*'

            if (searchsuggest_xhr.xhr) {
                searchsuggest_xhr.xhr.abort();
            }
            let url = this.getUrl(locSchema);
            url += `?q=${locSearchterm}&rdftype=Authority&searchtype=${loc_searchtype}&count${locCountSuggestions}`;
            searchsuggest_xhr.xhr = new CUI.XHR({
                url: url
            });
            return searchsuggest_xhr.xhr.start().done((data, status, statusText) => {
                var extendedInfo_xhr, itemList, menu_items;
                extendedInfo_xhr = {
                    "xhr": void 0
                };
                menu_items = [];

                data.hits.forEach((suggestion, index) => {
                    const currentSuggestion = suggestion;
                    const currentType = currentSuggestion.more.rdftypes[0];
                    let lastType = '';
                    if (index > 0) {
                        lastType = data.hits[index - 1].more.rdftypes[0];
                    }
                    if (currentType !== lastType) {
                        menu_items.push({
                            divider: true
                        });
                        menu_items.push({
                            label: currentType
                        });
                        menu_items.push({
                            divider: true
                        });
                    }
                    const item = {
                        text: currentSuggestion.aLabel,
                        value: currentSuggestion,
                        tooltip: {
                            markdown: true,
                            placement: "e",
                            content: (tooltip) => {
                                this.__getAdditionalTooltipInfo(currentSuggestion.uri, tooltip, extendedInfo_xhr);
                                return new CUI.Label({
                                    icon: "spinner",
                                    text: "lade Informationen"
                                });
                            }
                        }
                    };
                    return menu_items.push(item);
                });

                itemList = {
                    onClick: (ev2, btn) => {
                        data = btn.getOpt("value");
                        cdata.conceptURI = data.uri;
                        cdata.conceptName = data.aLabel;
                        cdata._fulltext = LocUtil.getFullTextFromLocJSON(data, false);
                        cdata._standard = LocUtil.getStandardFromLocJSON(this, data, cdata, false);
                        this.__updateResult(cdata, layout, opts);
                        suggest_Menu.hide();
                        if (this.popover) {
                            return this.popover.hide();
                        }
                    },
                    items: menu_items
                };
                if (itemList.items.length === 0) {
                    itemList = {
                        items: [
                            {
                                text: "kein Treffer",
                                value: void 0
                            }
                        ]
                    };
                }
                suggest_Menu.setItemList(itemList);
                return suggest_Menu.show();
            });
        }, delayMillisseconds);
    }


    /*###################################################################*/
    // create form
    __getEditorFields(cdata) {
        const countSelect = {
            type: CUI.Select,
            undo_and_changed_support: false,
            class: 'commonPlugin_Select',
            form: {
                label: $$('custom.data.type.loc.modal.form.text.count')
            },
            options: [
                {
                    value: 10,
                    text: '10 Vorschläge'
                },
                {
                    value: 20,
                    text: '20 Vorschläge'
                },
                {
                    value: 50,
                    text: '50 Vorschläge'
                },
                {
                    value: 100,
                    text: '100 Vorschläge'
                },
            ],
            name: 'countOfSuggestions'
        }

        const schemaInput = {
            type: CUI.Input,
            undo_and_changed_support: false,
            form: {
                label: $$("custom.data.type.loc.config.parameter.schema.schema.value.label")
            },
            placeholder: $$("custom.data.type.loc.config.parameter.schema.schema.value.label"),
            name: "schemaInput",
            class: 'commonPlugin_Input',
        }

        const searchInput = {
            type: CUI.Input,
            undo_and_changed_support: false,
            form: {
                label: $$("custom.data.type.loc.modal.form.text.searchbar")
            },
            placeholder: $$("custom.data.type.loc.modal.form.text.searchbar.placeholder"),
            name: "searchbarInput",
            class: 'commonPlugin_Input',
        }

        const fields = []
        fields.push(countSelect)
        if (!this.getCustomSchemaSettings().schema?.value) {
            fields.push(schemaInput)
        }
        fields.push(searchInput)

        return fields
    }


    /*###################################################################*/
    // renders the "result" in original form (outside popover)
    __renderButtonByData(cdata) {
        // when status is empty or invalid --> message
        switch (this.getDataStatus(cdata)) {
            case "empty":
                return new CUI.EmptyLabel({ text: $$("custom.data.type.loc.edit.no_loc") }).DOM
            case "invalid":
                return new CUI.EmptyLabel({ text: $$("custom.data.type.loc.edit.no_valid_loc") }).DOM
        }
        // if status is ok
        // output Button with Name of picked entry and URI
        return new CUI.HorizontalLayout({
            maximize: false,
            left: {
                content: new CUI.Label({
                    centered: false,
                    multiline: true,
                    text: cdata.conceptName,
                })
            },
            center: {
                // output Button with Name of picked Entry and Url to the Source
                content: new CUI.ButtonHref({
                    appearance: "link",
                    href: cdata.conceptURI,
                    target: "_blank",
                    tooltip: {
                        markdown: true,
                        placement: 'n',
                        content: (tooltip) => {
                            this.__getAdditionalTooltipInfo(cdata.conceptURI, tooltip)
                            return new CUI.Label({ icon: "spinner", text: "lade Informationen" })
                        },
                    },
                    text: ' '
                }),
            },
            right: null
        }).DOM
    }

    /*###################################################################*/
    // zeige die gewählten Optionen im Datenmodell unter dem Button an
    getCustomDataOptionsInDatamodelInfo(custom_settings) {
        let tag = $$('custom.data.type.loc.config.parameter.schema.schema.value.label') + ': '

        if (custom_settings.schema?.value) {
            tag += custom_settings.schema.value
        } else {
            tag += '*'
        }
        return [tag]
    }
}

CustomDataType.register(CustomDataTypeLoc);
