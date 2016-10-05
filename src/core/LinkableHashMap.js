import Weave from "../Weave";
import WeaveAPI from "../WeaveAPI";
import CallbackCollection from "./CallbackCollection";
import LinkablePlaceholder from "./LinkablePlaceholder";
import ChildListCallbackInterface from "./ChildListCallbackInterface";

import DynamicState from "../api/core/DynamicState";
import ILinkableHashMap from "../api/core/ILinkableHashMap";

import JS from "../util/JS";
import Language from "../util/Language";

export default class LinkableHashMap extends CallbackCollection
{
	constructor(typeRestriction) 
	{
		super();
		
		typeRestriction = typeof typeRestriction !== 'undefined' ? typeRestriction : null;

		this._childListCallbacks = Weave.linkableChild(this, ChildListCallbackInterface);
		this._orderedNames = [];
		this._nameToObjectMap = {};
		this._map_objectToNameMap = new JS.WeakMap();
		this._nameIsLocked = {};
		this._previousNameMap = {};
		
		this._typeRestriction = typeRestriction;
	}

	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'typeRestriction': { type: 'Class', declaredBy: 'LinkableHashMap'},
					'childListCallbacks': { type: 'IChildListCallbackInterface', declaredBy: 'LinkableHashMap'}
				};
			},
			methods: function () {
				return {
					'LinkableHashMap': { type: '', declaredBy: 'LinkableHashMap'},
					'getNames': { type: 'Array', declaredBy: 'LinkableHashMap'},
					'getObjects': { type: 'Array', declaredBy: 'LinkableHashMap'},
					'toObject': { type: 'Object', declaredBy: 'LinkableHashMap'},
					'toMap': { type: 'Object', declaredBy: 'LinkableHashMap'},
					'getObject': { type: 'ILinkableObject', declaredBy: 'LinkableHashMap'},
					'setObject': { type: 'void', declaredBy: 'LinkableHashMap'},
					'getName': { type: 'String', declaredBy: 'LinkableHashMap'},
					'setNameOrder': { type: 'void', declaredBy: 'LinkableHashMap'},
					'requestObject': { type: '*', declaredBy: 'LinkableHashMap'},
					'requestObjectCopy': { type: 'ILinkableObject', declaredBy: 'LinkableHashMap'},
					'renameObject': { type: 'ILinkableObject', declaredBy: 'LinkableHashMap'},
					'objectIsLocked': { type: 'Boolean', declaredBy: 'LinkableHashMap'},
					'removeObject': { type: 'void', declaredBy: 'LinkableHashMap'},
					'removeAllObjects': { type: 'void', declaredBy: 'LinkableHashMap'},
					'dispose': { type: 'void', declaredBy: 'LinkableHashMap'},
					'generateUniqueName': { type: 'String', declaredBy: 'LinkableHashMap'},
					'getSessionState': { type: 'Array', declaredBy: 'LinkableHashMap'},
					'setSessionState': { type: 'void', declaredBy: 'LinkableHashMap'}
				};
			}
		};
	};
}

LinkableHashMap.prototype.getNames = function(filter, filterIncludesPlaceholders)
{
	filter = typeof filter !== 'undefined' ? filter : null;
	filterIncludesPlaceholders = typeof filterIncludesPlaceholders !== 'undefined' ? filterIncludesPlaceholders : false;

	return this.getList(false, filter, filterIncludesPlaceholders);
};


LinkableHashMap.prototype.getObjects = function(filter, filterIncludesPlaceholders)
{
	filter = typeof filter !== 'undefined' ? filter : null;
	filterIncludesPlaceholders = typeof filterIncludesPlaceholders !== 'undefined' ? filterIncludesPlaceholders : false;

	return this.getList(true, filter, filterIncludesPlaceholders);
};


LinkableHashMap.prototype.toObject = function(filter, filterIncludesPlaceholders) {
	filter = typeof filter !== 'undefined' ? filter : null;
	filterIncludesPlaceholders = typeof filterIncludesPlaceholders !== 'undefined' ? filterIncludesPlaceholders : false;

	var  obj = {};
	var list = this.getList(false, filter, filterIncludesPlaceholders);

	for (var i in list)
	{
		let name = list[i];
		obj[name] = this._nameToObjectMap[name];
	}

	return obj;
};


LinkableHashMap.prototype.toMap = function(filter, filterIncludesPlaceholders)
{
	filter = typeof filter !== 'undefined' ? filter : null;
	filterIncludesPlaceholders = typeof filterIncludesPlaceholders !== 'undefined' ? filterIncludesPlaceholders : false;

	var map = new JS.Map();
	let list = this.getList(false, filter, filterIncludesPlaceholders);
	for (var i in list)
	{
		var name = list[i];
		map.set(name, this._nameToObjectMap[name]);
	}

	return map;
};



