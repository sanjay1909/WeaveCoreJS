
import ILinkableObject from "./ILinkableObject";

export default class ILinkableVariable
{

	constructor(){

	}

	getSessionState() {};
	setSessionState(value) {};

	FLEXJS_REFLECTION_INFO () {
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
					'getSessionState': { type: 'Object', declaredBy: 'weavejs.api.core.ILinkableVariable'},
					'setSessionState': { type: 'void', declaredBy: 'weavejs.api.core.ILinkableVariable'}
				};
			}
		};
	};
}

ILinkableVariable.prototype.FLEXJS_CLASS_INFO = { names: [{ name: 'ILinkableVariable', qName: 'weavejs.api.core.ILinkableVariable'}], interfaces: [ILinkableObject] };






