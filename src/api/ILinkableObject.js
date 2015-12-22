/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


/**
 * @interface
 */
weavecore.ILinkableObject = function () {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ILinkableObject.prototype.CLASS_INFO = {
    names: [{
        name: 'ILinkableObject',
        qName: 'weavecore.ILinkableObject'
    }]
};