LinkableHashMap.prototype.getList = function(listObjects, filter, filterIncludesPlaceholders)
{
	if (Language.is(filter, String))
		filter = Weave.getDefinition(String(filter), true);
	
	var result = [];
	var orderedNamesLength = this._orderedNames.length
	for (var i = 0; i < orderedNamesLength; i++) 
	{
		var name = this._orderedNames[i];
		var object = this._nameToObjectMap[name];
		
		if (!filter) 
		{
			result.push(listObjects ? object : name);
		} 
		else if (Language.is(object, filter)) 
		{
			result.push(listObjects ? object : name);
		} 
		else if (filterIncludesPlaceholders) 
		{
			var  placeholder = Language.as(object, LinkablePlaceholder);
			if (!placeholder)
				continue;
			var classDef = placeholder.getClass();
			if (classDef === filter || Language.is(classDef.prototype, filter))
				result.push(listObjects ? object : name);
		}
	}
	return result;
};


LinkableHashMap.prototype.getObject = function(name)
{
	return this._nameToObjectMap[name];
};


LinkableHashMap.prototype.setObject = function(name, object, lockObject) {
	lockObject = typeof lockObject !== 'undefined' ? lockObject : false;

	if (this._nameIsLocked[name] || this._nameToObjectMap[name] === object)
		return;
	var className = Weave.className(object);
	if (!className)
		throw new Error("Cannot get class name from object");
	if (Weave.getDefinition(className) != object['constructor'])
		throw new Error("The Class of the object is not registered");
	if (Weave.getOwner(object))
		throw new Error("LinkableHashMap cannot accept an object that is already registered with an owner.");

	if (object)
	{
		if (!name)
			name = this.generateUniqueName(className.split('::').pop().split('.').pop());
		this.delayCallbacks();
		Weave.linkableChild(this, object);
		var  oldObject = this._nameToObjectMap[name];
		this._nameToObjectMap[name] = object;
		this._map_objectToNameMap.set(object, name);
		if (this._orderedNames.indexOf(name) < 0)
			this._orderedNames.push(name);
		if (lockObject)
			this._nameIsLocked[name] = true;
		this._previousNameMap[name] = true;
		this._childListCallbacks.runCallbacks(name, object, oldObject);
		Weave.dispose(oldObject);
		this.resumeCallbacks();
	} else {
		this.removeObject(name);
	}
};


LinkableHashMap.prototype.getName = function(object)
{
	return this._map_objectToNameMap.get(object);
};


LinkableHashMap.prototype.setNameOrder = function(newOrder) {
	var changeDetected = false;
	var name;
	var i;
	var originalNameCount = this._orderedNames.length;
	let newOrderLen = newOrder.length;

	var haveSeen = {};
	for (i = 0; i < newOrderLen; i++) {
		name = newOrder[i];
		if (this._nameToObjectMap[name] == undefined || haveSeen[name] != undefined)
			continue;
		haveSeen[name] = true;
		this._orderedNames.push(name);
	}

	var  appendedCount = this._orderedNames.length - originalNameCount;
	for (i = 0; i < appendedCount; i++)
	{
		var newIndex = originalNameCount + i;
		var oldIndex = this._orderedNames.indexOf(this._orderedNames[newIndex]);
		if (newIndex - oldIndex != appendedCount)
			changeDetected = true;
		this._orderedNames[oldIndex] = null;
	}
	var out = 0;
	let orderedNamesLen = this._orderedNames.length;
	for (i = 0; i < orderedNamesLen; i++)
		if (this._orderedNames[i] != null)
			this._orderedNames[out++] = this._orderedNames[i];

	this._orderedNames.length = orderedNamesLen = out;
	if (changeDetected)
		this._childListCallbacks.runCallbacks(null, null, null);
};


LinkableHashMap.prototype.requestObject = function(name, classDef, lockObject) {
	lockObject = typeof lockObject !== 'undefined' ? lockObject : false;
	if (Language.is(classDef, String))
		classDef = Weave.getDefinition(String(classDef), true);
	var className = classDef ? Weave.className(classDef) : null;
	var  result = this.initObjectByClassName(name, className, lockObject);
	return classDef ? Language.as(result, classDef) : null;
};



