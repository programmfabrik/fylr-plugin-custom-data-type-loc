var CustomDataTypeLocFacet = class extends FieldFacet {
    initOpts() {
        CustomDataTypeLocFacet.__super__.initOpts.call(this);
        return this.addOpts({
            field: {
                mandatory: true,
                check: Field
            }
        });
    }
    requestFacetWithLimit(obj) {
        return {
            limit: this.getLimit(),
            field: this._field.fullName() + ".facetTerm",
            sort: "count",
            type: "term"
        }
    }

    getObjects(key = this.name(), data = this.data()) {
        return data[key]?.terms || []
    }

    renderObjectText(object) {
        const parts = object.term.split('@$@')
        let label = '---'
        if (parts.length == 2 && parts[0] != '') {
            label = parts[0]
        }
        return label
    }

    getObjectPath(obj) {
        return [obj.term]
    }

    name() {
        return this._field.fullName() + ".facetTerm"
    }

    requestSearchFilter(obj) {
        return {
            bool: "must",
            fields: [this._field.fullName() + ".facetTerm"],
            type: "in",
            in: [obj.term],
        }
    }
}
