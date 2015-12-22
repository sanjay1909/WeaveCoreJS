/**
 * @interface
 * @extends {weavecore.ILinkableObject}
 */
weavecore.ILinkableCompositeObject = function () {};
weavecore.ILinkableCompositeObject.prototype.getSessionState = function () {};
weavecore.ILinkableCompositeObject.prototype.setSessionState = function (newState, removeMissingDynamicObjects) {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ILinkableCompositeObject.prototype.CLASS_INFO = {
    names: [{
        name: 'ILinkableCompositeObject',
        qName: 'weavecore.ILinkableCompositeObject'
    }],
    interfaces: [weavecore.ILinkableObject]
};