LinkableHashMap.prototype.requestObjectCopy = function(name, objectToCopy) {
	if (objectToCopy == null)
	{
		this.removeObject(name);
		return null;
	}
	this.delayCallbacks();
	var classDef = LinkablePlaceholder.getClass(objectToCopy);
	var sessionState = Weave.getState(objectToCopy);
	if (name == this.getName(objectToCopy))
		this.removeObject(name);
	this.requestObject(name, classDef, false);
	var object = this.getObject(name);
	if (classDef == LinkablePlaceholder.getClass(object))
		Weave.setState(object, sessionState);
	this.resumeCallbacks();
	return object;
};


LinkableHashMap.prototype.renameObject = function(oldName, newName) {
	if (oldName != newName) {
		this.delayCallbacks();
		var newNameOrder = this._orderedNames.concat();
		var index = newNameOrder.indexOf(oldName);
		if (index >= 0)
			newNameOrder.splice(index, 1, newName);
		this.requestObjectCopy(newName, this.getObject(oldName));
		this.removeObject(oldName);
		this.setNameOrder(newNameOrder);
		this.resumeCallbacks();
	}
	return this.getObject(newName);
};


/**
 * If there is an existing object associated with the specified name, it will be kept if it
 * is the specified type, or replaced with a new instance of the specified type if it is not.
 */
LinkableHashMap.prototype.initObjectByClassName = function(name, className, lockObject)
{
	lockObject = typeof lockObject !== 'undefined' ? lockObject : false;
	if (className)
	{
		var  classDef = Weave.getDefinition(className);
		if (Weave.isLinkable(classDef) && (this._typeRestriction == null || classDef === this._typeRestriction || Language.is(classDef.prototype, this._typeRestriction))) {
			if (!name)
			{
				var baseName = className.split('::').pop().split('.').pop();
				if (name == '')
					baseName = WeaveAPI.ClassRegistry.getDisplayName(classDef) || baseName;
				name = this.generateUniqueName(baseName);
			}
			var /** @type {Object} */ object = this._nameToObjectMap[name];
			if (classDef != LinkablePlaceholder.getClass(object))
				this.createAndSaveNewObject(name, classDef, lockObject);
			else if (lockObject)
				this.lockObject(name);
		} else {
			this.removeObject(name);
		}
	} else {
		this.removeObject(name);
	}
	return this._nameToObjectMap[name || ''];
};



LinkableHashMap.prototype.createAndSaveNewObject = function(name, classDef, lockObject) {
	if (this._nameIsLocked[name])
		return;
	try {
		this.delayCallbacks();
		this.removeObject(name);
		var /** @type {weavejs.api.core.ILinkableObject} */ object;
		if (Weave.isAsyncClass(classDef))
			object = new LinkablePlaceholder(classDef);
		else
			object = new classDef();
		Weave.linkableChild(this, object);
		this._nameToObjectMap[name] = object;
		this._map_objectToNameMap.set(object, name);
		this._orderedNames.push(name);
		this._previousNameMap[name] = true;
		if (lockObject)
			this.lockObject(name);
		this._childListCallbacks.runCallbacks(name, object, null);
	} finally {
		this.resumeCallbacks();
	}
};


/**
 * This function will lock an object in place for a given identifying name.
 * If there is no object using the specified name, this function will have no effect.
 */
LinkableHashMap.prototype.lockObject = function(name) {
	if (name != null && this._nameToObjectMap[name] != null)
		this._nameIsLocked[name] = true;
};


LinkableHashMap.prototype.objectIsLocked = function(name) {
	return this._nameIsLocked[name] ? true : false;
};


LinkableHashMap.prototype.removeObject = function(name) {
	if (!name || this._nameIsLocked[name])
		return;
	var object = this._nameToObjectMap[name];
	if (object == null)
		return;
	this.delayCallbacks();
	delete this._nameToObjectMap[name];
	this._map_objectToNameMap['delete'](object);
	var index = this._orderedNames.indexOf(name);
	this._orderedNames.splice(index, 1);
	this._childListCallbacks.runCallbacks(name, null, object);
	Weave.dispose(object);
	this.resumeCallbacks();
};


LinkableHashMap.prototype.removeAllObjects = function() {
	this.delayCallbacks();
	var names = this._orderedNames.concat();

	for (var i in names)
	{
		var name = names[i];

		this.removeObject(name);
	}

	this.resumeCallbacks();
};


/**
 * This function removes all objects from this LinkableHashMap.
 */
LinkableHashMap.prototype.dispose = function()
{
	LinkableHashMap.base(this, 'dispose');
	this.removeAllObjects();
	var names = this._orderedNames.concat();
	
	for (var i in names)
	{
		var name = names[i];
		{
			this._nameIsLocked[name] = undefined;
			this.removeObject(name);
		}
	}

};


