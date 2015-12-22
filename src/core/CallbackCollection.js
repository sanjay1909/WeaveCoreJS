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
    "use strict";

    // Static Public Const Properties
    /**
     * The name of the property containing the name assigned to the object when the session state is generated.
     * @static
     * @public
     * @property DEFAULT_TRIGGER_COUNT
     * @readOnly
     * @default 1
     * @type number
     */
    Object.defineProperty(CallbackCollection, 'DEFAULT_TRIGGER_COUNT', {
        value: 1
    });



    // constructor:
    /**
     * This class manages a list of callback functions.
     * If specified, the preCallback function will be called immediately before running each
     * callback using the parameters passed to _runCallbacksImmediately(). This means if there
     * are five callbacks added, preCallback() gets called five times whenever
     * _runCallbacksImmediately() is called.  An example usage of this is to make sure a relevant
     * variable is set to the appropriate value while each callback is running.  The preCallback
     * function will not be called before grouped callbacks.
     * @class CallbackCollection
     * @param {Function} preCallback An optional function to call before each immediate callback.
     * @constructor
     */

    function CallbackCollection(preCallback) {
        preCallback = typeof preCallback !== 'undefined' ? preCallback : null;

        this._callbackEntries = [];
        this._triggerCounter = CallbackCollection.DEFAULT_TRIGGER_COUNT;
        this._disposeCallbackEntries = [];
        this._preCallback = preCallback;

        this.triggerCallbacks = goog.bind(triggerCallbacks, this);
    }




    // Prototypes
    var p = CallbackCollection.prototype;

    Object.defineProperties(p, {
        /** @export */
        triggerCounter: {
            get: function () {
                return this._triggerCounter;
            }
        },
        /** @export */
        callbacksAreDelayed: {
            get: function () {
                return this._delayCount > 0;
            }
        },
        /** @export */
        wasDisposed: {
            get: function () {
                return this._wasDisposed;
            }
        }
    });

    /**
     * @export
     * @type {weavecore.ILinkableObject}
     */
    p._linkableObject;


    /**
     * @private
     * @type {string}
     */
    p._lastTriggerStackTrace;


    /**
     * @private
     * @type {Array}
     */
    p._oldEntries;


    /**
     * @private
     * @type {Array}
     */
    p._callbackEntries;


    /**
     * @protected
     * @type {Function}
     */
    p._preCallback = null;


    /**
     * @private
     * @type {number}
     */
    p._delayCount = 0;


    /**
     * @private
     * @type {boolean}
     */
    p._runCallbacksIsPending = false;




    /**
     * @private
     * @type {number}
     */
    p._triggerCounter;

    /**
     * @private
     * @type {boolean}
     */
    p._runCallbacksCompleted;

    /**
     * @private
     * @type {Array}
     */
    p._disposeCallbackEntries;

    /**
     * @private
     * @type {boolean}
     */
    p._wasDisposed = false;

    // public methods:
    /**
     * This adds the given function as a callback.  The function must not require any parameters.
     * The callback function will not be called recursively as a result of it triggering callbacks recursively.
     * @method addImmediateCallback
     * @param {Object} relevantContext If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param {Function} callback The function to call when callbacks are triggered.
     * @param {Boolean} runCallbackNow If this is set to true, the callback will be run immediately after it is added.
     * @param {Boolean} alwaysCallLast If this is set to true, the callback will be always be called after any callbacks that were added with alwaysCallLast=false.  Use this to establish the desired child-to-parent triggering order.
     */
    p.addImmediateCallback = function (relevantContext, callback, runCallbackNow, alwaysCallLast) {

        // set default value for parameters
        runCallbackNow = typeof runCallbackNow !== 'undefined' ? runCallbackNow : false;
        alwaysCallLast = typeof alwaysCallLast !== 'undefined' ? alwaysCallLast : false;

        if (callback === null || callback === undefined)
            return;

        // remove the callback if it was previously added
        this.removeCallback(callback);

        var entry = new weavecore.CallbackEntry(relevantContext, callback);
        if (alwaysCallLast) // this will run the callback in second round of callback entries
            entry.schedule = 1; //mostly parent.triggercallback are called last.
        this._callbackEntries.push(entry);

        if (runCallbackNow) {
            // increase the recursion count while the function is running
            entry.recursionCount++;
            callback.apply(relevantContext || callback['this']);
            entry.recursionCount--;
        }
    };

    /**
     * This will trigger every callback function to be called with their saved arguments.
     * If the delay count is greater than zero, the callbacks will not be called immediately.
     * @method triggerCallbacks
     */
    function triggerCallbacks() {
        if (CallbackCollection.debug) {
            this._lastTriggerStackTrace = new Error(CallbackCollection.STACK_TRACE_TRIGGER).stack;
        }

        if (this._delayCount > 0) {
            // we still want to increase the counter even if callbacks are delayed
            this._triggerCounter++;
            this._runCallbacksIsPending = true;
            return;
        }
        this._runCallbacksImmediately();
    };


    /**
     * This function runs callbacks immediately, ignoring any delays.
     * The preCallback function will be called with the specified preCallbackParams arguments.
     * @method _runCallbacksImmediately
     * @param preCallbackParams The arguments to pass to the preCallback function given in the constructor.
     * @protected
     * @final
     */
    p._runCallbacksImmediately = function () {
        var preCallbackParams = Array.prototype.slice.call(arguments, 0);
        //increase the counter immediately
        this._triggerCounter++;
        this._runCallbacksIsPending = false;

        // This flag is set to false before running the callbacks.  When it becomes true, the loop exits.
        this._runCallbacksCompleted = false;

        for (var schedule = 0; schedule < 2; schedule++) {
            // run the callbacks in the order they were added
            for (var i = 0; i < this._callbackEntries.length; i++) {
                // If this flag is set to true, it means a recursive call has finished running callbacks.
                // If _preCallback is specified, we don't want to exit the loop because that cause a loss of information.
                if (this._runCallbacksCompleted && (this._preCallback === undefined || this._preCallback === null))
                    break;

                var entry = this._callbackEntries[i];

                // if we haven't reached the matching schedule yet, skip this callback
                if (entry.schedule != schedule)
                    continue;
                // Remove the entry if the context was disposed by SessionManager.
                var shouldRemoveEntry;
                if (entry.callback === null || entry.callback === undefined)
                    shouldRemoveEntry = true;
                else if (weavecore.ClassUtils.is(entry.context, CallbackCollection)) // special case
                    shouldRemoveEntry = entry.context.wasDisposed;
                else
                    shouldRemoveEntry = WeaveAPI.wasDisposed(entry.context);
                if (shouldRemoveEntry) {
                    if (CallbackCollection.debug) {
                        if (arguments.length > 1) console.log("Entry is disposed");
                    }
                    entry.dispose();
                    // remove the empty callback reference from the list
                    var removed = this._callbackEntries.splice(i--, 1); // decrease i because remaining entries have shifted
                    if (CallbackCollection.debug)
                        this._oldEntries = this._oldEntries ? this._oldEntries.concat(removed) : removed;
                    continue;
                }
                // if _preCallback is specified, we don't want to limit recursion because that would cause a loss of information.
                if (entry.recursionCount === 0 || (this._preCallback !== undefined && this._preCallback !== null)) {
                    entry.recursionCount++; // increase count to signal that we are currently running this callback.
                    if (this._preCallback !== undefined && this._preCallback !== null)
                        this._preCallback.apply(this, preCallbackParams);
                    if (CallbackCollection.debug) {
                        if (arguments.length > 1) console.log(["callback executed"]);
                    }
                    entry.callback.apply(entry.context || entry.callback['this']);

                    entry.recursionCount--; // decrease count because the callback finished.
                }
            }
        }
        // This flag is now set to true in case this function was called recursively.  This causes the outer call to exit its loop.
        this._runCallbacksCompleted = true;
    };

    /**
     * This function will remove a callback that was previously added.
     * @method removeCallback
     * @param {Function} callback The function to remove from the list of callbacks.
     */
    p.removeCallback = function (callback, relevantContext) {
        // if the callback was added as a grouped callback, we need to remove the trigger function
        weavecore.GroupedCallbackEntry.removeGroupedCallback(this, relevantContext, callback);
        // find the matching CallbackEntry, if any
        for (var outerLoop = 0; outerLoop < 2; outerLoop++) {
            var entries = outerLoop === 0 ? this._callbackEntries : this._disposeCallbackEntries;
            for (var index = 0; index < entries.length; index++) {
                var entry = entries[index];
                // if (entry !== null && entry !== undefined && callback === entry.callback && entry.context === relevantContext) {
                if (entry !== null && entry !== undefined && callback === entry.callback) {
                    // Remove the callback by setting the function pointer to null.
                    // This is done instead of removing the entry because we may be looping over the _callbackEntries Array right now.
                    entry.dispose();
                }
            }
        }
    };



    /**
     * This will increase the delay count by 1.  To decrease the delay count, use resumeCallbacks().
     * As long as the delay count is greater than zero, effects of triggerCallbacks() will be delayed.
     * @method delayCallbacks
     */
    p.delayCallbacks = function () {
        this._delayCount++;
    };

    /**
     * This will decrease the delay count by one if it is greater than zero.
     * If triggerCallbacks() was called while the delay count was greater than zero, immediate callbacks will be called now.
     * @method resumeCallbacks
     */
    p.resumeCallbacks = function () {
        if (this._delayCount > 0)
            this._delayCount--;

        if (this._delayCount === 0 && this._runCallbacksIsPending)
            this.triggerCallbacks("resume Callbacks");
    };

    /**
     * This will add a callback that will only be called once, when this callback collection is disposed.
     * @method addDisposeCallback
     * @param {Object} relevantContext If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param callback {Function} The function to call when this callback collection is disposed.
     */
    p.addDisposeCallback = function (relevantContext, callback) {
        // don't do anything if the dispose callback was already added
        for (var i = 0; i < this._disposeCallbackEntries.length; i++) {
            var entry = this._disposeCallbackEntries[i];
            if (entry.callback === callback && entry.context === relevantContext)
                return;
        }


        this._disposeCallbackEntries.push(new weavecore.CallbackEntry(relevantContext, callback));
    };


    /**
     * This function will be called automatically when the object is no longer needed, and should not be called directly.
     * Use disposeObject() instead so parent-child relationships get cleaned up automatically.
     * @method dispose
     */
    p.dispose = function () {
        // remove all callbacks
        if (CallbackCollection.debug)
            this._oldEntries = this._oldEntries ? this._oldEntries.concat(this._callbackEntries) : this._callbackEntries.concat();

        this._callbackEntries.forEach(function (entry) {
            entry.dispose();
        });

        this._callbackEntries.length = 0;
        this._wasDisposed = true;

        // run & remove dispose callbacks
        while (this._disposeCallbackEntries.length) {
            var entry = this._disposeCallbackEntries.shift();
            if (entry.callback !== null && entry.callback !== undefined && !WeaveAPI.wasDisposed(entry.context)) {
                entry.callback.apply(entry.context || entry.callback['this']);
            }
        }
    };



    /**
     * Adds a callback that will only be called during a scheduled time each frame.  Grouped callbacks use a central trigger list,
     * meaning that if multiple ICallbackCollections trigger the same grouped callback before the scheduled time, it will behave as
     * if it were only triggered once.  For this reason, grouped callback functions cannot have any parameters.  Adding a grouped
     * callback to a ICallbackCollection will undo any previous effects of addImmediateCallback() or addDisposeCallback() made to the
     * same ICallbackCollection.  The callback function will not be called recursively as a result of it triggering callbacks recursively.
     * @method addGroupedCallback
     * @param relevantContext {Object} If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param groupedCallback {Function} The callback function that will only be allowed to run during a scheduled time each frame.  It must not require any parameters.
     * @param triggerCallbackNow {Boolean} If this is set to true, the callback will be triggered to run during the scheduled time after it is added.
     */
    p.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy) {
        //set default value for parameters
        triggerCallbackNow = typeof triggerCallbackNow !== 'undefined' ? triggerCallbackNow : false;
        delayWhileBusy = typeof delayWhileBusy !== 'undefined' ? delayWhileBusy : true;
        weavecore.GroupedCallbackEntry.addGroupedCallback(this, relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy);
    };



    weavecore.CallbackCollection = CallbackCollection;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'CallbackCollection',
            qName: 'weavecore.CallbackCollection'
        }],
        interfaces: [weavecore.ICallbackCollection, weavecore.IDisposableObject]
    };

}());
