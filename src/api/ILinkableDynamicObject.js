/**
 * @interface
 * @extends {weavecore.ILinkableCompositeObject}
 */
weavecore.ILinkableDynamicObject = function () {};
/**  * @type {weavecore.ILinkableObject}
 */
weavecore.ILinkableDynamicObject.prototype.internalObject;
weavecore.ILinkableDynamicObject.prototype.requestGlobalObject = function (name, objectType, lockObject) {};
weavecore.ILinkableDynamicObject.prototype.requestLocalObject = function (objectType, lockObject) {};
weavecore.ILinkableDynamicObject.prototype.requestLocalObjectCopy = function (objectToCopy) {};
weavecore.ILinkableDynamicObject.prototype.lock = function () {};
weavecore.ILinkableDynamicObject.prototype.removeObject = function () {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ILinkableDynamicObject.prototype.CLASS_INFO = {
    names: [{
        name: 'ILinkableDynamicObject',
        qName: 'weavecore.ILinkableDynamicObject'
    }],
    interfaces: [weavecore.ILinkableCompositeObject]
};
