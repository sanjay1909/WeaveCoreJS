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


    // constructor:
    /**
     * @class LinkablePromise
     * @param {Function} A function to invoke, which must take zero parameters and may return an AsyncToken.
     * @param {Object} A description of the task as a String, or a function to call which returns a descriptive string.
     * @param {Boolean}
     * @constructor
     */

    function LinkablePromise(task, description, validateNow) {
        escription = typeof description !== 'undefined' ? description : null;
        validateNow = typeof validateNow !== 'undefined' ? validateNow : false;

        this._task = task;
        this._description = description;
        this._callbackCollection = WeaveAPI.SessionManager.getCallbackCollection(this);
        this._callbackCollection.addImmediateCallback(this, this._immediateCallback);
        this._callbackCollection.addGroupedCallback(this, this._groupedCallback, validateNow);
        if (validateNow) {
            this._lazy = false;
            this._immediateCallback();
        }
    }



    // Prototypes
    var p = LinkablePromise.prototype;



    /**
     * @private
     * @type {Function}
     */
    p._task;


    /**
     * @private
     * @type {Object}
     */
    p._description;


    /**
     * @private
     * @type {weavejs.api.core.ICallbackCollection}
     */
    p._callbackCollection;


    /**
     * @private
     * @type {boolean}
     */
    p._lazy = true;


    /**
     * @private
     * @type {boolean}
     */
    p._invalidated = true;


    /**
     * @private
     * @type {Object}
     */
    p._jsPromise;


    /**
     * @private
     * @type {number}
     */
    p._selfTriggeredCount = 0;


    /**
     * @private
     * @type {Object}
     */
    p._result;


    /**
     * @private
     * @type {Object}
     */
    p._error;


    Object.defineProperties(p, {
        result: {
            get: function () {
                this.validate();
                return this._result;
            }
        },
        error: {
            get: function () {
                this.validate();
                return this._error;
            }
        }
    });

    p.validate = function () {
        if (!this._lazy)
            return;

        this._lazy = false;

        if (this._invalidated)
            this._callbackCollection.triggerCallbacks();

    }

    p._immediateCallback = function () {
        // stop if self-triggered
        if (this._callbackCollection.triggerCounter === this._selfTriggeredCount)
            return;

        // reset variables
        this._invalidated = true;
        // _asyncToken = null;
        this._result = null;
        this._error = null;

        //  Progress Indicator we are no longer waiting for the async task
        WeaveAPI.ProgressIndicator.removeTask(this._groupedCallback);

        // stop if lazy
        if (this._lazy)
            return;

        // stop if still busy because we don't want to invoke the task if an external dependency is not ready
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this)) {
            // make sure _groupedCallback() will not invoke the task.
            // this is ok to do since callbacks will be triggered again when the dependencies are no longer busy.
            this._invalidated = false;
            return;
        }


        var _tmp_description = null;
        if (this._description instanceof Function)
            _tmp_description = this._description();
        else
            _tmp_description = this._description;

        //Progress Indicator mark as busy starting now because we plan to start the task inside _groupedCallback()
        WeaveAPI.ProgressIndicator.addTask(this._groupedCallback, this, _tmp_description);
    }

    p._groupedCallback = function () {
        try {
            if (this._lazy || !this._invalidated)
                return;

            // _invalidated is true prior to invoking the task
            var invokeResult = this._task.apply(null);

            // if _invalidated has been set to false, it means _immediateCallback() was triggered from the task and it's telling us we should stop now.
            if (!this._invalidated)
                return;

            // set _invalidated to false now since we invoked the task
            this._invalidated = false;

            if (invokeResult instanceof weavecore.CustomPromise)
                invokeResult.addResponder({
                    result: _handleResult.bind(this),
                    fault: _handleFault.bind(this),
                    token: invokeResult
                });
            else if (invokeResult instanceof Promise) {
                invokeResult.then(this._handleResult, this._handleFault);
            } else {
                this._result = invokeResult;
                WeaveAPI.StageUtils.callLater(this, this._handleResult);
            }


        } catch (invokeError) {
            this._invalidated = false;
            this._error = invokeError;
            WeaveAPI.StageUtils.callLater(this, this._handleFault);
        }
    }

    p._handleResult = function (result) {
        result = (result === undefined ? null : result);

        if (this._invalidated)
            return;

        // ProgressIndicator no longer busy
        WeaveAPI.ProgressIndicator.removeTask(this._groupedCallback);

        // if there is an result, save the result
        if (result)
            this._result = result;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }

    p._handleFault = function (fault) {
        fault = (fault === undefined ? null : fault);

        if (this._invalidated)
            return;

        //Progress Indicator no longer busy
        WeaveAPI.ProgressIndicator.removeTask(this._groupedCallback);

        // if there is an fault, save the error
        if (fault)
            this._error = fault;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }



    /**
     * Registers dependencies of the LinkablePromise.
     * @method depend
     * @param dependencies {Array} Array of dependencies, Taken form JS Arguments Parameter
     */
    p.depend = function () {

        if (arguments) {
            for (var i = 0; i < arguments.length; i++) {
                var dependency = arguments[i];
                WeaveAPI.SessionManager.registerLinkableChild(this, dependency);
            }

        }

        return this;
    }

    p.dispose = function () {
        WeaveAPI.ProgressIndicator.removeTask(this._groupedCallback);
        this._lazy = true;
        this._invalidated = true;
        this._result = null;
        this._error = null;
    }

    weavecore.LinkablePromise = LinkablePromise;


    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkablePromise',
            qName: 'weavecore.LinkablePromise'
        }],
        interfaces: [weavecore.ILinkableObject, weavecore.IDisposableObject]
    };



}());
