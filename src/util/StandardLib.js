import JS from "./JS"
import Language from "./Language"


export default class StandardLib
{
	constructor()
	{

	}

	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}

StandardLib.prototype.CLASS_INFO = { names: [{ name: 'StandardLib', qName: 'StandardLib'}] };


StandardLib.lodash;


StandardLib.formatNumber = function(number, precision) 
{
	precision = typeof precision !== 'undefined' ? precision : -1;
	return String(number);
};


/**
 * This function will cast a value of any type to a Number,
 * interpreting the empty string ("") and null as NaN.
 */
StandardLib.asNumber = function(value) 
{
	if (value == null)
		return NaN;
	if (Language.is(value, Number) || Language.is(value, Date))
		return Number(value);
	try 
	{
		var str = String(value);
		if (str == '')
			return NaN;
		if (str.charAt(0) === '#')
			return Number('0x' + str.substr(1));
		if (str.charAt(str.length - 1) === '%')
			return Number(str.substr(0, -1)) / 100;
		return Number(str);
	} 
	catch (e) 
	{
	}
	return NaN;
};


/**
 * Converts a value to a non-null String
 */
StandardLib.asString = function(value) 
{
	if (value == null)
		return '';
	return String(value);
};


/**
 * This function attempts to derive a boolean value from different types of objects.
 */
StandardLib.asBoolean = function(value) 
{
	if (Language.is(value, Boolean))
		return value;
	if (Language.is(value, String))
		return StandardLib.stringCompare(value, "true", true) == 0;
	if (isNaN(value))
		return false;
	if (Language.is(value, Number))
		return value != 0;
	return value;
};


/**
 * Tests if a value is anything other than undefined, null, or NaN.
 */
StandardLib.isDefined = function(value) 
{
	return value !== undefined && value !== null && !(Language.is(value, Number) && isNaN(value));
};


/**
 * Tests if a value is undefined, null, or NaN.
 */
StandardLib.isUndefined = function(value, orEmptyString) 
{
	orEmptyString = typeof orEmptyString !== 'undefined' ? orEmptyString : false;
	return value === undefined || value === null || (Language.is(value, Number) && isNaN(value)) || (orEmptyString && value === '');
};


/**
 * Pads a string on the left.
 */
StandardLib.lpad = function(str, length, padString) 
{
	padString = typeof padString !== 'undefined' ? padString : ' ';
	if (str.length >= length)
		return str;
	while (str.length + padString.length < length)
		padString += padString;
	return padString.substr(0, length - str.length) + str;
};


/**
 * Pads a string on the right.
 */
StandardLib.rpad = function(str, length, padString) 
{
	padString = typeof padString !== 'undefined' ? padString : ' ';
	if (str.length >= length)
		return str;
	while (str.length + padString.length < length)
		padString += padString;
	return str + padString.substr(0, length - str.length);
};


/**
 * This function performs find and replace operations on a String.
 */
StandardLib.replace = function(string, findStr, replaceStr, moreFindAndReplace) 
{
	moreFindAndReplace = Array.prototype.slice.call(arguments, 3);
	string = string.split(findStr).join(replaceStr);
	while (moreFindAndReplace.length > 1) {
		findStr = moreFindAndReplace.shift();
		replaceStr = moreFindAndReplace.shift();
		string = string.split(findStr).join(replaceStr);
	}
	return string;
};

StandardLib.argRef = new RegExp("^(0|[1-9][0-9]*)}");

StandardLib.substitute = function(format, args) 
{
	args = Array.prototype.slice.call(arguments, 1);
	if (format == null)
		return '';
	if (args.length == 1 && Language.is(args[0], Array))
		args = Language.as(args[0], Array);
	var split = format.split('{');
	var output = split[0];
	for (var i = 1; i < split.length; i++) {
		var str = Language.as(split[i], String);
		if (StandardLib.argRef.test(str)) {
			var j = str.indexOf("}");
			output += args[str.substring(0, j)];
			output += str.substring(j + 1);
		}
		else
			output += "{" + str;
	}
	return output;
};


/**
 * Takes a script where all lines have been indented with tabs,
 * removes the common indentation from all lines and optionally
 * replaces extra leading tabs with a number of spaces.
 */
