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
weavecore.IDisposableObject = function () {};
weavecore.IDisposableObject.prototype.dispose = function () {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.IDisposableObject.prototype.CLASS_INFO = {
    names: [{
        name: 'IDisposableObject',
        qName: 'weavecore.IDisposableObject'
    }]
};
