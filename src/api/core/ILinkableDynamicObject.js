
import ILinkableCompositeObject from "./ILinkableCompositeObject"

export default class ILinkableDynamicObject
{
	constructor()
	{

	}

	requestGlobalObject(name, objectType, lockObject) {};
	requestLocalObject(objectType, lockObject) {};
	requestLocalObjectCopy(objectToCopy) {};
	lock() {};
	removeObject() {};

	REFLECTION_INFO (){
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'internalObject': { type: 'ILinkableObject', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'target': { type: 'ILinkableObject', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'targetPath': { type: 'Array', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'foundPlaceholder': { type: 'Boolean', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'locked': { type: 'Boolean', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'}
				};
			},
			methods: function () {
				return {
					'requestGlobalObject': { type: '*', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'requestLocalObject': { type: '*', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'requestLocalObjectCopy': { type: 'void', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'lock': { type: 'void', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'},
					'removeObject': { type: 'void', declaredBy: 'weavejs.api.core.ILinkableDynamicObject'}
				};
			}
		};
	};
}

ILinkableDynamicObject.prototype.internalObject;
ILinkableDynamicObject.prototype.CLASS_INFO = { names: [{ name: 'ILinkableDynamicObject', qName: 'weavejs.api.core.ILinkableDynamicObject'}], interfaces: [ILinkableCompositeObject] };