StandardLib.unIndent = function(script, spacesPerTab)
{
	spacesPerTab = typeof spacesPerTab !== 'undefined' ? spacesPerTab : -1;
	if (script == null)
		return null;
	script = StandardLib.replace(script, '\r\n', '\n', '\r', '\n');
	script = StandardLib.trim('.' + script).substr(1);
	var lines = script.split('\n');
	while (lines.length && !StandardLib.trim(lines[0]))
		lines.shift();
	if (!lines.length) {
		return '';
	}
	var commonIndent = Number.MAX_VALUE;
	var line;
	for (var i in lines)
	{
		line = lines[i];
		{
			if (!StandardLib.trim(line))
				continue;
			var lineIndent = 0;
			while (line.charAt(lineIndent) == '\t')
				lineIndent++;
			commonIndent = Math.min(commonIndent, lineIndent);
		}}

	for (var  i = 0; i < lines.length; i++) {
		line = lines[i];
		var  t = 0;
		while (t < commonIndent && line.charAt(t) == '\t')
			t++;
		var spaces = '';
		if (spacesPerTab >= 0)
		{
			while (line.charAt(t) == '\t')
			{
				spaces += StandardLib.lpad('', spacesPerTab, '        ');
				t++;
			}
		}
		lines[i] = spaces + line.substr(t);
	}
	return lines.join('\n');
};


StandardLib.trim = function(str)
{
	if (str == null)
		return '';
	var  startIndex = 0;
	while (StandardLib.isWhitespace(str.charAt(startIndex)))
		++startIndex;
	var  endIndex = str.length - 1;
	while (StandardLib.isWhitespace(str.charAt(endIndex)))
		--endIndex;
	if (endIndex >= startIndex)
		return str.slice(startIndex, endIndex + 1);
	else
		return "";
};


StandardLib.isWhitespace = function(character) {
	switch (character) {
		case " ":

		case "\t":

		case "\r":

		case "\n":

		case "\f":

		case " ":

		case "\u2028":

		case "\u2029":

		case "　":
			return true;
		default:
			return false;
	}
};


/**
 * Converts a number to a String using a specific numeric base and optionally pads with leading zeros.
 */
StandardLib.numberToBase = function(number, base, zeroPad)
{
	base = typeof base !== 'undefined' ? base : 10;
	zeroPad = typeof zeroPad !== 'undefined' ? zeroPad : 1;
	if (!isFinite(number))
		return null;
	var  parts = Math.abs(number).toString(base).split('.');
	if (parts[0].length < zeroPad)
		parts[0] = StandardLib.lpad(parts[0], zeroPad, '0');
	if (number < 0)
		parts[0] = '-' + parts[0];
	return parts.join('.');
};


/**
 * This function returns -1 if the given value is negative, and 1 otherwise.
 */
StandardLib.sign = function(value)
{
	if (value < 0)
		return -1;
	return 1;
};


/**
 * This function constrains a number between min and max values.
 */
StandardLib.constrain = function(value, min, max)
{
	if (value < min)
		return min;
	if (value > max)
		return max;
	return value;
};

/**
 * Scales a number between 0 and 1 using specified min and max values.
 */
StandardLib.normalize = function(value, min, max)
{
	if (value < min || value > max)
		return NaN;
	if (min == max)
		return value - min;
	return (value - min) / (max - min);
};


/**
 * This function performs a linear scaling of a value from an input min,max range to an output min,max range.
 */
StandardLib.scale = function(inputValue, inputMin, inputMax, outputMin, outputMax)
{
	if (inputMin == inputMax)
	{
		if (isNaN(inputValue))
			return NaN;
		if (inputValue > inputMax)
			return outputMax;
		return outputMin;
	}
	return outputMin + (outputMax - outputMin) * (inputValue - inputMin) / (inputMax - inputMin);
};


/**
 * This rounds a Number to a given number of significant digits.
 */
