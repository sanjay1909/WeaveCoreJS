Array.CASEINSENSITIVE = 1;
Array.DESCENDING = 2;
Array.UNIQUESORT = 4;
Array.RETURNINDEXEDARRAY = 8;
Array.NUMERIC = 16;

(function () {
    var dup_fn = function (field, field_options) {
        var filtered = (field_options & Array.NUMERIC) ? this.map(function (item) {
            return item[field].toFloat();
        }) : (field_options & Array.CASEINSENSITIVE) ? this.map(function (item) {
            return item[field].toLowerCase();
        }) : this.map(function (item) {
            return item[field];
        });
        return filtered.length !== [].combine(filtered).length;
    };

    var sort_fn = function (item_a, item_b, fields, options) {
        return (function sort_by(fields, options) {
            var ret, a, b,
                opts = options[0],
                sub_fields = fields[0].match(/[^.]+/g);

            (function get_values(s_fields, s_a, s_b) {

                var field = s_fields[0];
                console.log(s_a, s_fields, field);
                if (s_fields.length > 1) {
                    get_values(s_fields.slice(1), s_a[field], s_b[field]);
                } else {
                    console.log(s_a[field]);
                    a = s_a[field].toString();
                    b = s_b[field].toString();
                }
            })(sub_fields, item_a, item_b);

            if (opts & Array.NUMERIC) {
                ret = (a.toFloat() - b.toFloat());
            } else {
                if (opts & Array.CASEINSENSITIVE) {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                }

                ret = (a > b) ? 1 : (a < b) ? -1 : 0;
            }

            if ((ret === 0) && (fields.length > 1)) {
                ret = sort_by(fields.slice(1), options.slice(1));
            } else if (opts & Array.DESCENDING) {
                ret *= -1;
            }

            return ret;
        })(fields, options);
    };

    Array.prototype.sortOn = function (fields, options) {


        fields = (fields === undefined) ? [] : fields;
        options = (options === undefined) ? [] : options;
        if (options.length !== fields.length) options = [];

        if ((options[0] & Array.UNIQUESORT) && (fields.some(function (field, i) {
                return dup_fn(field, options[i]);
            }))) return 0;

        var curry_sort = function (item_a, item_b) {
            return sort_fn(item_a, item_b, fields, options);
        };

        if (options[0] & Array.RETURNINDEXEDARRAY)
            return this.slice().sort(curry_sort);
        else
            return this.sort(curry_sort);
    }

})();
