import Language from "./Language"
import StandardLib from "./StandardLib"

export default class JS
{
	constructor()
	{

	}

	REFLECTION_INFO() {
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

JS.prototype.CLASS_INFO = { names: [{ name: 'JS', qName: 'JS'}] };


JS.getGlobal = function(name) {
	var Fn = Function;
	var fn = new Fn("return " + name + ";");
	return fn();
};

JS.global = JS.getGlobal("this");
JS.console = JS.getGlobal("console");
JS.Symbol = JS.getGlobal("Symbol");

JS.error = function(args)
{
	args = Array.prototype.slice.call(arguments, 0);
	JS.console.error.apply(JS.console, args);
};

JS.log = function(args)
{
	args = Array.prototype.slice.call(arguments, 0);
	JS.console.log.apply(JS.console, args);
};

JS.unnamedFunctionRegExp = /^\s*function\s*\([^\)]*\)\s*\{[^]*\}\s*$/m;

/**
 * Compiles a script into a function with optional parameter names.
 */
JS.compile = function(script, paramNames, errorHandler)
{
	paramNames = typeof paramNames !== 'undefined' ? paramNames : null;
	errorHandler = typeof errorHandler !== 'undefined' ? errorHandler : null;

	var __localFn0__ = function() {
		try
		{
			return func.apply(this, arguments);
		}
		catch (e)
		{
			if (Language.is(e, SyntaxError))
			{
				args.pop();
				args.push(script);
				try
				{
					func = Function['apply'](null, args);
				}
				catch (e2)
				{
					if (Language.is(e2, SyntaxError))
						func = Function['apply']();
					return JS.handleScriptError(e2, 'compiling', script, paramNames, errorHandler);
				}
				try
				{
					return func.apply(this, arguments);
				}
				catch (e3)
				{
					return JS.handleScriptError(e3, 'evaluating', script, paramNames, errorHandler);
				}
			}
			return JS.handleScriptError(e, 'evaluating', script, paramNames, errorHandler);
		}
	};

	try {
		script = StandardLib.replace(script, '\r\n', '\n', '\r', '\n');
		var isFunc = JS.unnamedFunctionRegExp.test(script);
		if (isFunc)
			script = "(" + StandardLib.trim(script) + ")";
		var args = (paramNames || []).concat("return eval(" + JSON.stringify(script) + ");");
		var func = Function['apply'](null, args);
		if (isFunc)
			func = func();
		return __localFn0__;
	} catch (e) {
		JS.handleScriptError(e, 'compiling', script, paramNames, errorHandler);
		throw e;
	}
	return null;
};

JS.handleScriptError = function(e, doingWhat, script, paramNames, errorHandler)
{
	script = StandardLib.replace(script, '\n', '\n\t');
	script = StandardLib.trim(script);
	var paramsStr = paramNames && paramNames.length ? ' with params (' + paramNames.join(', ') + ')' : '';
	e.message = StandardLib.substitute('Error {0} script{1}:\n\t{2}\n{3}', doingWhat, paramsStr, script, e.message);
	if (errorHandler != null)
		return errorHandler(e);
	else
		throw e;
};

JS.ArrayBuffer = JS.getGlobal('ArrayBuffer');
JS.Uint8Array = JS.getGlobal('Uint8Array');
JS.DataView = JS.getGlobal('DataView');
JS.Promise = JS.getGlobal('Promise');
JS.Map = JS.getGlobal('Map');
JS.WeakMap = JS.getGlobal('WeakMap');

JS.mapKeys = function(map) {
	return map ? JS.toArray(map.keys()) : [];
};

JS.mapValues = function(map) {
	return map ? JS.toArray(map.values()) : [];
};

JS.mapEntries = function(map) {
	return map ? JS.toArray(map.entries()) : [];
};

/**
 * Tests if an object can be iterated over. If this returns true, then toArray()
 * can be called to get all the values from the iterator as an Array.
 */
JS.isIterable = function(value)
{
	return value && typeof(value[JS.Symbol.iterator]) === 'function';
};


/**
 * Language helper for converting array-like objects to Arrays
 * Extracts an Array of values from an Iterator object.
 * Converts Arguments object to an Array.
 * @export
 * @param {*} value
 * @return {Array}
 */
JS.toArray = function(value) {
	if (Language.is(value, Array))
		return value;
	if (value && typeof(value[JS.Symbol.iterator]) === 'function') {
		var iterator = value[JS.Symbol.iterator]();
		var values = [];
		while (true) {
			var next = iterator.next();
			if (next.done)
				break;
			values.push(next.value);
		}
		return values;
	}
	if (Object.prototype.toString.call(value) === '[object Arguments]')
		return Array.prototype.slice.call(value);
	return null;
};


JS.objectKeys = function(object) {
	return Object['keys'](object);
};


JS.isPrimitive = function(value) {
	return value === null || typeof(value) !== 'object';
};


/**
 * Makes a deep copy of an object.
 */
JS.copyObject = function(object, allowNonPrimitiveRefs) {
	allowNonPrimitiveRefs = typeof allowNonPrimitiveRefs !== 'undefined' ? allowNonPrimitiveRefs : false;
	if (object === null || typeof(object) !== 'object')
		return object;
	var copy;
	if (Language.is(object, Array)) {
		copy = [];
	} else if (Object['getPrototypeOf'](Object['getPrototypeOf'](object))) {
		if (allowNonPrimitiveRefs)
			copy = object;
		else
			throw new Error("copyObject() cannot copy non-primitive Objects");
	} else {
		copy = {};
	}
	for (var key in object)
		copy[key] = JS.copyObject(object[key], allowNonPrimitiveRefs);
	return copy;
};

JS.bindAll = function(instance) {
	var proto = Object['getPrototypeOf'](instance);
	for (var key in proto) {
		var prop = proto[key];
		if (typeof(prop) === 'function' && key !== 'constructor')
			instance[key] = prop.bind(instance);
	}
	return instance;
};


JS.isClass = function(classDef) {
	return typeof(classDef) === 'function' && classDef.prototype && classDef.prototype.constructor === classDef;
};


JS.asClass = function(classDef) {
	return JS.isClass(classDef) ? classDef : null;
};


JS.setTimeout = function(func, delay, params) {
	params = Array.prototype.slice.call(arguments, 2);
	params.unshift(func, delay);
	return JS.global['setTimeout'].apply(JS.global, params);
};


JS.clearTimeout = function(id) {
	JS.global['clearTimeout'](id);
};


JS.setInterval = function(func, delay, params) {
	params = Array.prototype.slice.call(arguments, 2);
	params.unshift(func, delay);
	return JS.global['setInterval'].apply(JS.global, params);
};


JS.clearInterval = function(id) {
	JS.global['clearInterval'](id);
};

JS.requestAnimationFrame = function(func) {
	return JS.global['requestAnimationFrame'].call(JS.global, func);
};

JS.cancelAnimationFrame = function(id) {
	JS.global['cancelAnimationFrame'].call(JS.global, id);
};


/**
 * Current time in milliseconds
 */
JS.now = function() {
	return Date['now']();
};


/**
 * Similar to Object.hasOwnProperty(), except it also checks prototypes.
 */
JS.hasProperty = function(object, prop) {
	while (object != null && !Object['getOwnPropertyDescriptor'](object, prop))
		object = Object['getPrototypeOf'](object);
	return object != null;
};

/**
 * Language helper for Object.getOwnPropertyNames()
 */
JS.getOwnPropertyNames = function(object) {
	return Object['getOwnPropertyNames'](object);
};


/**
 * Similar to Object.getOwnPropertyNames(), except it also checks prototypes.
 */
JS.getPropertyNames = function(object, useCache) {
	if (object == null || object === Object.prototype)
		return [];
	if (!JS.map_obj_names) {
		JS.map_obj_names = new JS.WeakMap();
		JS.map_prop_skip = new JS.Map();
	}
	if (useCache && JS.map_obj_names.has(object))
		return JS.map_obj_names.get(object);
	var names = JS.getPropertyNames(Object['getPrototypeOf'](object), useCache);
	if (useCache)
		names = names.concat();
	++JS.skip_id;
	var name;
	for (var i in names)
	{
		name = names[i];
		JS.map_prop_skip.set(name, JS.skip_id);
	}

	var ownNames = Object['getOwnPropertyNames'](object);
	for (var j in ownNames)
	{
		name = ownNames[j];
		{
			if (JS.map_prop_skip.get(name) !== JS.skip_id) {
				JS.map_prop_skip.set(name, JS.skip_id);
				names.push(name);
			}
		}}

	JS.map_obj_names.set(object, names);
	return names;
};

JS.map_obj_names;
JS.map_prop_skip;
JS.skip_id = 0;

