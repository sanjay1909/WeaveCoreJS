
import Language from "../../util/Language";

export default class DynamicState
{
	constructor()
	{

	}

	REFLECTION_INFO()
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

DynamicState.prototype.CLASS_INFO = { names: [{ name: 'DynamicState', qName: 'DynamicState'}] };






/**
 * Creates an Object having three properties: objectName, className, sessionState
 */
DynamicState.create = function(objectName, className, sessionState)
{
	objectName = typeof objectName !== 'undefined' ? objectName : null;
	className = typeof className !== 'undefined' ? className : null;
	sessionState = typeof sessionState !== 'undefined' ? sessionState : null;
	var /** @type {Object} */ obj = {};
	obj[DynamicState.OBJECT_NAME] = objectName || null;
	obj[DynamicState.CLASS_NAME] = className || null;
	obj[DynamicState.SESSION_STATE] = sessionState;
	return obj;
};

DynamicState.OBJECT_NAME = 'objectName';
DynamicState.CLASS_NAME = 'className';
DynamicState.SESSION_STATE = 'sessionState';
DynamicState.BYPASS_DIFF = 'bypassDiff';


/**
 * This function can be used to detect dynamic state objects within nested, untyped session state objects.
 * This function will check if the given object has the three properties of a dynamic state object.
 */
DynamicState.isDynamicState = function(object, handleBypassDiff)
{
	handleBypassDiff = typeof handleBypassDiff !== 'undefined' ? handleBypassDiff : false;
	if (typeof(object) !== 'object')
		return false;
	var matchCount = 0;
	for (var name in object) {
		if (name === DynamicState.OBJECT_NAME || name === DynamicState.CLASS_NAME || name === DynamicState.SESSION_STATE)
			matchCount++;
		else if (handleBypassDiff && name === DynamicState.BYPASS_DIFF)
			continue;
		else
			return false;
	}
	return (matchCount == 3);
};


/**
 * This function checks whether or not a session state is an Array containing at least one
 * object that looks like a DynamicState and has no other non-String items.
 */

DynamicState.isDynamicStateArray = function(state, handleBypassDiff)
{
	handleBypassDiff = typeof handleBypassDiff !== 'undefined' ? handleBypassDiff : false;
	var array = Language.as(state, Array);
	if (!array)
		return false;
	var result = false;

	for (var i in array)
	{
		var item = array[i];
		{
			if (typeof(item) === 'string')
				continue;
			if (DynamicState.isDynamicState(item, handleBypassDiff))
				result = true;
			else
				return false;
		}}

	return result;
};


/**
 * Alters a session state object to bypass special diff logic for dynamic state arrays.
 * It does so by adding the "bypassDiff" property to any part for which isDynamicState(part) returns true.
 */
DynamicState.alterSessionStateToBypassDiff = function(object)
{
	if (DynamicState.isDynamicState(object))
	{
		object[DynamicState.BYPASS_DIFF] = true;
		object = object[DynamicState.SESSION_STATE];
	}
	if (typeof(object) === 'object')
		for (var key in object)
			DynamicState.alterSessionStateToBypassDiff(object[key]);
};


/**
 * Converts DynamicState Arrays into Objects.
 */
DynamicState.removeTypeFromState = function(state, recursive)
{
	recursive = typeof recursive !== 'undefined' ? recursive : true;

	if (DynamicState.isDynamicStateArray(state))
	{
		var newState = {};
		for (var i in state)
		{
			var typedState = state[i];

			if (typeof(typedState) === 'object')
				newState[typedState[DynamicState.OBJECT_NAME] || ''] = recursive ? DynamicState.removeTypeFromState(typedState[DynamicState.SESSION_STATE], true) : typedState[DynamicState.SESSION_STATE];}

		return newState;
	}
	if (recursive && typeof(state) === 'object')
		for (var key in state)
			state[key] = DynamicState.removeTypeFromState(state[key], true);
	return state;
};


/**
 * Sets or gets a value in a session state.
 */
DynamicState.traverseState = function(state, path, newValue)
{
	newValue = typeof newValue !== 'undefined' ? newValue : undefined;
	if (!path.length)
		return newValue === undefined ? state : newValue;
	if (!state)
		return undefined;

	var property = path[0];
	path = path.slice(1);

	if (DynamicState.isDynamicStateArray(state, true))
	{
		var i;
		if (Language.is(property, Number))
			i = property;
		else
			for (i = 0; i < state.length; i++)
				if (state[i][DynamicState.OBJECT_NAME] == property || (!property && !state[i][DynamicState.OBJECT_NAME]))
					break;

		var  typedState = state[i];
		if (!typedState)
			return undefined;
		if (path.length)
			return DynamicState.traverseState(typedState[DynamicState.SESSION_STATE], path, newValue);
		return newValue === undefined ? typedState[DynamicState.SESSION_STATE] : typedState[DynamicState.SESSION_STATE] = newValue;
	}
	if (path.length)
		return DynamicState.traverseState(state[property], path, newValue);
	return newValue === undefined ? state[property] : state[property] = newValue;
};





