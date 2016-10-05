

import CallbackCollection from "./CallbackCollection";

import DynamicState from "../api/core/DynamicState";
import ICallbackCollection from "../api/core/ICallbackCollection";
import IDisposableObject from "../api/core/IDisposableObject";
import ILinkableVariable from "../api/core/ILinkableVariable";

import WeaveAPI from "../WeaveAPI";
import Language from "../util/Language";
import JS from "../util/JS";
import StandardLib from "../util/StandardLib";

export default class LinkableVariable extends CallbackCollection
{
	/* If a defaultValue is specified, callbacks will be triggered in a later frame unless they have already been triggered before then.
	* This behavior is desirable because it allows the initial value to be handled by the same callbacks that handles new values.
	*/
	constructor(sessionStateType, verifier, defaultValue, defaultValueTriggersCallbacks)
	{
		super();

		sessionStateType = typeof sessionStateType !== 'undefined' ? sessionStateType : null;
		verifier = typeof verifier !== 'undefined' ? verifier : null;
		defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
		defaultValueTriggersCallbacks = typeof defaultValueTriggersCallbacks !== 'undefined' ? defaultValueTriggersCallbacks : true;



		this._verifier = null;
		this._sessionStateWasSet = false;
		this._primitiveType = false;
		this._sessionStateType = null;
		this._sessionStateInternal = undefined;
		this._sessionStateExternal = undefined;
		this._locked = false;
		this._bypassDiff = true;

		// class structure doesn't call prototype method with this
		this.dispose = this.dispose.bind(this)

		if (sessionStateType != Object) {
			this._sessionStateType = sessionStateType;
			this._primitiveType = this._sessionStateType == String || this._sessionStateType == Number || this._sessionStateType == Boolean;
		}
		this._verifier = verifier;
		if (defaultValue !== undefined) {
			this.setSessionState(defaultValue);
			if (defaultValueTriggersCallbacks && this.triggerCounter > weavejs.core.CallbackCollection.DEFAULT_TRIGGER_COUNT)
				WeaveAPI.Scheduler.callLater(this, Language.closure(this._defaultValueTrigger, this, '_defaultValueTrigger'));
		}


	}

	dispose() {
		super.dispose();
		this._sessionStateInternal = undefined;
		this._sessionStateExternal = undefined;
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
				};
			},
			accessors: function () {
				return {
					'locked': { type: 'Boolean', declaredBy: 'LinkableVariable'},
					'state': { type: 'Object', declaredBy: 'LinkableVariable'}
				};
			},
			methods: function () {
				return {
					'LinkableVariable': { type: '', declaredBy: 'LinkableVariable'},
					'getSessionStateType': { type: 'Class', declaredBy: 'LinkableVariable'},
					'getSessionState': { type: 'Object', declaredBy: 'LinkableVariable'},
					'setSessionState': { type: 'void', declaredBy: 'LinkableVariable'},
					'detectChanges': { type: 'void', declaredBy: 'LinkableVariable'},
					'lock': { type: 'void', declaredBy: 'LinkableVariable'},
					'dispose': { type: 'void', declaredBy: 'LinkableVariable'}
				};
			}
		};
	};
}


LinkableVariable.prototype._defaultValueTrigger = function()
{
	if (!this.wasDisposed && this.triggerCounter == CallbackCollection.DEFAULT_TRIGGER_COUNT + 1)
		this.triggerCallbacks();
};


/**
 * This function will verify if a given value is a valid session state for this linkable variable.
 */
LinkableVariable.prototype.verifyValue = function(value)
{
	return this._verifier == null || this._verifier(value);
};

/**
 * The type restriction passed in to the constructor.
 */
LinkableVariable.prototype.getSessionStateType = function()
{
	return this._sessionStateType;
};


LinkableVariable.prototype.getSessionState = function()
{
	if (this._sessionStateExternal === undefined)
		return null;
	return this._sessionStateExternal;
};


LinkableVariable.prototype.setSessionState = function(value)
{
	if (this._locked)
		return;
	if (this._sessionStateType != null)
		value = Language.as(value, this._sessionStateType);
	if (this._verifier != null && !this._verifier(value))
		return;
	var /** @type {boolean} */ wasCopied = false;
	var /** @type {string} */ type = null;
	if (value == null) {
		value = null;
	} else {
		type = typeof(value);
		if (type == 'object' && value.constructor != Object && value.constructor != Array) {
			value = JS.copyObject(value);
			wasCopied = true;
		}
	}
	if (this._sessionStateWasSet && this.sessionStateEquals(value))
		return;
	if (type == 'object') {
		if (!wasCopied)
			value = JS.copyObject(value);
		if (this._bypassDiff)
			DynamicState.alterSessionStateToBypassDiff(value);
		this._sessionStateExternal = value;
		this._sessionStateInternal = JS.copyObject(value);
	} else {
		this._sessionStateExternal = this._sessionStateInternal = value;
	}
	this._sessionStateWasSet = true;
	this.triggerCallbacks();
};


/**
 * This function is used in setSessionState() to determine if the value has changed or not.
 * Classes that extend this class may override this function.
 */
LinkableVariable.prototype.sessionStateEquals = function(otherSessionState)
{
	if (this._primitiveType)
		return this._sessionStateInternal == otherSessionState;
	return StandardLib.compare(this._sessionStateInternal, otherSessionState, Language.closure(this.objectCompare, this, 'objectCompare')) == 0;
};


LinkableVariable.prototype.objectCompare = function(a, b)
{
	if (DynamicState.isDynamicState(a, true) && DynamicState.isDynamicState(b, true) && a[DynamicState.CLASS_NAME] == b[DynamicState.CLASS_NAME] && a[DynamicState.OBJECT_NAME] == b[DynamicState.OBJECT_NAME]) {
		return StandardLib.compare(a[DynamicState.SESSION_STATE], b[DynamicState.SESSION_STATE], Language.closure(this.objectCompare, this, 'objectCompare'));
	}
	return NaN;
};


/**
 * This function may be called to detect change to a non-primitive session state in case it has been modified externally.
 */
LinkableVariable.prototype.detectChanges = function()
{
	if (!this.sessionStateEquals(this._sessionStateExternal))
		this.triggerCallbacks();
};


/**
 * Call this function when you do not want to allow any more changes to the value of this sessioned property.
 */
LinkableVariable.prototype.lock = function() {
	this._locked = true;
};





Object.defineProperties(LinkableVariable.prototype,  {
	locked: {
		get: function() {
			return this._locked;
		}
	},
	state: {
		get:  function() {
			return this.getSessionState();
		},
		set: function(value) {
			this.setSessionState(value);
		}
	}
});


LinkableVariable.prototype.CLASS_INFO = { names: [{ name: 'LinkableVariable', qName: 'LinkableVariable'}], interfaces: [ILinkableVariable, ICallbackCollection, IDisposableObject] };