StandardLib.roundSignificant = function(value, significantDigits)
{
	significantDigits = typeof significantDigits !== 'undefined' ? significantDigits : 14;
	if (!isFinite(value))
		return value;
	var  sign = (value < 0) ? -1 : 1;
	var  absValue = Math.abs(value);
	var  pow10;
	if (absValue < 1)
	{
		pow10 = Math.pow(10, significantDigits);
		return sign * Math.round(absValue * pow10) / pow10;
	}
	var  log10 = Math.ceil(Math.log(absValue) / Math.LN10);
	if (log10 < significantDigits)
	{
		pow10 = Math.pow(10, significantDigits - log10);
		return sign * Math.round(absValue * pow10) / pow10;
	}
	else
	{
		pow10 = Math.pow(10, log10 - significantDigits);
		return sign * Math.round(absValue / pow10) * pow10;
	}
};

StandardLib.testRoundSignificant = function()
{
	for (var  pow = -5; pow <= 5; pow++) {
		var  n = 1234.5678 * Math.pow(10, pow);
		for (var  d = 0; d <= 9; d++)
			console.log('roundSignificant(', n, ',', d, ') =', StandardLib.roundSignificant(n, d));
	}
};


/**
 * Rounds a number to the nearest multiple of a precision value.
 */
StandardLib.roundPrecision = function(number, precision)
{
	return Math.round(number / precision) * precision;
};


StandardLib.suggestPrecision = function(n, d)
{
	return Math.pow(10, Math.min(0, Math.ceil(Math.log(n) / Math.LN10) - d));
};


/**
 * Calculates an interpolated color for a normalized value.
 */
StandardLib.interpolateColor = function(normValue, colors)
{
	colors = Array.prototype.slice.call(arguments, 1);
	if (colors.length == 1 && Language.is(colors[0], Array))
		colors = colors[0];
	if (normValue < 0 || normValue > 1 || colors.length == 0)
		return NaN;
	var  maxIndex = colors.length - 1;
	var  leftIndex = Language._int(maxIndex * normValue);
	var  rightIndex = leftIndex + 1;
	if (rightIndex == colors.length)
		return colors[leftIndex];
	var  minColor = colors[leftIndex];
	var  maxColor = colors[rightIndex];
	normValue = normValue * maxIndex - leftIndex;
	var  percentLeft = 1 - normValue;
	var  percentRight = normValue;
	var  R = 0xFF0000;
	var  G = 0x00FF00;
	var  B = 0x0000FF;
	return (((percentLeft * (minColor & R) + percentRight * (maxColor & R)) & R) | ((percentLeft * (minColor & G) + percentRight * (maxColor & G)) & G) | ((percentLeft * (minColor & B) + percentRight * (maxColor & B)) & B));
};


/**
 * ITU-R 601
 */
StandardLib.getColorLuma = function(color) {
	return 0.3 * ((color & 0xFF0000) >> 16) + 0.59 * ((color & 0x00FF00) >> 8) + 0.11 * (color & 0x0000FF);
};


StandardLib.getHexColor = function(color) {
	if (color != (color & 0xFFFFFF))
		return null;
	return '#' + StandardLib.numberToBase(color, 16, 6);
};


/**
 * Code from Graphics Gems Volume 1
 */
StandardLib.getNiceNumber = function(x, round)
{
	var  exponent;
	var  fractionalPart;
	var  niceFractionalPart;
	if (x == 0)
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
};


/**
 * Code from Graphics Gems Volume 1
 */
StandardLib.getNiceNumbersInRange = function(min, max, numberOfValuesInRange)
{
	if (min == max)
		return [min];
	var  nfrac;
	var  d;
	var  graphmin;
	var  graphmax;
	var  range;
	var  x;
	var  i = 0;
	var  values = [];
	range = max - min;
	d = StandardLib.getNiceNumber(range / (numberOfValuesInRange - 1), true);
	graphmin = Math.floor(min / d) * d;
	graphmax = Math.ceil(max / d) * d;
	nfrac = Math.max(-Math.floor(Math.log(d) / Math.LN10), 0);
	for (x = graphmin; x < graphmax + 0.5 * d; x += d) {
		values[i++] = StandardLib.roundSignificant(x);
	}
	return values;
};


/**
 * Calculates the mean value from a list of Numbers.
 */
