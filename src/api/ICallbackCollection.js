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
 * @extends {weavecore.ILinkableObject}
 */
weavecore.ICallbackCollection = function () {};
weavecore.ICallbackCollection.prototype.addImmediateCallback = function (relevantContext, callback, runCallbackNow, alwaysCallLast) {};
weavecore.ICallbackCollection.prototype.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy) {};
weavecore.ICallbackCollection.prototype.addDisposeCallback = function (relevantContext, callback) {};
weavecore.ICallbackCollection.prototype.removeCallback = function (relevantContext, callback) {};
weavecore.ICallbackCollection.prototype.triggerCallbacks = function () {};
/**  * @type {number}
 */
weavecore.ICallbackCollection.prototype.triggerCounter;
weavecore.ICallbackCollection.prototype.delayCallbacks = function () {};
weavecore.ICallbackCollection.prototype.resumeCallbacks = function () {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ICallbackCollection.prototype.CLASS_INFO = {
    names: [{
        name: 'ICallbackCollection',
        qName: 'weavecore.ICallbackCollection'
    }],
    interfaces: [weavecore.ILinkableObject]
};
