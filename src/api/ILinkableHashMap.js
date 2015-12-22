/**
 * @interface
 * @extends {weavecore.ILinkableCompositeObject}
 */
weavecore.ILinkableHashMap = function () {};
/**  * @type {Object}
 */
weavecore.ILinkableHashMap.prototype.typeRestriction;
weavecore.ILinkableHashMap.prototype.setNameOrder = function (newOrder) {};
weavecore.ILinkableHashMap.prototype.getNames = function (filter) {};
weavecore.ILinkableHashMap.prototype.getObjects = function (filter) {};
weavecore.ILinkableHashMap.prototype.getName = function (object) {};
weavecore.ILinkableHashMap.prototype.getObject = function (name) {};
weavecore.ILinkableHashMap.prototype.requestObject = function (name, classDef, lockObject) {};
weavecore.ILinkableHashMap.prototype.requestObjectCopy = function (name, objectToCopy) {};
weavecore.ILinkableHashMap.prototype.renameObject = function (oldName, newName) {};
weavecore.ILinkableHashMap.prototype.objectIsLocked = function (name) {};
weavecore.ILinkableHashMap.prototype.removeObject = function (name) {};
weavecore.ILinkableHashMap.prototype.removeAllObjects = function () {};
weavecore.ILinkableHashMap.prototype.generateUniqueName = function (baseName) {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ILinkableHashMap.prototype.CLASS_INFO = {
    names: [{
        name: 'ILinkableHashMap',
        qName: 'weavecore.ILinkableHashMap'
    }],
    interfaces: [weavecore.ILinkableCompositeObject]
};