StandardLib.mean = function(args)
{
	args = Array.prototype.slice.call(arguments, 0);
	if (args.length == 1 && Language.is(args[0], Array))
		args = args[0];
	var  sum = 0;
	for (var i in args)
	{
		var value = args[i];

		sum += value;}

	return sum / args.length;
};


/**
 * Calculates the sum of a list of Numbers.
 */
StandardLib.sum = function(args)
{
	args = Array.prototype.slice.call(arguments, 0);
	if (args.length == 1 && Language.is(args[0], Array))
		args = args[0];
	var  sum = 0;
	for (var i in args)
	{
		var value = args[i];

		sum += value;}

	return sum;
};

//todo: do we need AS3 prefix?
StandardLib.AS3_CASEINSENSITIVE = 1;
StandardLib.AS3_DESCENDING = 2;
StandardLib.AS3_UNIQUESORT = 4;
StandardLib.AS3_RETURNINDEXEDARRAY = 8;
StandardLib.AS3_NUMERIC = 16;


StandardLib.LODASH_ASCENDING = "asc";
StandardLib.LODASH_DESCENDING = "desc";


StandardLib._indexMap;


StandardLib.as3SortOn = function(array, fieldNames, options) {
	var __localFn0__ = function(option) {
		return option & StandardLib.AS3_RETURNINDEXEDARRAY;
	};
	var __localFn1__ = function(option) {
		return option & StandardLib.AS3_UNIQUESORT;
	};
	var __localFn2__ = function(option) {
		return (option & StandardLib.AS3_DESCENDING) ? StandardLib.LODASH_DESCENDING : StandardLib.LODASH_ASCENDING;
	};
	var __localFn3__ = function(option, index) {
		var __localFn0__ = function(item) {
			if (item === undefined || item === null)
				return "";
			return String(item[fieldName]);
		};
		var __localFn1__ = function(item) {
			if (item === undefined || item === null)
				return "";
			return String(item[fieldName]).toLocaleLowerCase();
		}
		var customConvert;
		var  fieldName = fieldNames[index];
		if (!(option & StandardLib.AS3_NUMERIC)) {
			customConvert = __localFn0__;
		} else if (option & StandardLib.AS3_CASEINSENSITIVE) {
			customConvert = __localFn1__;
		}
		return customConvert || fieldNames[index];
	}
	var  __localFn4__ = function(item, index) {
		StandardLib._indexMap.set(item, index);
	}
	var  __localFn5__ = function(item) {
		return StandardLib._indexMap.get(item);
	}
	if (!Language.is(fieldNames, Array))
		fieldNames = [fieldNames];
	if (!Language.is(options, Array))
		options = [options];
	var  returnIndexedArray = options.some(__localFn0__);
	var  uniqueSort = options.some(__localFn1__);
	var  orders = options.map(__localFn2__);
	var  iteratees = options.map(__localFn3__);
	if (!StandardLib._indexMap)
		StandardLib._indexMap = new weavejs.util.JS.Map();
	StandardLib._indexMap.clear();
	if (returnIndexedArray) {
		if (!StandardLib.arrayIsType(array, Object))
			JS.error("Warning: Can't do an indexed array sort of non-objects reliably, as there's a higher chance of non-unique items.");
		array.forEach(__localFn4__);
	}
	var result = StandardLib.lodash.sortByOrder(array, iteratees, orders);
	if (returnIndexedArray) {
		result = result.map(__localFn5__);
	}
	return result;
};


/**
 * @private
 * @const
 * @type {Array}
 */
StandardLib._sortBuffer = [];


/**
 * Sorts an Array of items in place using properties, lookup tables, or replacer functions.
 */
