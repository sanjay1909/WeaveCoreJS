/*
    Weave (Web-based Analysis and Visualization Environment)
    Copyright (C) 2008-2011 University of Massachusetts Lowell
    This file is a part of Weave.
    Weave is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License, Version 3,
    as published by the Free Software Foundation.
    Weave is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


/**
 * This provides a set of useful static functions.
 * All the functions defined in this class are pure functions,
 * meaning they always return the same result with the same arguments, and they have no side-effects.
 *
 * @author adufilie
 * @author sanbalag
 */
(function () {
    "use strict";

    //constructor
    function StandardLib() {
        throw "StandardLib cannot be instantiated.";
    }

    /**
     * This compares two dynamic objects or primitive values and is much faster than ObjectUtil.compare().
     * Does not check for circular refrences.
     * @param a First dynamic object or primitive value.
     * @param b Second dynamic object or primitive value.
     * @return A value of zero if the two objects are equal, nonzero if not equal.
     */
    StandardLib.compare = function (a, b, objectCompare) {
        objectCompare = (objectCompare === undefined ? null : objectCompare);
        var c;
        var ObjectUtil = weavecore.ObjectUtil;
        if (a === b)
            return 0;
        if (a === null || a === undefined)
            return 1;
        if (b === null || b === undefined)
            return -1;
        var typeA = typeof (a);
        var typeB = typeof (b);
        if (typeA !== typeB)
            return weavecore.ObjectUtil.stringCompare(typeA, typeB);
        if (typeA === 'boolean')
            return weavecore.ObjectUtil.numericCompare(Number(a), Number(b));
        if (typeA === 'number')
            return weavecore.ObjectUtil.numericCompare(a, b);
        if (typeA === 'string')
            return weavecore.ObjectUtil.stringCompare(a, b);

        if (typeA !== 'object')
            return 1;

        if (a instanceof Date && b instanceof Date)
            return weavecore.ObjectUtil.dateCompare(a, b);

        if (a.constructor === Array && b.constructor === Array) {
            var an = a.length;
            var bn = b.length;
            if (an < bn)
                return -1;
            if (an > bn)
                return 1;
            for (var i = 0; i < an; i++) {
                c = StandardLib.compare(a[i], b[i]);
                if (c !== 0)
                    return c;
            }
            return 0;
        }

        if (objectCompare !== null) {
            var result = objectCompare(a, b);
            if (isFinite(result))
                return result;
        }

        var qna = a.constructor.name;
        var qnb = b.constructor.name;

        if (qna != qnb)
            return weavecore.ObjectUtil.stringCompare(qna, qnb);

        var p;

        // test if objects are dynamic
        try {
            a[''];
            b[''];
        } catch (e) {
            return 1; // not dynamic objects
        }

        // if there are properties in a not found in b, return -1
        for (p in a) {
            if (!b.hasOwnProperty(p))
                return -1;
        }
        for (p in b) {
            // if there are properties in b not found in a, return 1
            if (!a.hasOwnProperty(p))
                return 1;

            c = StandardLib.compare(a[p], b[p]);
            if (c !== 0)
                return c;
        }

        return 0;
    };

    /**
     * This function will cast a value of any type to a Number,
     * interpreting the empty string ("") and null as NaN.
     * @param value A value to cast to a Number.
     * @return The value cast to a Number, or NaN if the casting failed.
     */
    StandardLib.asNumber = function (value) {
        if (value === null || value === undefined)
            return NaN; // return NaN because Number(null) == 0

        if (value.constructor === Number || value instanceof Date)
            return value;

        try {
            value = String(value);
            if (value === '')
                return NaN; // return NaN because Number('') == 0
            return Number(value);
        } catch (e) {}

        return NaN;
    }

    /**
     * This function attempts to derive a boolean value from different types of objects.
     * @param value An object to parse as a Boolean.
     */
    StandardLib.asBoolean = function (value) {
        if (value.constructor === Boolean)
            return value;
        if (value.constructor === String)
            return weavecore.ObjectUtil.stringCompare(value, "true", true) === 0;
        if (isNaN(value))
            return false;
        if (value.constructor === Number)
            return value != 0;
        return value;
    }

    /**
     * Converts a value to a non-null String
     * @param value A value to cast to a String.
     * @return The value cast to a String.
     */
    StandardLib.asString = function (value) {
        if (value === null || value === undefined)
            return '';
        try {
            return value;
        } catch (e) {}
        return '';
    }


    /**
     * Tests if a value is anything other than undefined, null, or NaN.
     */
    StandardLib.isDefined = function (value) {
        return value !== undefined && value !== null && !(value.constructor === Number && isNaN(value));
    }

    /**
     * Tests if a value is undefined, null, or NaN.
     */
    StandardLib.isUndefined = function (value) {
        return value === undefined || value === null || (value.constructor === Number && isNaN(value));
    }


    /**
     * Checks if all items in an Array are instances of a given type.
     * @param a An Array of items to test
     * @param type A type to check for
     * @return true if each item in the Array is an object of the given type.
     */
    StandardLib.arrayIsType = function (arr, type) {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (!(item instanceof type || item.constructor === type))
                return false;
        }

        return true;
    }

    /**
     * Pads a string on the left.
     */
    StandardLib.lpad = function (str, length, padString) {
        padString = (padString === undefined) ? ' ' : padString;
        if (str.length >= length)
            return str;
        while (str.length + padString.length < length)
            padString += padString;
        return padString.substr(0, length - str.length) + str;
    }

    /**
     * Pads a string on the right.
     */
    StandardLib.rpad = function (str, length, padString) {
        padString = (padString === undefined) ? ' ' : padString;
        if (str.length >= length)
            return str;
        while (str.length + padString.length < length)
            padString += padString;
        return str + padString.substr(0, length - str.length);
    }


    /**
     * This function will use a default NumberFormatter object to format a Number to a String.
     * @param number The number to format.
     * @param precision A precision value to pass to the default NumberFormatter.
     * @return The result of format(number) using the specified precision value.
     * @see mx.formatters.NumberFormatter#format
     */
    StandardLib.formatNumber = function (number, precision) {
            precision = (precision === undefined) ? NaN : precision;
            if (isFinite(precision)) {
                precision = parseInt(precision);
            } else {
                number = StandardLib.roundSignificant(number);
                if (Math.abs(number) < 1)
                    return String(number); // this fixes the bug where "0.1" gets converted to ".1" (we don't want the "0" to be lost)
                precision = -1;
            }

            //StandardLib._numberFormatter.format(number)
            return number.toPrecision(precision);
        }
        /**
         * This is the default NumberFormatter to use inside the formatNumber() function.
         */
    StandardLib._numberFormatter = new Intl.NumberFormat();

    /**
     * This rounds a Number to a given number of significant digits.
     * @param value A value to round.
     * @param significantDigits The desired number of significant digits in the result.
     * @return The number, rounded to the specified number of significant digits.
     */
    StandardLib.roundSignificant = function (value, significantDigits) {
        significantDigits = (significantDigits === undefined) ? 14 : significantDigits;
        // it doesn't make sense to round infinity or NaN
        if (!isFinite(value))
            return value;

        var sign = (value < 0) ? -1 : 1;
        var absValue = Math.abs(value);
        var pow10;

        // if absValue is less than 1, all digits after the decimal point are significant
        if (absValue < 1) {
            pow10 = Math.pow(10, significantDigits);
            //trace("absValue<1: Math.round(",absValue,"*",pow10,")",Math.round(absValue * pow10));
            return sign * Math.round(absValue * pow10) / pow10;
        }

        var log10 = Math.ceil(Math.log(absValue) / Math.LN10);

        // Both these calculations are equivalent mathematically, but if we use
        // the wrong one we get bad rounding results like "123.456000000001".
        if (log10 < significantDigits) {
            // find the power of 10 that you need to MULTIPLY absValue by
            // so Math.round() will round off the digits we don't want
            pow10 = Math.pow(10, significantDigits - log10);
            return sign * Math.round(absValue * pow10) / pow10;
        } else {
            // find the power of 10 that you need to DIVIDE absValue by
            // so Math.round() will round off the digits we don't want
            pow10 = Math.pow(10, log10 - significantDigits);
            //trace("log10>significantDigits: Math.round(",absValue,"/",pow10,")",Math.round(absValue / pow10));
            return sign * Math.round(absValue / pow10) * pow10;
        }
    }

    /**
     * This uses AsyncSort.sortImmediately() to sort an Array (or Vector) in place.
     * @param array An Array (or Vector) to sort.
     * @param compare A function that accepts two items and returns -1, 0, or 1.
     * @see weave.utils.AsyncSort#sortImmediately()
     * @see Array#sort()
     */
    StandardLib.sort = function (array, compare) {
        compare = (compare === undefined) ? null : compare;
        weavecore.AsyncSort.sortImmediately(array, compare);
    }

    Object.defineProperty(StandardLib, '_sortBuffer', {
        value: []
    });

    function numericSort(a, b, sortDirection) {
        return a - b;
    }

    function nonASCIISort(a, b, sortDirection) {
        return a.localeCompare(b);
    }

    function dateSort(date1, date2, sortDirection) {
        // This is a comparison function that will result in dates being sorted in
        // ASCENDING order.
        if (date1 > date2) return 1;
        if (date1 < date2) return -1;
        return 0;
    };





    /**
     * Sorts an Array (or Vector) of items in place using properties, lookup tables, or replacer functions.
     * @param array An Array (or Vector) to sort.
     * @param params Specifies how to get values used to sort items in the array.
     *               This can either be an Array of params or a single param, each of which can be one of the following:<br>
     *               Array or Vector: values are looked up based on index (Such an Array must be nested in a params array rather than given alone as a single param)<br>
     *               Object or Dictionary: values are looked up using items in the array as keys<br>
     *               Property name: values are taken from items in the array using a property name<br>
     *               Replacer function: array items are passed through this function to get values<br>
     * @param sortDirections Specifies sort direction(s) (1 or -1) corresponding to the params.
     * @param inPlace Set this to true to modify the original Array (or Vector) in place or false to return a new, sorted copy.
     * @param returnSortedIndexArray Set this to true to return a new Array of sorted indices.
     * @return Either the original Array (or Vector) or a new one.
     *
     */
    StandardLib.sortOn = function (array, params, sortDirections, inPlace, returnSortedIndexArray) {
        inPlace = (inPlace === undefined) ? true : inPlace;
        returnSortedIndexArray = (returnSortedIndexArray === undefined) ? false : returnSortedIndexArray;

        if (array.length === 0)
            return inPlace ? array : [];

        var values;
        var param;
        var sortDirection;
        var i;

        // expand _sortBuffer as necessary
        for (i = StandardLib._sortBuffer.length; i < array.length; i++)
            StandardLib._sortBuffer[i] = [];

        // If there is only one param, wrap it in an array.
        // Array.sortOn() is preferred over Array.sort() in this case
        // since an undefined value will crash Array.sort(Array.NUMERIC).
        if (params === array || !(params.constructor === Array)) {
            params = [params];
            if (sortDirections)
                sortDirections = [sortDirections];
        }

        var fields = new Array();
        fields.length = params.length;
        var fieldOptions = new Array();
        fieldOptions.length = params.length;
        for (var p = 0; p < params.length; p++) {
            param = params[p];
            sortDirection = sortDirections && sortDirections[p] < 0 ? Array.DESCENDING : 0;

            i = array.length;
            if (param.constructor === Array)
                while (i--)
                    StandardLib._sortBuffer[i][p] = param[i];
            else if (param.constructor === Function)
                while (i--)
                    StandardLib._sortBuffer[i][p] = param(array[i]);
            else if (typeof param === 'object')
                while (i--)
                    StandardLib._sortBuffer[i][p] = param[array[i]];
            else
                while (i--)
                    StandardLib._sortBuffer[i][p] = array[i][param];

            fields[p] = p;
            fieldOptions[p] = Array.RETURNINDEXEDARRAY | StandardLib.guessSortMode(StandardLib._sortBuffer, p) | sortDirection;
        }

        values = StandardLib._sortBuffer.slice(0, array.length);
        values = values.sortOn(fields, fieldOptions);

        if (returnSortedIndexArray)
            return values;

        var array2 = new Array();
        array2.length = array.length
        i = array.length;
        while (i--)
            array2[i] = array[values[i]];

        if (!inPlace)
            return array2;

        i = array.length;
        while (i--)
            array[i] = array2[i];
        return array;
    }

    /**
     * Guesses the appropriate Array.sort() mode based on the first non-undefined item property from an Array.
     * @return Either Array.NUMERIC or 0.
     */
    StandardLib.guessSortMode = function (array, itemProp) {
        var props = Object.keys(array);
        for (var i = 0; i < props.length; i++) {
            var item = array[props[i]];
            var value = item[itemProp];
            if (value !== undefined)
                return value.constructor === Number || value.constructor === Date ? Array.NUMERIC : 0;
        }
        return 0;
    }

    //testRoundSignificant();
    StandardLib.testRoundSignificant = function () {
        for (var pow = -5; pow <= 5; pow++) {
            var n = 1234.5678 * Math.pow(10, pow);
            for (var d = 0; d <= 9; d++)
                console.log('roundSignificant(', n, ',', d, ') =', StandardLib.roundSignificant(n, d));
        }
    }

    /**
     * @see https://github.com/bestiejs/punycode.js
     */
    StandardLib.ucs2encode = function (value) {
        var output = '';
        if (value > 0xFFFF) {
            value -= 0x10000;
            output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
            value = 0xDC00 | value & 0x3FF;
        }
        return output + String.fromCharCode(value);
    }

    StandardLib.argRef = new RegExp("^(0|[1-9][0-9]*)\}");

    /**
     * Substitutes "{n}" tokens within the specified string with the respective arguments passed in.
     * Same syntax as StringUtil.substitute() without the side-effects of using String.replace() with a regex.
     * @see String#replace()
     * @see mx.utils.StringUtil#substitute()
     */
    StandardLib.substitute = function (format) {
        var args = Array.prototype.slice.call(arguments);
        format = args.shift();
        if (args.length === 1 && args[0])
            args = args[0];

        var split = format.split('{')
        var output = split[0];
        for (var i = 1; i < split.length; i++) {
            var str = split[i];
            if (StandardLib.argRef.test(str)) {
                var j = str.indexOf("}");
                output += args[str.substring(0, j)];
                output += str.substring(j + 1);
            } else
                output += "{" + str;
        }
        return output;
    }


    /**
     * This function performs find and replace operations on a String.
     * @param string A String to perform replacements on.
     * @param findStr A String to find.
     * @param replaceStr A String to replace occurrances of the 'findStr' String with.
     * @param moreFindAndReplace A list of additional find,replace parameters to use.
     * @return The String with all the specified replacements performed.
     */
    StandardLib.replace = function (string, findStr, replaceStr, moreFindAndReplace) {
        var args = Array.prototype.slice.call(arguments);
        string = args.shift();
        findStr = args.shift();
        replaceStr = args.shift();
        moreFindAndReplace = args;
        string = string.split(findStr).join(replaceStr);
        while (moreFindAndReplace.length > 1) {
            findStr = moreFindAndReplace.shift();
            replaceStr = moreFindAndReplace.shift();
            string = string.split(findStr).join(replaceStr);
        }
        return string;
    }

    /**
     * Takes a script where all lines have been indented with tabs,
     * removes the common indentation from all lines and optionally
     * replaces extra leading tabs with a number of spaces.
     * @param script A script.
     * @param spacesPerTab If zero or greater, this is the number of spaces to be used in place of each tab character used as indentation.
     * @return The modified script.
     */

    StandardLib.unIndent = function (script, spacesPerTab) {
        if (script === null)
            return null;
        spacesPerTab = (spacesPerTab === undefined) ? -1 : spacesPerTab;
        // switch all line endings to \n
        script = StandardLib.replace(script, '\r\n', '\n', '\r', '\n');
        // remove trailing whitespace (not leading whitespace)
        script = ('.' + script).trim().substr(1);
        // separate into lines
        var lines = script.split('\n');
        // remove blank lines from the beginning
        while (lines.length && !lines[0].trim())
            lines.shift();
        // stop if there's nothing left
        if (!lines.length)
            return '';
        // find the common indentation
        var commonIndent = Number.MAX_VALUE;
        var line;
        for (var i = 0; i < lines.length; i++) {
            line = lines[i];
            // ignore blank lines
            if (!line.trim())
                continue;
            // count leading tabs
            var lineIndent = 0;
            while (line.charAt(lineIndent) === '\t')
                lineIndent++;
            // remember the minimum number of leading tabs
            commonIndent = Math.min(commonIndent, lineIndent);
        }

        // remove the common indentation from each line
        for (var j = 0; j < lines.length; j++) {
            line = lines[j];
            // prepare to remove common indentation
            var t = 0;
            while (t < commonIndent && line.charAt(t) === '\t')
                t++;
            // optionally, prepare to replace extra tabs with spaces
            var spaces = '';
            if (spacesPerTab >= 0) {
                while (line.charAt(t) === '\t') {
                    spaces += StandardLib.lpad('', spacesPerTab, '        ');
                    t++;
                }
            }
            // commit changes
            lines[j] = spaces + line.substr(t);
        }
        return lines.join('\n');
    }

    /**
     * Code from Graphics Gems Volume 1
     */
    StandardLib.getNiceNumber = function (x, round) {
        var exponent;
        var fractionalPart;
        var niceFractionalPart;

        // special case for nice number of 0, since Math.log(0) is -Infinity
        if (x === 0)
            return 0;

        exponent = Math.floor(Math.log(x) / Math.LN10);
        fractionalPart = x / Math.pow(10.0, exponent);

        if (round) {
            if (fractionalPart < 1.5) {
                niceFractionalPart = 1.0;
            } else if (fractionalPart < 3.0) {
                niceFractionalPart = 2.0;
            } else if (fractionalPart < 7.0) {
                niceFractionalPart = 5.0;
            } else {
                niceFractionalPart = 10.0;
            }
        } else {
            if (fractionalPart <= 1.0) {
                niceFractionalPart = 1.0;
            } else if (fractionalPart <= 2.0) {
                niceFractionalPart = 2.0;
            } else if (fractionalPart < 5.0) {
                niceFractionalPart = 5.0;
            } else {
                niceFractionalPart = 10.0;
            }
        }

        return niceFractionalPart * Math.pow(10.0, exponent);
    }


    /**
     * Code from Graphics Gems Volume 1
     * Note: This may return less than the requested number of values
     */
    StandardLib.getNiceNumbersInRange = function (min, max, numberOfValuesInRange) {
        // special case
        if (min === max)
            return [min];

        var nfrac;
        var d;
        var graphmin;
        var graphmax;
        var range;
        var x;
        var i = 0;

        var values = [];

        // Bug fix: getNiceNumbersInRange(0, 500, 6) returned [0,200,400] when it could be [0,100,200,300,400,500]
        // Was: range = getNiceNumber(max - min, false);
        range = max - min;

        d = StandardLib.getNiceNumber(range / (numberOfValuesInRange - 1), true);
        graphmin = Math.floor(min / d) * d;
        graphmax = Math.ceil(max / d) * d;

        nfrac = Math.max(-Math.floor(Math.log(d) / Math.LN10), 0);

        for (x = graphmin; x < graphmax + 0.5 * d; x += d) {
            values[i++] = StandardLib.roundSignificant(x); // this fixes values like x = 0.6000000000000001 that may occur from x += d
        }

        return values;
    }



    weavecore.StandardLib = StandardLib;
}());
