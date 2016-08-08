

import WeavePathUI from "./path/WeavePathUI";
import WeaveAPI from "./WeaveAPI";

import Language from "./util/Language";
import JS from "./util/JS";
import StandardLib from "./util/StandardLib";
import Dictionary2D from "./util/Dictionary2D";
import DebugUtils from "./util/DebugUtils";

import LinkableFunction from "./core/LinkableFunction";
import SessionStateLog from "./core/SessionStateLog";

import ILinkableObject from "./api/core/ILinkableObject";
import ILinkableHashMap from "./api/core/ILinkableHashMap";
import ILinkableDynamicObject from "./api/core/ILinkableDynamicObject";
import IDisposableObject from "./api/core/IDisposableObject";
import DynamicState from "./api/core/DynamicState";




export default class Weave
{
	constructor()
	{

		
		this['WeavePath'] = WeavePathUI;
		this.root = Weave.disposableChild(this, WeaveAPI.ClassRegistry.getImplementations(ILinkableHashMap)[0]);
		this.history = Weave.disposableChild(this, new SessionStateLog(this.root, Weave.HISTORY_SYNC_DELAY));
		Weave.map_root_weave.set(this.root, this);

		//prototype will have the same method and instance will have that method too, as we attacehd to this
		// till => function becomes dominant we have to use this way
		this.dispose = this.dispose.bind(this);
		this.macro = this.macro.bind(this);
		this.path = this.path.bind(this);
		this.getObject = this.getObject.bind(this);
		this.requestObject = this.requestObject.bind(this);
		this.removeObject = this.removeObject.bind(this);

		this.triggerColumns = this.triggerColumns.bind(this);
		this.triggerAll = this.triggerAll.bind(this);
		this.populateColumns = this.populateColumns.bind(this);
		this.stringifyState = this.stringifyState.bind(this);
	}

	dispose()
	{
		Weave.dispose(this);
		Weave.map_root_weave['delete'](this.root);
		this.root = null;
		this.history = null;
	};

	macro(name, params) 
	{
		params = Array.prototype.slice.call(arguments, 1);
		var macros = this.getObject('WeaveProperties', 'macros');
		if (!macros)
			throw new Error("macros hash map not found");
		//todo: do we need to use Weave.getDefinition here as we can import and use directly
		var LinkableFunction = Weave.getDefinition('LinkableFunction');
		var  fn = macros.getObject(name);
		if (!fn)
			throw new Error("Macro does not exist: " + name);
		return fn.apply(null, params);
	};


	/**
	 * Creates a WeavePath object.  WeavePath objects are immutable after they are created.
	 * This is a shortcut for "new WeavePath(weave, basePath)".
	 */
	path(basePath) 
	{
		basePath = Array.prototype.slice.call(arguments, 0);
		if (basePath.length == 1 && Language.is(basePath[0], Array))
			basePath = basePath[0];
		if (basePath.length == 1 && Weave.isLinkable(basePath[0]))
			basePath = Weave.findPath(this.root, basePath[0]);
		return basePath ? new WeavePathUI(this, basePath) : null;
	};

	/**
	 * Gets the ILinkableObject at a specified path.
	 */
	getObject(path) 
	{
		path = Array.prototype.slice.call(arguments, 0);
		if (path.length == 1) {
			if (Language.is(path[0], WeavePath))
				return path[0].getObject();
			if (Language.is(path[0], Array))
				path = path[0];
		}
		return Weave.followPath(this.root, path);
	};


	/**
	 * Requests that an object be created if it doesn't already exist at the given path.
	 */
	requestObject(path, type)
	{
		var parentPath = path.concat();
		var childName = parentPath.pop();
		var parent = Weave.followPath(this.root, parentPath);
		//todo : replace next two line with JS style
		var hashMap = Language.as(parent, ILinkableHashMap);
		var dynamicObject = Language.as(parent,ILinkableDynamicObject);
		var child = null;
		if (hashMap)
		{
			if (Language.is(childName, Number))
				childName = hashMap.getNames()[childName];
			child = hashMap.requestObject(Language.as(childName, String), type, false);
		}
		else if (dynamicObject)
			child = dynamicObject.requestGlobalObject(Language.as(childName, String), type, false);
		else
			child = Weave.followPath(this.root, path);
		if (child && child.constructor == type)
			return child;
		return null;
	};