StandardLib.sortOn = function(array, params, sortDirections, inPlace, returnSortedIndexArray)
{
	sortDirections = typeof sortDirections !== 'undefined' ? sortDirections : undefined;
	inPlace = typeof inPlace !== 'undefined' ? inPlace : true;
	returnSortedIndexArray = typeof returnSortedIndexArray !== 'undefined' ? returnSortedIndexArray : false;
	if (array.length == 0)
		return inPlace ? array : [];
	var  values;
	var  param;
	var  sortDirection;
	var  i;
	for (i = StandardLib._sortBuffer.length; i < array.length; i++)
		StandardLib._sortBuffer[i] = [];
	if (params === array || !Language.is(params, Array)) {
		params = [params];
		if (sortDirections)
			sortDirections = [sortDirections];
	}
	var  fields = new Array(params.length);
	var  fieldOptions = new Array(params.length);
	for (var  p = 0; p < params.length; p++) {
		param = params[p];
		sortDirection = sortDirections && sortDirections[p] < 0 ? StandardLib.AS3_DESCENDING : 0;
		i = array.length;
		if (Language.is(param, Array))
			while (i--)
				StandardLib._sortBuffer[i][p] = param[i];
		else if (Language.is(param, Function))
			while (i--)
				StandardLib._sortBuffer[i][p] = param(array[i]);
		else if (Language.is(param, weavejs.util.JS.Map) || Language.is(param, weavejs.util.JS.WeakMap))
			while (i--)
				StandardLib._sortBuffer[i][p] = param.get(array[i]);
		else if (typeof(param) === 'object')
			while (i--)
				StandardLib._sortBuffer[i][p] = param[array[i]];
		else
			while (i--)
				StandardLib._sortBuffer[i][p] = array[i][param];
		fields[p] = p;
		fieldOptions[p] = StandardLib.AS3_RETURNINDEXEDARRAY | StandardLib.guessSortMode(StandardLib._sortBuffer, p) | sortDirection;
	}
	values = StandardLib._sortBuffer.slice(0, array.length);
	values = StandardLib.as3SortOn(values, fields, fieldOptions);
	if (returnSortedIndexArray)
		return values;
	var  array2 = new Array(array.length);
	i = array.length;
	while (i--)
		array2[i] = array[values[i]];
	if (!inPlace)
		return array2;
	i = array.length;
	while (i--)
		array[i] = array2[i];
	return array;
};


/**
 * Guesses the appropriate Array.sort() mode based on the first non-undefined item property from an Array.
 */
StandardLib.guessSortMode = function(array, itemProp)
{
	for (var i in array)
	{
		var item = array[i];
		{
			var value = item[itemProp];
			if (value !== undefined)
				return Language.is(value, Number) || Language.is(value, Date) ? 16 : 0;
		}}

	return 0;
};


/**
 * This will return the type of item found in the Array if each item has the same type.
 */
StandardLib.getArrayType = function(a)
{
	if (a == null || a.length == 0 || a[0] == null)
		return null;
	var type = Object(a[0]).constructor;
	for (var i in a)
	{
		var item = a[i];

		if (item == null || item.constructor != type)
			return null;}

	return type;
};


/**
 * Checks if all items in an Array are instances of a given type.
 *
 */
StandardLib.arrayIsType = function(a, type)
{
	for (var i in a)
	{
		var item = a[i];

		if (!Language.is(item, type))
			return false;}

	return true;
};


/**
 * This will perform a log transformation on a normalized value to produce another normalized value.
 */
StandardLib.logTransform = function(normValue, factor)
{
	factor = typeof factor !== 'undefined' ? factor : 1024;
	return Math.log(1 + normValue * factor) / Math.log(1 + factor);
};


/**
 * This will generate a date string from a Number or a Date object using the specified date format.
 */
StandardLib.formatDate = function(value, formatString, formatAsUniversalTime)
{
	formatString = typeof formatString !== 'undefined' ? formatString : null;
	formatAsUniversalTime = typeof formatAsUniversalTime !== 'undefined' ? formatAsUniversalTime : true;
	if (Language.is(value, Number)) {
		var date = new Date();
		date.setTime(Language.as(value, Number));
		value = date;
	}
	return String(value);
};


/**
 * @private
 * @const
 * @type {number}
 */
StandardLib._timezoneMultiplier = 60000;


/**
 * This compares two dynamic objects or primitive values and is much faster than ObjectUtil.compare().
 * Does not check for circular refrences.
 */
