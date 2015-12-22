/**
 * @interface
 * @extends {weavejs.api.core.ICallbackCollection}
 */
weavecore.IChildListCallbackInterface = function () {};
/**  * @type {weavejs.api.core.ILinkableObject}
 */
weavecore.IChildListCallbackInterface.prototype.lastObjectAdded;


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.IChildListCallbackInterface.prototype.CLASS_INFO = {
    names: [{
        name: 'IChildListCallbackInterface',
        qName: 'weavecore.IChildListCallbackInterface'
    }],
    interfaces: [weavecore.ICallbackCollection]
};
