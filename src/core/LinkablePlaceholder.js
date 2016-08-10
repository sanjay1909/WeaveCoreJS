import LinkableVariable from "./LinkableVariable";
import CallbackCollection from "./CallbackCollection";
import Language from "../util/Language";

import ILinkableHashMap from "../api/core/ILinkableHashMap";
import ILinkableDynamicObject from "../api/core/ILinkableDynamicObject";

import Weave from "../Weave";

export default class LinkablePlaceholder extends LinkableVariable
{
	constructor(classDef)
	{
		super();
		if (!classDef)
			throw new Error("classDef cannot be null");

		this.classDef = classDef;
		this._bypassDiff = classDef === LinkableVariable || Language.is(classDef.prototype, LinkableVariable);
		this.instance;

		this.setSessionState = this.setSessionState.bind(this);

	}

	setSessionState(value)
	{
		super.setSessionState(value);
	};


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
					'LinkablePlaceholder': { type: '', declaredBy: 'LinkablePlaceholder'},
					'getClass': { type: 'Class', declaredBy: 'LinkablePlaceholder'},
					'getInstance': { type: 'ILinkableObject', declaredBy: 'LinkablePlaceholder'},
					'setInstance': { type: 'void', declaredBy: 'LinkablePlaceholder'},
					'setSessionState': { type: 'void', declaredBy: 'LinkablePlaceholder'}
				};
			}
		};
	};
}

LinkablePlaceholder.prototype.getClass = function()
{
	return this.classDef;
};


LinkablePlaceholder.prototype.getInstance = function()
{
	return this.instance;
};


LinkablePlaceholder.prototype.setInstance = function(instance)
{
	if (Weave.wasDisposed(this))
		throw new Error("LinkablePlaceholder was already disposed");

	if (!Language.is(instance, this.classDef))
		throw new Error("Unexpected object type");

	this.instance = instance;
	LinkablePlaceholder.replace(this, instance);
};





LinkablePlaceholder.replace = function(oldObject, newObject)
{
	var owner = Weave.getOwner(oldObject);
	var oldPlaceholder = Language.as(oldObject, LinkablePlaceholder);
	var  lhm = Language.as(owner, ILinkableHashMap);
	var  ldo = Language.as(owner, ILinkableDynamicObject);

	if (!lhm && !ldo)
		throw new Error("Unable to replace object because owner is not an ILinkableHashMap or ILinkableDynamicObject");

	var ownerCC = Weave.getCallbacks(owner);
	ownerCC.delayCallbacks();

	//todo: do we need try as we are not catching any error
	try {
		var sessionState = undefined;
		if (Weave.getCallbacks(oldObject).triggerCounter != CallbackCollection.DEFAULT_TRIGGER_COUNT)
			sessionState = Weave.getState(oldObject);
		if (oldPlaceholder)
			Weave.getCallbacks(oldPlaceholder).delayCallbacks();
		if (lhm)
			lhm.setObject(lhm.getName(oldObject), newObject);
		else if (ldo)
			ldo.target = newObject;
		if (sessionState !== undefined)
			Weave.setState(newObject, sessionState);
		if (oldPlaceholder)
			Weave.getCallbacks(oldPlaceholder).resumeCallbacks();
	}
	finally
	{
		ownerCC.resumeCallbacks();
	}
};


/**
 * A utility function for getting the class definition from LinkablePlaceholders as well as regular objects.
 */
LinkablePlaceholder.getClass = function(object)
{
	var placeholder = Language.as(object, LinkablePlaceholder);
	if (placeholder)
		return placeholder.getClass();
	if (object)
		return object.constructor;
	return null;
};


/**
 * Replaces a LinkablePlaceholder with an instance of the expected type.
 */
LinkablePlaceholder.setInstance = function(possiblePlaceholder, instance)
{
	if (possiblePlaceholder === instance)
		return;
	var placeholder = Language.as(possiblePlaceholder, LinkablePlaceholder);
	if (!placeholder)
		throw new Error("Attempted to put an instance where there was no placeholder for it.");
	placeholder.setInstance(instance);
};


/**
 * @export
 * @param {weavejs.api.core.ILinkableObject} instance
 */
LinkablePlaceholder.replaceInstanceWithPlaceholder = function(instance) {
	if (!instance || Language.is(instance, LinkablePlaceholder) || Weave.wasDisposed(instance))
		return;
	var placeholder = new LinkablePlaceholder(LinkablePlaceholder.getClass(instance));
	try {
		LinkablePlaceholder.replace(instance, placeholder);
	} catch (e) {
		Weave.dispose(placeholder);
		throw e;
	}
};


/**
 * Calls a function after a placeholder has been replaced with an instance and the instance session state has been initialized.
 * The onReady function will be called immediately if possiblePlaceholder is not a LinkablePlaceholder.
 */
LinkablePlaceholder.whenReady = function(relevantContext, possiblePlaceholder, onReady)
{
	var localFn = function() {
		var instance = lp.getInstance();
		if (instance)
			onReady(instance);
	};

	var lp = Weave.AS(possiblePlaceholder, LinkablePlaceholder);
	if (lp)
	{
		Weave.getCallbacks(lp).addDisposeCallback(relevantContext, localFn, true);
	}
	else if (possiblePlaceholder && !Weave.wasDisposed(relevantContext))
	{
		onReady(possiblePlaceholder);
	}
};


LinkablePlaceholder.prototype.CLASS_INFO = { names: [{ name: 'LinkablePlaceholder', qName: 'LinkablePlaceholder'}] };

