

import ILinkableObject from "./ILinkableObject";

export default class ILinkableCompositeObject
{
	constructor()
	{
		}

	getSessionState() {};
	setSessionState (newState, removeMissingDynamicObjects) {};


	/**
	 * Reflection
	 *
	 * @return {Object.<string, Function>}
	 */
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
					'getSessionState': { type: 'Array', declaredBy: 'weavejs.api.core.ILinkableCompositeObject'},
					'setSessionState': { type: 'void', declaredBy: 'weavejs.api.core.ILinkableCompositeObject'}
				};
			}
		};
	};

}

ILinkableCompositeObject.prototype.CLASS_INFO = { names: [{ name: 'ILinkableCompositeObject', qName: 'weavejs.api.core.ILinkableCompositeObject'}], interfaces: [ILinkableObject] };



