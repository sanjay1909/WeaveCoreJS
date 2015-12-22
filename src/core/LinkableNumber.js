if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Number values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {


    function LinkableNumber(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : NaN;
        verifier = typeof verifier !== 'undefined' ? verifier : null;
        defaultValueTriggersCallbacks = typeof defaultValueTriggersCallbacks !== 'undefined' ? defaultValueTriggersCallbacks : true;
        LinkableNumber.base(this, 'constructor', Number, verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);

        // Note: Calling  weavecore.LinkableVariable.call() will set all the default values for member variables defined in the super class,
        // which means we can't set _sessionStateInternal = NaN here.
        //weavecore.LinkableVariable.call(this, "number", verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);



    }

    goog.inherits(LinkableNumber, weavecore.LinkableVariable);

    var p = LinkableNumber.prototype;

    Object.defineProperties(p, {
        value: {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (value) {
                this.setSessionState(value);
            }
        }
    });

    // override is important to avoid sending undefiend value
    // getSessionState usally called from Sessionmanager, main purpose is to create log entries..
    p.getSessionState = function () {
        // this make sure Number(undefined) will return NaN.
        return Number(this._sessionStateExternal)

    };

    p.setSessionState = function (val) {
        if (typeof (val) != "number") {
            if (val === null || val === '' || val === undefined) val = NaN;
            else val = Number(val);
        }
        LinkableNumber.base(this, 'setSessionState', val);
    };

    p.sessionStateEquals = function (otherSessionState) {
        // We must check for null here because we can't set _sessionStateInternal = NaN in the constructor.
        if (this._sessionStateInternal === null || this._sessionStateInternal === undefined)
            this._sessionStateInternal = this._sessionStateExternal = NaN;
        if (isNaN(this._sessionStateInternal) && isNaN(otherSessionState))
            return true;
        return this._sessionStateInternal === otherSessionState;
    };

    weavecore.LinkableNumber = LinkableNumber;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableNumber',
            qName: 'weavecore.LinkableNumber'
        }]
    };

}());
