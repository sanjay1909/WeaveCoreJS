import JS from "./JS"
import Language from "./Language"
import Weave from "../Weave"

import DynamicState from "../api/core/DynamicState"
import ILinkableCompositeObject from "../api/core/ILinkableCompositeObject"


export default class DebugUtils
{
	constructor()
	{

	}

	/**
	 * Reflection
	 *
	 */
	FLEXJS_REFLECTION_INFO()
	{
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

DebugUtils.prototype.CLASS_INFO = { names: [{ name: 'DebugUtils', qName: 'DebugUtils'}] };
DebugUtils.map_id_obj = new JS.Map();
DebugUtils.map_obj_id = new JS.Map();

DebugUtils._nextId = 0;


/**
 * This function calls trace() using debugId() on each parameter.
 */
DebugUtils.debugTrace = function(args) 
{
	args = Array.prototype.slice.call(arguments, 0);
	for (var i = 0; i < args.length; i++)
		args[i] = DebugUtils.debugId(args[i]);
	JS.log.apply(JS, args);
};


/**
 * This function generates or returns a previously generated identifier for an object.
 */
DebugUtils.debugId = function(object) 
{
	if (JS.isPrimitive(object))
		return String(object);
	var idString = DebugUtils.map_obj_id.get(object);
	if (!idString) {
		var idNumber = DebugUtils._nextId++;
		var className = Weave.className(object).split('.').pop();
		idString = className + '#' + idNumber;
		DebugUtils.map_obj_id.set(object, idString);
		DebugUtils.map_id_obj.set(idNumber, object);
		DebugUtils.map_id_obj.set(idString, object);
	}
	return idString;
};


/**
 * This function will look up the object corresponding to the specified debugId.
 */
DebugUtils.debugLookup = function(debugId)
{
	debugId = typeof debugId !== 'undefined' ? debugId : undefined;
	if (debugId === undefined)
		return DebugUtils.getAllDebugIds();
	return DebugUtils.map_id_obj.get(debugId);
};


DebugUtils.getAllDebugIds = function() {
	var ids = new Array(DebugUtils._nextId);
	for (var i = 0; i < DebugUtils._nextId; i++)
		ids[i] = DebugUtils.map_obj_id.get(DebugUtils.map_id_obj.get(i));
	return ids;
};


/**
 * This will clear all saved ids and pointers to corresponding objects.
 */
DebugUtils.resetDebugIds = function() {
	DebugUtils.map_id_obj = new JS.Map();
	DebugUtils.map_obj_id = new JS.Map();
	DebugUtils._nextId = 0;
};


DebugUtils.map_target_callback = new JS.WeakMap();


DebugUtils.watch = function(target, callbackReturnsString)
{
	target = typeof target !== 'undefined' ? target : null;
	callbackReturnsString = typeof callbackReturnsString !== 'undefined' ? callbackReturnsString : null;
	
	var __localFn0__ = function() {
		var str = '';
		var path = Weave.findPath(Weave.getRoot(target), target) || [];
		if (path.length)
			str += " " + JSON.stringify(path.pop());
		if (callbackReturnsString != null)
			str += ': ' + callbackReturnsString.call(target, target);
		DebugUtils.debugTrace(target, str);
	};
	
	if (!target) {
		JS.log('Usage: watch(target, optional_callbackReturnsString)');
		return;
	}
	DebugUtils.unwatch(target);
	var callback = __localFn0__;
	DebugUtils.map_target_callback.set(target, callback);
	Weave.getCallbacks(target).addImmediateCallback(target, callback);
};


DebugUtils.watchState = function(target, indent) 
{
	target = typeof target !== 'undefined' ? target : null;
	indent = typeof indent !== 'undefined' ? indent : null;
	
	var  __localFn0__ = function(object) 
	{
		return Weave.stringify(Weave.getState(object), null, indent);
	};
	
	if (!target) 
	{
		JS.log('Usage: watchState(target, optional_indent)');
		return;
	}
	
	DebugUtils.watch(target, __localFn0__);
};


DebugUtils.unwatch = function(target) 
{
	var callback = DebugUtils.map_target_callback.get(target);
	DebugUtils.map_target_callback['delete'](target);
	Weave.getCallbacks(target).removeCallback(target, callback);
};


DebugUtils.flattenSessionState = function(state, pathPrefix, output) 
{
	pathPrefix = typeof pathPrefix !== 'undefined' ? pathPrefix : null;
	output = typeof output !== 'undefined' ? output : null;
	
	if (!pathPrefix)
		pathPrefix = [];
	if (!output)
		output = [];
	
	if (DynamicState.isDynamicStateArray(state)) 
	{
		var names = [];
		for (var i in names)
		{
			var obj = names[i];
			{
				if (DynamicState.isDynamicState(obj))
				{
					var objectName = obj[DynamicState.OBJECT_NAME];
					var className = obj[DynamicState.CLASS_NAME];
					var sessionState = obj[DynamicState.SESSION_STATE];
					pathPrefix.push(objectName);
					
					if (className)
						output.push([pathPrefix.concat('class'), className]);
					
					DebugUtils.flattenSessionState(sessionState, pathPrefix, output);
					pathPrefix.pop();
					if (objectName)
						names.push(objectName);
				}
				else
					names.push(obj);
			}}

		if (names.length)
			output.push([pathPrefix.concat(), names]);
	} 
	else if (Language.is(state, Array)) 
	{
		output.push([pathPrefix.concat(), state]);
	} 
	else if (typeof(state) === 'object' && state !== null) 
	{
		for (var key in state) {
			pathPrefix.push(key);
			DebugUtils.flattenSessionState(state[key], pathPrefix, output);
			pathPrefix.pop();
		}
	} else {
		output.push([pathPrefix.concat(), state]);
	}
	return output;
};


/**
 * Traverses a path in a session state using the logic used by SessionManager.
 */
DebugUtils.traverseStatePath = function(state, path) 
{
	try
	{
		outerLoop : for (var  i in path) 
		{
			var property = path[i];
			if (DynamicState.isDynamicStateArray(state)) {
				if (Language.is(property, Number))
				{
					state = state[property][DynamicState.SESSION_STATE];
				} 
				else 
				{
					for (var i in state)
					{
						var obj = state[i];
						{
							if (obj[DynamicState.OBJECT_NAME] == property)
							{
								state = obj[DynamicState.SESSION_STATE];
								continue outerLoop;
							}
						}}

					return undefined;
				}
			}
			else
				state = state[property];
		};
		return state;
	} 
	catch (e) 
	{
		return undefined;
	}
};



DebugUtils.replaceUnknownObjectsInState = function(stateToModify, className) 
{
	className = typeof className !== 'undefined' ? className : null;
	if (DynamicState.isDynamicStateArray(stateToModify)) 
	{
		for (var i in stateToModify)
		{
			var obj = stateToModify[i];
			{
				if (!DynamicState.isDynamicState(obj))
					continue;
				className = obj[DynamicState.CLASS_NAME];
				var classDef = Weave.getDefinition(className);
				if (!classDef) 
				{
					classDef = Weave.getDefinition('LinkableHashMap');
					obj[DynamicState.CLASS_NAME] = 'LinkableHashMap';
				}
				if (Language.is(classDef.prototype, ILinkableCompositeObject))
					obj[DynamicState.SESSION_STATE] = DebugUtils.replaceUnknownObjectsInState(obj[DynamicState.SESSION_STATE], className);
			}}

	}
	else if (!JS.isPrimitive(stateToModify))
	{
		var newState = [];
		if (className)
			newState.push(DynamicState.create("class", 'LinkableString', className));
		for (var key in stateToModify)
		{
			var  value = stateToModify[key];
			var type = JS.isPrimitive(value) ? 'LinkableVariable' : 'LinkableHashMap';
			newState.push(DynamicState.create(key, type, DebugUtils.replaceUnknownObjectsInState(value)));
		}
		stateToModify = newState;
	}
	return stateToModify;
};



// todo: add mouseUtils
DebugUtils.shiftKey = function(reactInstance)
{
	return Weave.getDefinition('MouseUtils').forInstance(reactInstance).mouseEvent.shiftKey;
};