	removeObject(path)
	{
		this.requestObject(path, null);
	};

	/**
	 * For testing purposes.
	 * @export
	 */
	triggerColumns() {
		this.triggerAll('ReferencedColumn');
	};


	/**
	 * For testing purposes.
	 * @export
	 * @param {*} filter
	 */
	triggerAll(filter)
	{
		var self = this;
		var __localFn0__ = function(obj) {
			Weave.getCallbacks(obj).triggerCallbacks();
		};
		if (Language.is(filter, String))
			filter = Weave.getDefinition(filter);

		Weave.getDescendants(this.root, JS.asClass(filter)).forEach(__localFn0__);
	};


	/**
	 * For testing purposes.
	 * @export
	 */
	// todo: move this to weavedata project
	populateColumns()
	{
		var RefCol = Weave.getDefinition('ReferencedColumn');
		var ExtDynCol = Weave.getDefinition('ExtendedDynamicColumn');
		// todo: can we get definition of IAttributeColumn
		var IAttributeColumn = Weave.getDefinition('IAttributeColumn');
		var all = Weave.getDescendants(this.root, ILinkableDynamicObject);
		var def = [];
		var undef = [];
		
		for (var i in all)
		{
			var item = all[i];
			{
				var col = Language.as(item, IAttributeColumn);
				if (!col)
					continue;
				if (Language.is(item.target, RefCol))
					def.push(item);
				if (!item.target)
					undef.push(item);
			}}

		for (var i = 0; i < undef.length; i++)
			Weave.copyState(def[i % def.length], undef[i]);
	};


	/**
	 * For testing purposes.
	 * @export
	 * @param {...} pathOrType
	 * @return {string}
	 */
	stringifyState(pathOrType)
	{
		pathOrType = Array.prototype.slice.call(arguments, 0);
		var object;
		if (JS.isClass(pathOrType[0]))
			object = this.root.getObjects(pathOrType[0])[0];
		else
			object = this.getObject(pathOrType);

		var state = Weave.getState(object);
		return Weave.stringify(state, null, '\t');
	};


	/**
	 * Temporary solution
	 */
	createScript (name, targets, script, groupedCallback)
	{
		groupedCallback = typeof groupedCallback !== 'undefined' ? groupedCallback : false;
		var lcs = this.root.requestObject(name, Weave.getDefinition('LinkableCallbackScript'));
		var  array = [];
		for (var  key in targets)
			array.push(DynamicState.create(key, 'LinkableDynamicObject', targets[key]));
		Weave.setState(org.apache.flex.utils.Language.as(lcs, ILinkableObject), {script:script, variables:array, groupedCallback:groupedCallback}, true);
		return lcs;
	};

	/**
	 * Reflection
	 *
	 * @return {Object.<string, Function>}
	 */
	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
					'root': { type: 'ILinkableHashMap'},
					'history': { type: 'SessionStateLog'}
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'Weave': { type: '', declaredBy: 'Weave'},
					'dispose': { type: 'void', declaredBy: 'Weave'},
					'macro': { type: '*', declaredBy: 'Weave'},
					'path': { type: 'WeavePath', declaredBy: 'Weave'},
					'getObject': { type: 'ILinkableObject', declaredBy: 'Weave'},
					'requestObject': { type: 'ILinkableObject', declaredBy: 'Weave'},
					'removeObject': { type: 'void', declaredBy: 'Weave'},
					'triggerColumns': { type: 'void', declaredBy: 'Weave'},
					'triggerAll': { type: 'void', declaredBy: 'Weave'},
					'populateColumns': { type: 'void', declaredBy: 'Weave'},
					'stringifyState': { type: 'String', declaredBy: 'Weave'},
					'createScript': { type: 'Object', declaredBy: 'Weave'}
				};
			}
		};
	};

}

