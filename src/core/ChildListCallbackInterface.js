

import CallbackCollection from "./CallbackCollection";
import IChildListCallbackInterface from "../api/core/IChildListCallbackInterface";

import Language from "../util/Language";

export default class ChildListCallbackInterface extends CallbackCollection
{
	constructor()
	{
		super();
		// as this is not allowed before super is called we have set CallbackCollection _precallback after super
		this._preCallback = Language.closure(this.setCallbackVariables, this, 'setCallbackVariables');

		this._lastNameAdded = null;
		this._lastObjectAdded = null;
		this._lastNameRemoved = null;
		this._lastObjectRemoved = null;
	}


	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'lastNameAdded': { type: 'String', declaredBy: 'ChildListCallbackInterface'},
					'lastObjectAdded': { type: 'ILinkableObject', declaredBy: 'ChildListCallbackInterface'},
					'lastNameRemoved': { type: 'String', declaredBy: 'ChildListCallbackInterface'},
					'lastObjectRemoved': { type: 'ILinkableObject', declaredBy: 'ChildListCallbackInterface'}
				};
			},
			methods: function () {
				return {
					'ChildListCallbackInterface': { type: '', declaredBy: 'ChildListCallbackInterface'},
					'runCallbacks': { type: 'void', declaredBy: 'ChildListCallbackInterface'}
				};
			},
			metadata: function () { return [ ]; }
		};
	};

}






/**
 * This function will set the list callback variables:
 *     lastNameAdded, lastObjectAdded, lastNameRemoved, lastObjectRemoved, childListChanged
 */
ChildListCallbackInterface.prototype.setCallbackVariables = function(name, objectAdded, objectRemoved) {
	name = typeof name !== 'undefined' ? name : null;
	objectAdded = typeof objectAdded !== 'undefined' ? objectAdded : null;
	objectRemoved = typeof objectRemoved !== 'undefined' ? objectRemoved : null;

	this._lastNameAdded = objectAdded ? name : null;
	this._lastObjectAdded = objectAdded;
	this._lastNameRemoved = objectRemoved ? name : null;
	this._lastObjectRemoved = objectRemoved;
};


/**
 * This function will run callbacks immediately, setting the list callback variables before each one.
 */
ChildListCallbackInterface.prototype.runCallbacks = function(name, objectAdded, objectRemoved)
{
	var _name = this._lastNameAdded || this._lastNameRemoved;
	var _added = this._lastObjectAdded;
	var _removed = this._lastObjectRemoved;

	this._runCallbacksImmediately(name, objectAdded, objectRemoved);
	this.setCallbackVariables(_name, _added, _removed);


};


Object.defineProperties(ChildListCallbackInterface.prototype,{
	lastNameAdded: {
		get: function() {
			return this._lastNameAdded;
		}
	},
	lastObjectAdded: {
		get: function() {
			return this._lastObjectAdded;
		}
	},
	lastNameRemoved: {
		get: function() {
			return this._lastNameRemoved;
		}
	},
	lastObjectRemoved: {
		get: function() {
			return this._lastObjectRemoved;
		}
	}
});


ChildListCallbackInterface.prototype.CLASS_INFO = { names: [{ name: 'ChildListCallbackInterface', qName: 'ChildListCallbackInterface'}], interfaces: [IChildListCallbackInterface] };