StandardLib.compare = function(a, b, objectCompare)
{
	objectCompare = typeof objectCompare !== 'undefined' ? objectCompare : null;
	var  c;
	if (a === b)
		return 0;
	if (a == null)
		return 1;
	if (b == null)
		return -1;
	var  typeA = typeof(a);
	var  typeB = typeof(b);
	if (typeA != typeB)
		return StandardLib.stringCompare(typeA, typeB);
	if (typeA == 'boolean')
		return StandardLib.numericCompare(Number(a), Number(b));
	if (typeA == 'number')
		return StandardLib.numericCompare(Language.as(a, Number), Language.as(b, Number));
	if (typeA == 'string')
		return StandardLib.stringCompare(Language.as(a, String), Language.as(b, String));
	if (typeA != 'object')
		return 1;
	if (Language.is(a, Date) && Language.is(b, Date))
		return StandardLib.dateCompare(Language.as(a, Date), Language.as(b, Date));
	if (Language.is(a, Array) && Language.is(b, Array)) {
		var  an = a.length;
		var  bn = b.length;
		if (an < bn)
			return -1;
		if (an > bn)
			return 1;
		for (var  i = 0; i < an; i++) {
			c = StandardLib.compare(a[i], b[i]);
			if (c != 0)
				return c;
		}
		return 0;
	}
	if (objectCompare != null) {
		var  result = objectCompare(a, b);
		if (isFinite(result))
			return result;
	}
	var  qna = String(a);
	var  qnb = String(b);
	if (qna != qnb)
		return StandardLib.stringCompare(qna, qnb);
	var  p;
	for (p in a) {
		if (!b.hasOwnProperty(p))
			return -1;
	}
	for (p in b) {
		if (!a.hasOwnProperty(p))
			return 1;
		c = StandardLib.compare(a[p], b[p]);
		if (c != 0)
			return c;
	}
	return 0;
};

StandardLib.numericCompare = function(a, b) {
	if (isNaN(a) && isNaN(b))
		return 0;
	if (isNaN(a))
		return 1;
	if (isNaN(b))
		return -1;
	if (a < b)
		return -1;
	if (a > b)
		return 1;
	return 0;
};


StandardLib.stringCompare = function(a, b, caseInsensitive) {
	caseInsensitive = typeof caseInsensitive !== 'undefined' ? caseInsensitive : false;
	if (a == null && b == null)
		return 0;
	if (a == null)
		return 1;
	if (b == null)
		return -1;
	if (caseInsensitive) {
		a = String(a).toLocaleLowerCase();
		b = String(b).toLocaleLowerCase();
	}
	var  result = String(a).localeCompare(b);
	if (result < -1)
		result = -1;
	else if (result > 1)
		result = 1;
	return result;
};

StandardLib.dateCompare = function(a, b) {
	if (a == null && b == null)
		return 0;
	if (a == null)
		return 1;
	if (b == null)
		return -1;
	var  na = a.getTime();
	var  nb = b.getTime();
	if (na < nb)
		return -1;
	if (na > nb)
		return 1;
	if (isNaN(na) && isNaN(nb))
		return 0;
	if (isNaN(na))
		return 1;
	if (isNaN(nb))
		return -1;
	return 0;
};


/**
 * @see https://github.com/bestiejs/punycode.js
 */
StandardLib.ucs2encode = function(value) {
	var  output = '';
	if (value > 0xFFFF) {
		value -= 0x10000;
		output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
		value = 0xDC00 | value & 0x3FF;
	}
	return output + String.fromCharCode(value);
};


StandardLib.guid = function() {
	return StandardLib.s4() + StandardLib.s4() + '-' + StandardLib.s4() + '-' + StandardLib.s4() + '-' + StandardLib.s4() + '-' + StandardLib.s4() + StandardLib.s4() + StandardLib.s4();
};


StandardLib.s4 = function() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};


/**
 * Converts a Uint8Array to a binary String
 */
StandardLib.byteArrayToString = function(byteArray) {
	var  CHUNK_SIZE = 8192;
	var  n = byteArray.length;
	if (n <= CHUNK_SIZE)
		return String.fromCharCode.apply(String, byteArray);
	var  strings = [];
	for (var  i = 0; i < byteArray.length;)
		strings.push(String.fromCharCode.apply(null, byteArray.subarray(i, i += CHUNK_SIZE)));
	return strings.join('');
};