Weave.prototype.CLASS_INFO = { names: [{ name: 'Weave', qName: 'Weave'}], interfaces: [IDisposableObject] };


Weave.HISTORY_SYNC_DELAY = 100;
Weave.FRAME_INTERVAL = 1000 / 30;
Weave.beta = false;

Weave.map_root_weave = new JS.Map();

Weave.getWeave = function(object) {
	var sm = WeaveAPI.SessionManager;
	while (object && !Language.is(object, Weave))
		object = sm.getOwner(object);
	return object;
};


/**
 * Gets a WeavePath from an ILinkableObject.
 */
Weave.getPath = function(object) {
	var weave = Weave.getWeave(object);
	return weave ? weave.path(object) : null;
};


/**
 * Shortcut for WeaveAPI.SessionManager.getPath()
 */
Weave.findPath = function(root, descendant)
{
	return WeaveAPI.SessionManager.getPath(root, descendant);
};


/**
 * Shortcut for WeaveAPI.SessionManager.getObject()
 */
Weave.followPath = function(root, path)
{
	return WeaveAPI.SessionManager.getObject(root, path);
};


/**
 * Shortcut for WeaveAPI.SessionManager.getCallbackCollection()
 */
Weave.getCallbacks = function(linkableObject)
{
	return WeaveAPI.SessionManager.getCallbackCollection(linkableObject);
};


/**
 * This function is used to detect if callbacks of a linkable object were triggered since the last time this function
 * was called with the same parameters, likely by the observer.  Note that once this function returns true, subsequent calls will
 * return false until the callbacks are triggered again.  It's a good idea to specify a private object or function as the observer
 * so no other code can call detectChange with the same observer and linkableObject parameters.
 */
Weave.detectChange = function(observer, linkableObject, moreLinkableObjects)
{
	moreLinkableObjects = Array.prototype.slice.call(arguments, 2);
	var changeDetected = false;
	moreLinkableObjects.unshift(linkableObject);
	for (var i in moreLinkableObjects)
	{
		linkableObject = moreLinkableObjects[i];

		if (linkableObject && Weave._internalDetectChange(observer, linkableObject, true))
			changeDetected = true;}

	return changeDetected;
};


/**
 * This function is used to detect if callbacks of a linkable object were triggered since the last time detectChange
 * was called with the same parameters, likely by the observer.  Note that once this function returns true, subsequent calls will
 * return false until the callbacks are triggered again, unless clearChangedNow is set to false.  It may be a good idea to specify
 * a private object as the observer so no other code can call detectChange with the same observer and linkableObject
 * parameters.
 */
Weave._internalDetectChange = function(observer, linkableObject, clearChangedNow)
{
	clearChangedNow = typeof clearChangedNow !== 'undefined' ? clearChangedNow : true;
	var previousCount = Weave.d2d_linkableObject_observer_triggerCounter.get(linkableObject, observer);
	var newCount = WeaveAPI.SessionManager.getCallbackCollection(linkableObject).triggerCounter;
	if (previousCount !== newCount) {
		if (clearChangedNow)
			Weave.d2d_linkableObject_observer_triggerCounter.set(linkableObject, observer, newCount);
		return true;
	}
	return false;
};

Weave.d2d_linkableObject_observer_triggerCounter = new Dictionary2D(true, true);

/**
 * Finds the root ILinkableHashMap for a given ILinkableObject.
 */
Weave.getRoot = function(object) {
	var sm = WeaveAPI.SessionManager;
	while (true) {
		var owner = sm.getLinkableOwner(object);
		if (!owner)
			break;
		object = owner;
	}
	return Weave.wasDisposed(object) ? null : object;
};


/**
 * Finds the closest ancestor of a descendant given the ancestor type.
 */
Weave.getAncestor = function(descendant, ancestorType)
{
	if (Language.is(ancestorType, String))
		ancestorType = Weave.getDefinition(String(ancestorType), true);
	var sm = WeaveAPI.SessionManager;
	do {
		descendant = sm.getLinkableOwner(descendant);
	} while (descendant && !Language.is(descendant, ancestorType));
	
	return descendant;
};


