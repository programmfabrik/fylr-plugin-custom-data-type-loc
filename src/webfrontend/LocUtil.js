var LocUtil = class {

    // from https://github.com/programmfabrik/coffeescript-ui/blob/fde25089327791d9aca540567bfa511e64958611/src/base/util.coffee#L506
    // has to be reused here, because cui not be used in updater
    static isEqual(x, y, debug) {
        // if both are function
        if (x instanceof Function) {
            if (y instanceof Function) {
                return x.toString() == y.toString()
            } else {
                return false
            }
        }

        if (x == null || x == undefined || y == null || y == undefined)
            return x == y

        if (x == y || x.valueOf() == y.valueOf())
            return true

        // if one of them is date, they must had equal valueOf
        if (x instanceof Date)
            return false

        if (y instanceof Date)
            return false

        // if they are not function || strictly equal, they both need to be Objects
        if (!(x instanceof Object))
            return false

        if (!(y instanceof Object))
            return false

        const p = Object.keys(x)
        if (Object.keys(y).every((i) => p.indexOf(i) != -1)) {
            return p.every((i) => {
                const eq = this.isEqual(x[i], y[i], debug)
                if (!eq) {
                    if (debug) {
                        console.debug("X: ", x)
                        console.debug("Differs to Y:", y)
                        console.debug("Key differs: ", i)
                        console.debug("Value X:", x[i])
                        console.debug("Value Y:", y[i])
                    }
                    return false
                }
                else {
                    return true
                }
            })
        } else {

            return false
        }
    }

    static getStandardFromLocJSON(context, object, cdata, databaseLanguages = false) {
        if (databaseLanguages == false) {
            databaseLanguages = ez5.loca.getDatabaseLanguages()
        }

        const _standard = {
            text: object.aLabel,
            l10ntext: {}
        }

        const l10nObject = {}

        // init l10nObject for fulltext
        for (let i = 0; i < databaseLanguages.length; i++) {
            const language = databaseLanguages[i];
            l10nObject[language] = ''
        }
        // 1. L10N
        //  give l10n-languages the easydb-language-syntax
        for (const l10nObjectKey in l10nObject) {
            l10nObject[l10nObjectKey] = object.aLabel;
        }
        _standard.l10ntext = l10nObject

        return _standard
    }

    static getFullTextFromLocJSON(object, databaseLanguages = false) {
        if (databaseLanguages == false) {
            databaseLanguages = ez5.loca.getDatabaseLanguages()
        }

        if (Array.isArray(object))
            object = object[0]

        const _fulltext = {
            text: '',
            l10ntext: {}
        }

        let fullTextString = ''
        const l10nObject = {}

        // init l10nObject for fulltext
        for (let i = 0; i < databaseLanguages.length; i++) {
            const language = databaseLanguages[i];
            l10nObject[language] = ''
        }
        // preflabel to all languages
        fullTextString += object.suggestLabel + ' ' + object.aLabel + ' ' + object.vLabel + ' '
        // identifier to fulltext
        fullTextString += object.token + ' '

        for (const l10nObjectKey in l10nObject) {
            l10nObject[l10nObjectKey] = fullTextString
        }

        _fulltext.text = fullTextString
        _fulltext.l10ntext = l10nObject

        return _fulltext
    }
}
