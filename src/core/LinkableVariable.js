if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}
/**
 * LinkableVariable allows callbacks to be added that will be called when the value changes.
 * A LinkableVariable has an optional type restriction on the values it holds.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {



    /**
     * If a defaultValue is specified, callbacks will be triggered in a later frame unless they have already been triggered before then.
     * This behavior is desirable because it allows the initial value to be handled by the same callbacks that handles new values.
     * @param sessionStateType The type of values accepted for this sessioned property.
     * @param verifier A function that returns true or false to verify that a value is accepted as a session state or not.  The function signature should be  function(value:*):Boolean.
     * @param defaultValue The default value for the session state.
     * @param defaultValueTriggersCallbacks Set this to false if you do not want the callbacks to be triggered one frame later after setting the default value.
     */

    function LinkableVariable(sessionStateType, verifier, defaultValue, defaultValueTriggersCallbacks) {
        sessionStateType = typeof sessionStateType !== 'undefined' ? sessionStateType : null;
        verifier = typeof verifier !== 'undefined' ? verifier : null;
        defaultValueTriggersCallbacks = typeof defaultValueTriggersCallbacks !== 'undefined' ? defaultValueTriggersCallbacks : true;

        LinkableVariable.base(this, 'constructor');

        if (sessionStateType != Object) {
            this._sessionStateType = sessionStateType;
            this._primitiveType = this._sessionStateType == String || this._sessionStateType == Number || this._sessionStateType == Boolean;
        }
        this._verifier = verifier;

        if (defaultValue !== undefined) {
            this.setSessionState(defaultValue);

            // If callbacks were triggered, make sure callbacks are triggered again one frame later when
            // it is possible for other classes to have a pointer to this object and retrieve the value.
            if (defaultValueTriggersCallbacks && this._triggerCounter > weavecore.CallbackCollection.DEFAULT_TRIGGER_COUNT)
                WeaveAPI.StageUtils.callLater(this, this._defaultValueTrigger);
        }
    }

    goog.inherits(LinkableVariable, weavecore.CallbackCollection);

    var p = LinkableVariable.prototype;



    Object.defineProperties(p, {
        /** @export */
        locked: {
            get: /** @this {weavecore.LinkableVariable} */ function () {
                return this._locked;
            }
        },
        /** @export */
        state: {
            get: /** @this {weavecore.LinkableVariable} */ function () {
                return this._sessionStateExternal;
            },
            set: /** @this {weavecore.LinkableVariable} */ function (value) {
                this.setSessionState(value);
            }
        }
    });

    /**
     * @protected
     * @type {Function}
     */
    p._verifier = null;


    /**
     * @protected
     * @type {boolean}
     */
    p._sessionStateWasSet = false;


    /**
     * @protected
     * @type {boolean}
     */
    p._primitiveType = false;


    /**
     * @protected
     * @type {Object}
     */
    p._sessionStateType = null;


    /**
     * @protected
     * @type {*}
     */
    p._sessionStateInternal = undefined;


    /**
     * @protected
     * @type {*}
     */
    p._sessionStateExternal = undefined;


    /**
     * @protected
     * @type {boolean}
     */
    p._locked = false;

    p._defaultValueTrigger = function () {
        // unless callbacks were triggered again since the default value was set, trigger callbacks now
        if (!this._wasDisposed && this._triggerCounter === weavecore.CallbackCollection.DEFAULT_TRIGGER_COUNT + 1)
            this.triggerCallbacks();

    }

    /**
     * This function will verify if a given value is a valid session state for this linkable variable.
     * @param value The value to verify.
     * @return A value of true if the value is accepted by this linkable variable.
     */
    p.verifyValue = function (value) {
        return this._verifier === null || this._verifier === undefined || this._verifier(value);
    }



    /**
     * The type restriction passed in to the constructor.
     */
    p.getSessionStateType = function () {
        return this._sessionStateType;
    };

    p.getSessionState = function () {
        return this._sessionStateExternal;
    };

    p.setSessionState = function (value) {
        if (this._locked)
            return;

        // cast value now in case it is not the appropriate type
        /*if (this._sessionStateType !== null && this._sessionStateType !== undefined)
            value = value;*/

        // stop if verifier says it's not an accepted value
        if (this._verifier !== null && this._verifier !== undefined && !this._verifier(value))
            return;

        var wasCopied = false;
        var type = null;
        if (value !== null && value !== undefined) {
            type = typeof (value);

            if (type === 'object' && value.constructor !== Object && value.constructor !== Array) {
                // convert to dynamic Object prior to sessionStateEquals comparison
                value = weavecore.ObjectUtil.copy(value);
                wasCopied = true;
            }
        }

        // If this is the first time we are calling setSessionState(), including
        // from the constructor, don't bother checking sessionStateEquals().
        // Otherwise, stop if the value did not change.
        if (this._sessionStateWasSet && this.sessionStateEquals(value))
            return;

        // If the value is a dynamic object, save a copy because we don't want
        // two LinkableVariables to share the same object as their session state.
        if (type === 'object') {
            if (!wasCopied) {
                value = weavecore.ObjectUtil.copy(value);
            }

            weavecore.DynamicState.alterSessionStateToBypassDiff(value);


            // save external copy, accessible via getSessionState()
            this._sessionStateExternal = value;

            // save internal copy
            this._sessionStateInternal = weavecore.ObjectUtil.copy(value);

        } else {
            // save primitive value
            this._sessionStateExternal = this._sessionStateInternal = value;
        }

        // remember that we have set the session state at least once.
        this._sessionStateWasSet = true;

        this.triggerCallbacks();
    };

    /**
     * This function is used in setSessionState() to determine if the value has changed or not.
     * object that prototype this object may override this function.
     */
    p.sessionStateEquals = function (otherSessionState) {
        if (this._primitiveType)
            return this._sessionStateInternal === otherSessionState;

        return weavecore.StandardLib.compare(this._sessionStateInternal, otherSessionState, objectCompare) === 0;
    };

    function objectCompare(a, b) {
        if (weavecore.DynamicState.isDynamicState(a, true) && weavecore.DynamicState.isDynamicState(b, true) && a[weavecore.DynamicState.CLASS_NAME] === b[weavecore.DynamicState.CLASS_NAME] && a[weavecore.DynamicState.OBJECT_NAME] === b[weavecore.DynamicState.OBJECT_NAME]) {
            return weavecore.StandardLib.compare(a[weavecore.DynamicState.SESSION_STATE], b[weavecore.DynamicState.SESSION_STATE], objectCompare);
        }
        return NaN;

    }


    /**
     * This function may be called to detect change to a non-primitive session state in case it has been modified externally.
     */
    p.detectChanges = function () {
        if (!this.sessionStateEquals(this._sessionStateExternal))
            this.triggerCallbacks();
    };

    p.lock = function () {
        this._locked = true;
    };





    p.dispose = function () {
        LinkableVariable.base(this, 'dispose');
        this.setSessionState(null);
    };

    weavecore.LinkableVariable = LinkableVariable;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableVariable',
            qName: 'weavecore.LinkableVariable'
        }],
        interfaces: [weavecore.ILinkableVariable, weavecore.ICallbackCollection, weavecore.IDisposableObject]
    };


}());