/**
 * Shortcut for WeaveAPI.SessionManager.getLinkableOwner()
 */
Weave.getOwner = function(child) 
{
	return WeaveAPI.SessionManager.getLinkableOwner(child);
};


/**
 * Shortcut for WeaveAPI.SessionManager.getLinkableDescendants()
 */
Weave.getDescendants = function(object, filter)
{
	filter = typeof filter !== 'undefined' ? filter : null;
	if (Language.is(filter, String))
		filter = Weave.getDefinition(String(filter), true);
	return WeaveAPI.SessionManager.getLinkableDescendants(object, filter);
};


/**
 * Shortcut for WeaveAPI.SessionManager.getSessionState()
 */
Weave.getState = function(linkableObject) 
{
	return WeaveAPI.SessionManager.getSessionState(linkableObject);
};


/**
 * Shortcut for WeaveAPI.SessionManager.setSessionState()
 */
Weave.setState = function(linkableObject, newState, removeMissingDynamicObjects) 
{
	removeMissingDynamicObjects = typeof removeMissingDynamicObjects !== 'undefined' ? removeMissingDynamicObjects : true;
	WeaveAPI.SessionManager.setSessionState(linkableObject, newState, removeMissingDynamicObjects);
};


/**
 * Shortcut for WeaveAPI.SessionManager.copySessionState()
 */
Weave.copyState = function(source, destination) 
{
	WeaveAPI.SessionManager.copySessionState(source, destination);
};


/**
 * Shortcut for WeaveAPI.SessionManager.linkSessionState()
 */
Weave.linkState = function(primary, secondary)
{
	WeaveAPI.SessionManager.linkSessionState(primary, secondary);
};


/**
 * Shortcut for WeaveAPI.SessionManager.unlinkSessionState()
 */
Weave.unlinkState = function(first, second) 
{
	WeaveAPI.SessionManager.unlinkSessionState(first, second);
};


/**
 * Shortcut for WeaveAPI.SessionManager.computeDiff()
 */
Weave.computeDiff = function(oldState, newState) 
{
	return WeaveAPI.SessionManager.computeDiff(oldState, newState);
};


/**
 * Shortcut for WeaveAPI.SessionManager.combineDiff()
 */
Weave.combineDiff = function(baseDiff, diffToAdd) 
{
	return WeaveAPI.SessionManager.combineDiff(baseDiff, diffToAdd);
};


/**
 * Shortcut for WeaveAPI.SessionManager.newDisposableChild() and WeaveAPI.SessionManager.registerDisposableChild()
 */
Weave.disposableChild = function(disposableParent, disposableChildOrType)
{
	if (JS.isClass(disposableChildOrType))
		return WeaveAPI.SessionManager.newDisposableChild(disposableParent, disposableChildOrType);
	return WeaveAPI.SessionManager.registerDisposableChild(disposableParent, disposableChildOrType);
};


Weave.linkableChild = function(linkableParent, linkableChildOrType, callback, useGroupedCallback) 
{
	callback = typeof callback !== 'undefined' ? callback : null;
	useGroupedCallback = typeof useGroupedCallback !== 'undefined' ? useGroupedCallback : false;
	if (JS.isClass(linkableChildOrType))
		return WeaveAPI.SessionManager.newLinkableChild(linkableParent,linkableChildOrType, callback, useGroupedCallback);
	return WeaveAPI.SessionManager.registerLinkableChild(linkableParent, linkableChildOrType, callback, useGroupedCallback);
};


/**
 * Shortcut for WeaveAPI.SessionManager.newLinkableChild() and WeaveAPI.SessionManager.registerLinkableChild() except the child will not be included in the session state.
 */
Weave.privateLinkableChild = function(linkableParent, linkableChildOrType, callback, useGroupedCallback) 
{
	callback = typeof callback !== 'undefined' ? callback : null;
	useGroupedCallback = typeof useGroupedCallback !== 'undefined' ? useGroupedCallback : false;
	var child = Weave.linkableChild(linkableParent, linkableChildOrType, callback, useGroupedCallback);
	WeaveAPI.SessionManager['excludeLinkableChildFromSessionState'](linkableParent, child);
	return child;
};


