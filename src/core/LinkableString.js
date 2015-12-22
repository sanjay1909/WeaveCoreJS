if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to string values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {


    function LinkableString(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters

        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : null;
        verifier = typeof verifier !== 'undefined' ? verifier : null;
        defaultValueTriggersCallbacks = typeof defaultValueTriggersCallbacks !== 'undefined' ? defaultValueTriggersCallbacks : true;
        LinkableString.base(this, 'constructor', String, verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);

    }

    goog.inherits(LinkableString, weavecore.LinkableVariable);

    var p = LinkableString.prototype;

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

    p.setSessionState = function (val) {
        if (val !== null)
            val = String(val);
        LinkableString.base(this, 'setSessionState', val);
    };

    weavecore.LinkableString = LinkableString;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableString',
            qName: 'weavecore.LinkableString'
        }]
    };

}());
