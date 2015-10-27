// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


/**
 * This class can compile simple JS expressions into functions.
 *
 * @author adufilie
 * @author sanbalag
 */
(function () {
    "use strict";

    //constructor
    function Compiler() {
        throw "Compiler cannot be instantiated.";
    }
    Object.defineProperty(Compiler, 'ENCODE_LOOKUP', {
        value: {
            '\b': 'b',
            '\f': 'f',
            '\n': 'n',
            '\r': 'r',
            '\t': 't',
            '\\': '\\'
        }
    });
    Object.defineProperty(Compiler, 'DECODE_LOOKUP', {
        value: {
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        }
    });


    /**
     * This function surrounds a String with quotes and escapes special characters using ActionScript string literal format.
     * @param string A String that may contain special characters.
     * @param useDoubleQuotes If this is true, double-quote will be used.  If false, single-quote will be used.
     * @return The given String formatted for ActionScript.
     */
    Compiler.encodeString = function (string, quote) {
        quote = (quote === undefined) ? '"' : quote;
        if (string === null)
            return 'null';
        var result = [];
        result.length = string.length
        for (var i = 0; i < string.length; i++) {
            var chr = string.charAt(i);
            var esc = (chr === quote) ? quote : Compiler.ENCODE_LOOKUP[chr];
            result[i] = esc ? '\\' + esc : chr;
        }
        return quote + result.join('') + quote;
    }



    /**
     * Generates a deterministic JSON-like representation of an object, meaning object keys appear in sorted order.
     * @param value The object to stringify.
     * @param replacer A function like function(key:String, value:*):*
     * @param indent Either a Number or a String to specify indentation of nested values
     * @param json_values_only If this is set to true, only JSON-compatible values will be used (NaN/Infinity/undefined -> null)
     */
    Compiler.stringify = function (value, replacer, indent, json_values_only) {
        replacer = (replacer === undefined) ? null : replacer;
        indent = (indent === undefined) ? null : indent;
        json_values_only = (json_values_only === undefined) ? false : json_values_only;
        indent = indent ? indent : '';
        indent = (indent.constructor === Number) ? weavecore.StandardLib.lpad('', indent, ' ') : String(indent);
        return Compiler._stringify("", value, replacer, indent ? '\n' : '', indent, json_values_only);
    }

    Compiler._stringify = function (key, value, replacer, lineBreak, indent, json_values_only) {
        if (replacer !== null)
            value = replacer(key, value);

        var output;
        var item;
        var key;

        if (value.constructor === String)
            return Compiler.encodeString(value);

        // non-string primitives
        if (value === null || typeof value !== 'object') {
            if (json_values_only && (value === undefined || !isFinite(value)))
                value = null;
            return String(value) || String(null);
        }

        // loop over keys in Array or Object
        var lineBreakIndent = lineBreak + indent;
        var valueIsArrayOrVector = value.constructor === Array;
        output = [];
        if (valueIsArrayOrVector) {
            for (var i = 0; i < value.length; i++)
                output.push(Compiler._stringify(String(i), value[i], replacer, lineBreakIndent, indent, json_values_only));
        } else if (value.constructor.name === 'Object') {
            for (key in value)
                output.push(Compiler.encodeString(key) + ": " + Compiler._stringify(key, value[key], replacer, lineBreakIndent, indent, json_values_only));
            // sort keys
            weavecore.StandardLib.sort(output);
        }
        /*else {
               for each(var list: Array in DescribeType.getInfo(value, DescribeType.ACCESSOR_FLAGS | DescribeType.VARIABLE_FLAGS)['traits'])
               for each(item in list)
               if (item.access != 'writeonly' && !item.uri) // ignore properties with namespaces
                   output.push(encodeString(item.name) + ": " + _stringify(item.name, value[item.name], replacer, lineBreakIndent, indent, json_values_only));
               // sort keys
               StandardLib.sort(output);
           }*/

        if (output.length == 0)
            return valueIsArrayOrVector ? "[]" : "{}";

        return (valueIsArrayOrVector ? "[" : "{") + lineBreakIndent + output.join(indent ? ',' + lineBreakIndent : ', ') + lineBreak + (valueIsArrayOrVector ? "]" : "}");
    }


    weavecore.Compiler = Compiler;
}());
