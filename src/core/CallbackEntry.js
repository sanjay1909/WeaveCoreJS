/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {


    //Static Properties:
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_TRIGGER
     * @readOnly
     * @default "This is the stack trace from when the callbacks were last triggered."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_TRIGGER', {
        value: "This is the stack trace from when the callbacks were last triggered."
    });
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_ADD
     * @readOnly
     * @default "This is the stack trace from when the callback was added."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_ADD', {
        value: "This is the stack trace from when the callback was added."
    });
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_REMOVE
     * @readOnly
     * @default "This is the stack trace from when the callback was removed."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_REMOVE', {
        value: "This is the stack trace from when the callback was removed."
    });


    // constructor:
    /**
     * Internal Class used in {{#crossLink "CallbackCollection"}}{{/crossLink}}
     * @class CallbackEntry
     * @for CallbackCollection
     * @param {Object} context
     * @param {Function} callback
     * @constructor
     */
    function CallbackEntry(context, callback) {
        this.context = context;
        this.callback = callback;
        if (context)
            WeaveAPI.disposableChild(context, this);
        if (weavecore.CallbackCollection.debug)
            this.addCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_ADD);

    }


    var p = CallbackEntry.prototype;

    /**
     * @export
     * @type {Object}
     */
    p.context = null;


    /**
     * @export
     * @type {Function}
     */
    p.callback = null;


    /**
     * @export
     * @type {number}
     */
    p.recursionCount = 0;


    /**
     * @export
     * @type {number}
     */
    p.schedule = 0;


    /**
     * @export
     * @type {Error}
     */
    p.addCallback_stackTrace = null;


    /**
     * @export
     * @type {Error}
     */
    p.removeCallback_stackTrace = null;


    /**
     * Call this when the callback entry is no longer needed.
     * @method dispose
     */
    p.dispose = function () {
        if (weavecore.CallbackCollection.debug && this.callback !== null && this.callback !== undefined)
            this.removeCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_REMOVE).stack;

        this.context = null;
        this.callback = null;
    };


    weavecore.CallbackEntry = CallbackEntry;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'CallbackEntry',
            qName: 'weavecore.CallbackEntry'
        }],
        interfaces: [weavecore.IDisposableObject]
    };


}())