/**
 * Shortcut for WeaveAPI.SessionManager.disposeObject()
 */
Weave.dispose = function(object)
{
	WeaveAPI.SessionManager.disposeObject(object);
};


/**
 * Shortcut for WeaveAPI.SessionManager.objectWasDisposed()
 */
Weave.wasDisposed = function(object) 
{
	return WeaveAPI.SessionManager.objectWasDisposed(object);
};


/**
 * Shortcut for WeaveAPI.SessionManager.linkableObjectIsBusy()
 */
Weave.isBusy = function(object) 
{
	return WeaveAPI.SessionManager.linkableObjectIsBusy(object);
};


/**
 * Checks if an object or class implements ILinkableObject
 */
Weave.isLinkable = function(objectOrClass) 
{
	if (Language.is(objectOrClass, ILinkableObject) || objectOrClass === ILinkableObject)
		return true;
	return objectOrClass ? Language.is(objectOrClass.prototype, ILinkableObject) : false;
};


Weave.IS = function(object, type)
{
	return Language.is(object, type);
};


Weave.AS = function(object, type) {
	return Language.as(object, type);
};


Weave.map_class_isAsync = new JS.Map();

/**
 * Registers a class that must be instantiated asynchronously.
 * Dynamic items in the session state that extend this class will be replaced with
 * LinkablePlaceholder objects that can be replaced with actual instances later.
 */
Weave.registerAsyncClass = function(type, instanceHandler)
{
	var valueInMap = instanceHandler || true;
	Weave.map_class_isAsync.set(type, valueInMap);
	var keys = JS.mapKeys(Weave.map_class_isAsync);
	for (var i in keys)
	{
		var cachedType = keys[i];
		{
			if (!Weave.map_class_isAsync.get(cachedType) && type.isPrototypeOf(cachedType)) {
				Weave.map_class_isAsync.set(cachedType, valueInMap);
			}
		}}

};


/**
 * Checks if a class is or extends one that was registered through registerAsyncClass().
 */
Weave.isAsyncClass = function(type)
{
	if (Weave.map_class_isAsync.has(type))
		return Weave.map_class_isAsync.get(type);
	var keys = JS.mapKeys(Weave.map_class_isAsync);
	for (var i in keys)
	{
		var cachedType = keys[i];
		{
			var valueInMap = Weave.map_class_isAsync.get(cachedType);
			if (valueInMap && cachedType.isPrototypeOf(type))
			{
				Weave.map_class_isAsync.set(type, valueInMap);
				return true;
			}
		}}

	Weave.map_class_isAsync.set(type, false);
	return false;
};


/**
 * Gets the function that was passed in to registerAsyncClass() for a given type.
 */
Weave.getAsyncInstanceHandler = function(type)
{
	return Weave.isAsyncClass(type) ? Weave.map_class_isAsync.get(type) : null;
};


/**
 * Registers an ILinkableObject class for use with Weave.className() and Weave.getDefinition().
 */
Weave.registerClass = function(definition, qualifiedName, additionalInterfaces, displayName)
{
	additionalInterfaces = typeof additionalInterfaces !== 'undefined' ? additionalInterfaces : null;
	displayName = typeof displayName !== 'undefined' ? displayName : null;
	var  names = Language.as(qualifiedName, Array) || [qualifiedName];
	for (var index in names) {
		if (index == '0')
			WeaveAPI.ClassRegistry.registerClass(definition, names[index], [ILinkableObject].concat(additionalInterfaces || []), displayName);
		else
			WeaveAPI.ClassRegistry.registerClass(definition, names[index]);
	}
};


Weave.className = function(def)
{
	return WeaveAPI.ClassRegistry.getClassName(def);
};


/**
 * Looks up a static definition by name.
 */
Weave.getDefinition = function(name, throwIfNotFound)
{
	throwIfNotFound = typeof throwIfNotFound !== 'undefined' ? throwIfNotFound : false;
	var result = WeaveAPI.ClassRegistry.getDefinition(name);
	if (result === undefined && throwIfNotFound)
		throw new Error("No definition for " + JSON.stringify(name));
	return result;
};


