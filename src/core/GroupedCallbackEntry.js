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
     * True while handling grouped callbacks.
     * @private
     * @static
     * @property _handlingGroupedCallbacks
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._handlingGroupedCallbacks = false;

    /**
     * True while handling grouped callbacks called recursively from other grouped callbacks.
     * @private
     * @static
     * @property _handlingRecursiveGroupedCallbacks
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = false;

    /**
     * This gets set to true when the static _handleGroupedCallbacks() callback has been added as a frame listener.
     * @private
     * @static
     * @property _initialized
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._initialized = false;

    /**
     * This maps a groupedCallback function to its corresponding GroupedCallbackEntry.
     * @private
     * @static
     * @readOnly
     * @property _entryLookup
     * @type Map
     */
    Object.defineProperty(GroupedCallbackEntry, '_entryLookup', {
        value: new Map()
    });

    /**
     * This is a list of GroupedCallbackEntry objects in the order they were triggered.
     * @private
     * @static
     * @readOnly
     * @property _triggeredEntries
     * @type Array
     */
    Object.defineProperty(GroupedCallbackEntry, '_triggeredEntries', {
        value: []
    });

    /**
     * @private
     * @const
     * @type {Object}
     */
    GroupedCallbackEntry.CONTEXT_PLACEHOLDER = {};



    //Static Methods:

    /**
     * @method addGroupedCallback
     * @static
     * @param {CallbackCollection} callbackCollection
     * @param {Object} relevantContext
     * @param {Function} groupedCallback
     * @param {Boolean} triggerCallbackNow
     */
    GroupedCallbackEntry.addGroupedCallback = function (callbackCollection, relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy) {
        // context shouldn't be null because we use it to determine when to clean up the GroupedCallbackEntry.
        if (relevantContext === null || relevantContext === undefined)
            relevantContext = GroupedCallbackEntry.CONTEXT_PLACEHOLDER;
        // get (or create) the shared entry for the groupedCallback
        callbackCollection.removeCallback(groupedCallback, relevantContext);
        var entry = GroupedCallbackEntry._entryLookup.get(groupedCallback);
        if (!entry) {
            entry = new GroupedCallbackEntry(relevantContext, groupedCallback);
            GroupedCallbackEntry._entryLookup.set(groupedCallback, entry);
        }


        entry.targets.push(callbackCollection);
        if (delayWhileBusy)
            entry.delayWhileBusy = true;



        callbackCollection.addImmediateCallback(relevantContext, entry.trigger, triggerCallbackNow);
    };

    /**
     * @method removeGroupedCallback
     * @static
     * @param {CallbackCollection} callbackCollection
     * @param {Function} groupedCallback
     */
    GroupedCallbackEntry.removeGroupedCallback = function (callbackCollection, groupedCallback) {
        // remove the trigger function as a callback
        var entry = GroupedCallbackEntry._entryLookup.get(groupedCallback);
        if (entry)
            callbackCollection.removeCallback(entry.trigger, callbackCollection);
    };

    /**
     * This function gets called once per frame and allows grouped callbacks to run.
     * @method _handleGroupedCallbacks
     * @static
     * @private
     */
    GroupedCallbackEntry._handleGroupedCallbacks = function () {
        var i;
        var entry;

        GroupedCallbackEntry._handlingGroupedCallbacks = true;
        // Handle grouped callbacks in the order they were triggered,
        // anticipating that more may be added to the end of the list in the process.
        // This first pass does not allow grouped callbacks to call each other immediately.
        for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
            entry = GroupedCallbackEntry._triggeredEntries[i];
            entry.handleGroupedCallback();
        }

        // after all grouped callbacks have been handled once, run those which were triggered recursively and allow them to call other grouped callbacks immediately.
        GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = true;
        // handle grouped callbacks that were triggered recursively
        for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
            entry = GroupedCallbackEntry._triggeredEntries[i];
            if (entry.triggeredAgain)
                entry.handleGroupedCallback();
        }

        GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = false;
        GroupedCallbackEntry._handlingGroupedCallbacks = false;

        // reset for next frame
        for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
            entry = GroupedCallbackEntry._triggeredEntries[i];
            entry.triggered = entry.triggeredAgain = false;
        }
        GroupedCallbackEntry._triggeredEntries.length = 0;

    };
    // constructor:
    /**
     * Internal Class used in {{#crossLink "CallbackCollection"}}{{/crossLink}}
     * @class GroupedCallbackEntry
     * @extends CallbackEntry
     * @for CallbackCollection
     * @param {Function} groupedCallback
     * @constructor
     */
    function GroupedCallbackEntry(context, groupedCallback) {
        this.targets = [];
        GroupedCallbackEntry.base(this, 'constructor', context, groupedCallback);
        this.trigger = goog.bind(trigger, this);
        if (!GroupedCallbackEntry._initialized) {
            WeaveAPI.StageUtils.addEventCallback("tick", null, GroupedCallbackEntry._handleGroupedCallbacks);
            GroupedCallbackEntry._initialized = true;
        }
    }
    goog.inherits(GroupedCallbackEntry, weavecore.CallbackEntry);


    var p = GroupedCallbackEntry.prototype;

    /**
     * @export
     * @type {boolean}
     */
    p.triggered = false;


    /**
     * @export
     * @type {boolean}
     */
    p.triggeredAgain = false;


    /**
     * @export
     * @type {boolean}
     */
    p.delayWhileBusy = false;


    /**
     * @export
     * @type {Array}
     */
    p.targets;

    /**
     * Marks the entry to be handled later (unless already triggered this frame).
     * This also takes care of preventing recursion.
     * @method trigger
     */
    function trigger() {
        // if handling recursive callbacks, call now
        if (GroupedCallbackEntry._handlingRecursiveGroupedCallbacks) {
            this.handleGroupedCallback();
        } else if (!this.triggered) {
            // not previously triggered
            GroupedCallbackEntry._triggeredEntries.push(this);
            this.triggered = true;
        } else if (GroupedCallbackEntry._handlingGroupedCallbacks) {
            // triggered recursively - call later
            this.triggeredAgain = true;
        }
    };


    /**
     * Checks the context(s) before calling groupedCallback
     * @method handleGroupedCallback
     */
    p.handleGroupedCallback = function () {
        if (!this.context)
            return;

        // first, make sure there is at least one relevant context for this callback.
        var allContexts = this.context;
        // remove the contexts that have been disposed.
        for (var i = 0; i < allContexts.length; i++)
            if (WeaveAPI.SessionManager.objectWasDisposed(allContexts[i]))
                allContexts.splice(i--, 1);
            // if there are no more relevant contexts for this callback, don't run it.
        if (allContexts.length === 0) {
            this.dispose();
            GroupedCallbackEntry._entryLookup.delete(this.callback);
            return;
        }

        // avoid immediate recursion
        if (this.recursionCount === 0) {
            this.recursionCount++;
            this.callback();
            this.recursionCount--;
        }
        // avoid delayed recursion
        this.triggeredAgain = false;
    };


    /**
     * @export
     * @override
     */
    p.dispose = function () {
        for (var i = 0; i < this.targets.length; i++) {
            var target = this.targets[i];
            GroupedCallbackEntry.removeGroupedCallback(target, this.context, this.callback);
        }

        GroupedCallbackEntry.base(this, 'dispose');
    };

    weavecore.GroupedCallbackEntry = GroupedCallbackEntry;


    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'GroupedCallbackEntry',
            qName: 'weavecore.GroupedCallbackEntry'
        }]
    };




}());
