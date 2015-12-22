/**
 * @interface
 * @extends {weavecore.ILinkableObject}
 */
weavecore.ILinkableVariable = function () {};
weavecore.ILinkableVariable.prototype.getSessionState = function () {};
weavecore.ILinkableVariable.prototype.setSessionState = function (value) {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ILinkableVariable.prototype.CLASS_INFO = {
    names: [{
        name: 'ILinkableVariable',
        qName: 'weavecore.ILinkableVariable'
    }],
    interfaces: [weavecore.ILinkableObject]
};