LinkableHashMap.prototype.generateUniqueName = function(baseName) {
	var count = 1;
	var name = baseName;
	while (this._previousNameMap[name] != undefined)
		name = baseName + (++count);
	
	this._previousNameMap[name] = true;
	return name;
};



LinkableHashMap.prototype.getSessionState = function() 
{
	let orderedNamesLen = this._orderedNames.length;
	
	var result = new Array(orderedNamesLen);
	
	for (var  i = 0; i < orderedNamesLen; i++) 
	{
		var name = this._orderedNames[i];
		var object = this._nameToObjectMap[name];
		result[i] = DynamicState.create(name, Weave.className(LinkablePlaceholder.getClass(object)), Weave.getState(object));
	}
	return result;
};


LinkableHashMap.prototype.setSessionState = function(newStateArray, removeMissingDynamicObjects) {
	if (newStateArray == null)
		return;
	
	this.delayCallbacks();
	var i;
	var delayed = [];
	var callbacks;
	var objectName;
	var className;
	var typedState;
	var remainingObjects = removeMissingDynamicObjects ? {} : null;
	var newObjects = {};
	var newNameOrder = [];
	
	if (newStateArray != null) 
	{
		let orderedNames = this._orderedNames;
		for (var i in orderedNames)
		{
			objectName = orderedNames[i];
			//todo: why it has to be block here?
			{
				callbacks = Weave.getCallbacks(this._nameToObjectMap[objectName]);
				delayed.push(callbacks);
				callbacks.delayCallbacks();
			}
		}

		let dynamicStateObjName = DynamicState.OBJECT_NAME;
		let dynamicStateClassName = DynamicState.CLASS_NAME;
		let dynamicStateSessionState = DynamicState.SESSION_STATE;
		let newStateArrayLen = newStateArray.length;
		for (i = 0; i < newStateArrayLen; i++) 
		{
			typedState = newStateArray[i];
			if (!DynamicState.isDynamicState(typedState, true))
				continue;
			objectName = typedState[dynamicStateObjName];
			className = typedState[dynamicStateClassName];
			if (objectName == null)
				continue;
			if (className == null)
				continue;
			if (this._nameToObjectMap[objectName] != this.initObjectByClassName(objectName, className))
				newObjects[objectName] = true;
		}
		
		for (var i in orderedNames)
		{
			objectName = orderedNames[i];
			//todo: why it has to be block here?
			{
				callbacks = Weave.getCallbacks(this._nameToObjectMap[objectName]);
				delayed.push(callbacks);
				callbacks.delayCallbacks();
			}
		}

		for (i = 0; i < newStateArrayLen; i++) 
		{
			typedState = newStateArray[i];
			if (typeof(typedState) === 'string') 
			{
				objectName = String(typedState);
				
				if (removeMissingDynamicObjects)
					remainingObjects[objectName] = true;
				
				newNameOrder.push(objectName);
				continue;
			}
			
			if (!DynamicState.isDynamicState(typedState, true))
				continue;
			
			objectName = typedState[dynamicStateObjName];
			if (objectName == null)
				continue;
			
			var object = this._nameToObjectMap[objectName];
			if (object == null)
				continue;
			
			Weave.setState(object, typedState[dynamicStateSessionState], newObjects[objectName] || removeMissingDynamicObjects);
			
			if (removeMissingDynamicObjects)
				remainingObjects[objectName] = true;
			
			newNameOrder.push(objectName);
		}
	}
	
	if (removeMissingDynamicObjects) 
	{
		var  names = this._orderedNames.concat();
		
		for (var i in names)
		{
			objectName = names[i];
			{
				if (remainingObjects[objectName] !== true) 
				{
					this.removeObject(objectName);
				}
			}
		}

	}
	
	this.setNameOrder(newNameOrder);
	
	for (var i in delayed)
	{
		callbacks = delayed[i];

		if (!Weave.wasDisposed(callbacks))
			callbacks.resumeCallbacks();
	}

	this.resumeCallbacks();
};


Object.defineProperties(LinkableHashMap.prototype, {
	typeRestriction: {
		get: function() {
			return this._typeRestriction;
		}
	},
	childListCallbacks: {
		get: function() {
			return this._childListCallbacks;
		}
	}
});

LinkableHashMap.prototype.CLASS_INFO = { names: [{ name: 'LinkableHashMap', qName: 'LinkableHashMap'}], interfaces: [ILinkableHashMap] };