/**
 * Generates a deterministic JSON-like representation of an object, meaning object keys appear in sorted order.
 */
Weave.stringify = function(value, replacer, indent, json_values_only)
{
	replacer = typeof replacer !== 'undefined' ? replacer : null;
	indent = typeof indent !== 'undefined' ? indent : null;
	json_values_only = typeof json_values_only !== 'undefined' ? json_values_only : false;
	indent = typeof(indent) === 'number' ? StandardLib.lpad('', indent, ' ') : Language.as(indent, String) || '';
	return Weave._stringify("", value, replacer, indent ? '\n' : '', indent, json_values_only);
};

Weave._stringify = function(key, value, replacer, lineBreak, indent, json_values_only)
{
	if (replacer != null)
		value = replacer(key, value);

	if (typeof(value) === 'string')
		return Weave.encodeString(value);

	if (value == null || typeof(value) != 'object')
	{
		if (json_values_only && (value === undefined || !isFinite(Language.as(value, Number))))
			value = null;
		return String(value) || String(null);
	}

	var  lineBreakIndent = lineBreak + indent;
	var  valueIsArray = Language.is(value, Array);
	var output = [];

	if (valueIsArray)
	{
		for (var i = 0; i < value.length; i++)
			output.push(Weave._stringify(String(i), value[i], replacer, lineBreakIndent, indent, json_values_only));
	}
	else if (typeof(value) == 'object')
	{
		for (key in value)
			output.push(Weave.encodeString(key) + ": " + Weave._stringify(key, value[key], replacer, lineBreakIndent, indent, json_values_only));
		output.sort();
	}

	if (output.length == 0)
		return valueIsArray ? "[]" : "{}";
	var lb = valueIsArray ? "[" : "{";
	var rb = valueIsArray ? "]" : "}";
	return lb + lineBreakIndent + output.join(indent ? ',' + lineBreakIndent : ', ') + lineBreak + rb;
};


/**
 * This function surrounds a String with quotes and escapes special characters using ActionScript string literal format.
 */
Weave.encodeString = function(string, quote)
{
	quote = typeof quote !== 'undefined' ? quote : '"';
	if (string == null)
		return 'null';
	var result = new Array(string.length);
	for (var i = 0; i < string.length; i++) {
		var chr = string.charAt(i);
		var esc = chr == quote ? quote : Weave.ENCODE_LOOKUP[chr];
		result[i] = esc ? '\\' + esc : chr;
	}
	return quote + result.join('') + quote;
};


Weave.ENCODE_LOOKUP = {'\b':'b', '\f':'f', '\n':'n', '\r':'r', '\t':'t', '\\':'\\'};


/**
 * This is a convenient global function for retrieving localized text.
 * Sample syntax:
 *     Weave.lang("hello world")
 *
 * You can also specify a format string with parameters which will be passed to StandardLib.substitute():
 *     Weave.lang("{0} and {1}", first, second)
 */
Weave.lang = function(text, parameters)
{
	parameters = Array.prototype.slice.call(arguments, 1);
	var newText = WeaveAPI.Locale.getText(text);
	if (WeaveAPI.debugLocale)
	{
		parameters.unshift(text);
		var str = Weave.stringify(parameters);
		return 'lang(' + str.substring(1, str.length - 1) + ')';
	}
	if (parameters.length)
		return StandardLib.substitute(newText, parameters);
	return newText;
};


/**
 * Shortcut for DebugUtils.debugId() and DebugUtils.debugLookup()
 */
Weave.id = function(arg) 
{
	arg = typeof arg !== 'undefined' ? arg : undefined;
	var type = typeof(arg);
	if (arguments.length == 0 || type == 'string' || type == 'number')
		return DebugUtils.debugLookup(arg);
	return DebugUtils.debugId(arg);
};

Weave.watch = DebugUtils.watch;
Weave.unwatch = DebugUtils.unwatch;
Weave.watchState = DebugUtils.watchState;





