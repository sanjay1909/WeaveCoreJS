

import ILinkableCompositeObject from "./ILinkableCompositeObject"

export default class ILinkableHashMap
{
	constructor()
	{
		
	}

	setNameOrder(newOrder) {};
	getNames(filter, filterIncludesPlaceholders) {};
	getObjects(filter, filterIncludesPlaceholders) {};
	toObject(filter, filterIncludesPlaceholders) {};
	toMap(filter, filterIncludesPlaceholders) {};
	getName(object) {};
	getObject(name) {};
	setObject(name, object, lockObject) {};
	requestObject(name, classDef, lockObject) {};
	requestObjectCopy(name, objectToCopy) {};
	renameObject(oldName, newName) {};
	objectIsLocked(name) {};
	removeObject(name) {};
	removeAllObjects() {};
	generateUniqueName(baseName) {};
}

ILinkableHashMap.prototype.typeRestriction;
ILinkableHashMap.prototype.CLASS_INFO = { names: [{ name: 'ILinkableHashMap', qName: 'weavejs.api.core.ILinkableHashMap'}], interfaces: [ILinkableCompositeObject] };




