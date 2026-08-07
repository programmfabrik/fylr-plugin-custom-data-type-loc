class CustomDataTypeLoc extends CustomDataTypeWithCommonsAsPlugin

  #######################################################################  
  # return the prefix for localization for this data type.  
  # Note: This function is supposed to be deprecated, but is still used   
  # internally and has to be used here as a workaround because the   
  # default generates incorrect prefixes for camelCase class names 
  getL10NPrefix: ->
    'custom.data.type.loc'

  #######################################################################
  # return name of plugin
  getCustomDataTypeName: ->
    "custom:base.custom-data-type-loc.loc"


  #######################################################################
  # return name (l10n) of plugin
  getCustomDataTypeNameLocalized: ->
    $$("custom.data.type.loc.name")

  #######################################################################
  # support geostandard in frontend?
  supportsGeoStandard: ->
    return false
    

  #######################################################################
  # configure used facet
  getFacet: (opts) ->
    opts.field = @
    new CustomDataTypeLocFacet(opts)

  #######################################################################
  # get frontend-language
  getFrontendLanguage: () ->
    # language
    desiredLanguage = ez5?.loca?.getLanguage()
    if desiredLanguage
      desiredLanguage = desiredLanguage.split('-')
      desiredLanguage = desiredLanguage[0]
    else
      desiredLanguage = false

    desiredLanguage
    
  #######################################################################
  # build url and fix missing slashes
  getUrl: (schema) ->
    url = 'https://id.loc.gov'
    if !schema
      return url + '/suggest2'

    if not schema.startsWith '/'
      url += '/'
    
    url += schema
    
    if not schema.endsWith '/'
      url += '/'

    url += 'suggest2'
    
    url

   
  #######################################################################
  # get more info about record
  __getAdditionalTooltipInfo: (uri, tooltip, extendedInfo_xhr) ->
    
    uriParts = uri.split('/')
    if uriParts.length <= 1 # if array is 1 element or less we assume the uri has been encoded
      uriParts = uri.split('%2F')
    
    # if uriParts length is smaller than 6 it does not follow the expected format: protocol://id.loc.gov/dir/subDir/id
    # uri parts could be larger than 6, because there are some URIs that have an additional subDir: protocol://id.loc.gov/dir/subDir/subDir/id
    if uriParts.length < 6
      tooltip.hide()
      tooltip.destroy()
      return false

    schema = uriParts.slice(3, -1).join('/');
    locID = uriParts[uriParts.length - 1]

    # start new request
    url = @getUrl schema
    url += '?q=token:' + locID + '&searchtype=keyword'
    
    extendedInfo_xhr = new (CUI.XHR)(url: url)
    extendedInfo_xhr.start()
    .done((data, status, statusText) ->
      if not Array.isArray(data.hits) or data.hits.length == 0
        tooltip.hide()
        tooltip.destroy()
        return false

      object = data.hits[0]

      htmlContent = '<span style="padding: 10px 10px 0px 10px; font-weight: bold">' + $$('custom.data.type.loc.config.parameter.mask.infopop.info.label') + '</span>'
      htmlContent += '<table style="border-spacing: 10px; border-collapse: separate;">'

      # uri
      htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.uri') + ":</td>"
      htmlContent += "<td>" + object.token + "</td></tr>"

      # preflabel
      htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.preflabel') + ":</td>"
      htmlContent += "<td>" + object.aLabel + "</td></tr>"

      # variant label
      if object.vLabel
        htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.mask.infopop.labels.varlabel') + ":</td>"
        htmlContent += "<td>" + object.vLabel + "</td></tr>"

      # schema
      if schema
        htmlContent += "<tr><td>" + $$('custom.data.type.loc.config.parameter.schema.schema.value.label') + ":</td>"
        htmlContent += "<td>" + schema + "</td></tr>"

      htmlContent += "</table>"
      tooltip.DOM.innerHTML = htmlContent
      tooltip.autoSize()
    )

      
    return


  #######################################################################
  # handle suggestions-menu
  __updateSuggestionsMenu: (cdata, cdata_form, searchstring, input, suggest_Menu, searchsuggest_xhr, layout, opts) ->
    that = @
    
    delayMillisseconds = 200
    customSchemaSettings = that.getCustomSchemaSettings()

    setTimeout ( ->
      loc_searchtype = 'keyword'
      locSearchterm = searchstring
      locCountSuggestions = 20
      locSchema = that.getCustomSchemaSettings().schema?.value

      if (cdata_form)
        locSearchterm = cdata_form.getFieldsByName("searchbarInput")[0].getValue()
        locCountSuggestions = cdata_form.getFieldsByName("countOfSuggestions")[0].getValue()
        if !locSchema
          locSchema = cdata_form.getFieldsByName("schemaInput")?[0].getValue()
        
      if locSearchterm.length == 0
          return

      # if a search term exists we add a wildcard marker at the end. otherwise the term 'Ted' would not find 'Teddy'
      locSearchterm += '*'

      # run autocomplete-search via xhr
      if searchsuggest_xhr.xhr != undefined
          # abort eventually running request
          searchsuggest_xhr.xhr.abort()
     
      url = that.getUrl locSchema
      url += "?q=#{locSearchterm}&rdftype=Authority&searchtype=#{loc_searchtype}&count#{locCountSuggestions}"

      # start new request
      searchsuggest_xhr.xhr = new (CUI.XHR)(url: url)
      searchsuggest_xhr.xhr.start().done((data, status, statusText) ->

          # init xhr for tooltipcontent
          extendedInfo_xhr = { "xhr" : undefined }
          # create new menu with suggestions
          menu_items = []
          for suggestion, key in data.hits
            do(key) ->
              currentSuggestion = suggestion
              # the actual Featureclass...
              currentType = currentSuggestion.more.rdftypes[0];
              lastType = ''
              if key > 0
                lastType = data.hits[key-1].more.rdftypes[0]

              if currentType != lastType
                item =
                  divider: true
                menu_items.push item
                item =
                  label: currentType
                menu_items.push item
                item =
                  divider: true
                menu_items.push item
              item =
                text: currentSuggestion.aLabel
                value: currentSuggestion
                tooltip:
                  markdown: true
                  placement: "e"
                  content: (tooltip) ->
                    that.__getAdditionalTooltipInfo(currentSuggestion.uri, tooltip, extendedInfo_xhr)
                    new CUI.Label(icon: "spinner", text: "lade Informationen")
              menu_items.push item

          # set new items to menu
          itemList =
            onClick: (ev2, btn) ->
              data = btn.getOpt("value")
              # lock in save data
              cdata.conceptURI = data.uri
              cdata.conceptName = data.aLabel


              # _standard & _fulltext
              cdata._fulltext = LocUtil.getFullTextFromLocJSON data, false
              cdata._standard = LocUtil.getStandardFromLocJSON that, data, cdata, false

              # update the layout in form
              that.__updateResult(cdata, layout, opts)
              # hide suggest-menu
              suggest_Menu.hide()
              # close popover
              if that.popover
                that.popover.hide()
            
            items: menu_items

          # if no hits set "empty" message to menu
          if itemList.items.length == 0
            itemList =
              items: [
                text: "kein Treffer"
                value: undefined
              ]

          suggest_Menu.setItemList(itemList)

          suggest_Menu.show()
      )
    ), delayMillisseconds


  #######################################################################
  # create form
  __getEditorFields: (cdata) ->
    countSelect = {
      type: CUI.Select
      undo_and_changed_support: false
      class: 'commonPlugin_Select'
      form:
          label: $$('custom.data.type.loc.modal.form.text.count')
      options: [
        (
            value: 10
            text: '10 Vorschläge'
        )
        (
            value: 20
            text: '20 Vorschläge'
        )
        (
            value: 50
            text: '50 Vorschläge'
        )
        (
            value: 100
            text: '100 Vorschläge'
        )
      ]
      name: 'countOfSuggestions'
    }

    schemaInput = {
      type: CUI.Input
      undo_and_changed_support: false
      form:
          label: $$("custom.data.type.loc.config.parameter.schema.schema.value.label")
      placeholder: $$("custom.data.type.loc.config.parameter.schema.schema.value.label")
      name: "schemaInput"
      class: 'commonPlugin_Input'
    }

    searchInput = {
      type: CUI.Input
      undo_and_changed_support: false
      form:
          label: $$("custom.data.type.loc.modal.form.text.searchbar")
      placeholder: $$("custom.data.type.loc.modal.form.text.searchbar.placeholder")
      name: "searchbarInput"
      class: 'commonPlugin_Input'
    }
    
    fields = []
    fields.push countSelect
    fields.push schemaInput unless @getCustomSchemaSettings().schema?.value
    fields.push searchInput

    fields



  #######################################################################
  # renders the "result" in original form (outside popover)
  __renderButtonByData: (cdata) ->
        
    that = @

    # when status is empty or invalid --> message

    switch @getDataStatus(cdata)
      when "empty"
        return new CUI.EmptyLabel(text: $$("custom.data.type.loc.edit.no_loc")).DOM
      when "invalid"
        return new CUI.EmptyLabel(text: $$("custom.data.type.loc.edit.no_valid_loc")).DOM

    # if status is ok
    # output Button with Name of picked entry and URI
    new CUI.HorizontalLayout
      maximize: false
      left:
        content:
          new CUI.Label
            centered: false
            multiline: true
            text: cdata.conceptName
      center:
        content:
          # output Button with Name of picked Entry and Url to the Source
          new CUI.ButtonHref
            appearance: "link"
            href: cdata.conceptURI
            target: "_blank"
            tooltip:
              markdown: true
              placement: 'n'
              content: (tooltip) ->
                that.__getAdditionalTooltipInfo(cdata.conceptURI, tooltip)
                new CUI.Label(icon: "spinner", text: "lade Informationen")
            text: ' '
      right: null
    .DOM



  #######################################################################
  # zeige die gewählten Optionen im Datenmodell unter dem Button an
  getCustomDataOptionsInDatamodelInfo: (custom_settings) ->
    tag = $$('custom.data.type.loc.config.parameter.schema.schema.value.label') + ': '

    if custom_settings.schema?.value
      tag += custom_settings.schema.value
    else
      tag += '*'
      
    return [tag]


CustomDataType.register(CustomDataTypeLoc)
