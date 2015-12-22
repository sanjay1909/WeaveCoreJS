if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Boolean values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {


    function LinkableBoolean(defaultValue, verifier, defaultValueTriggersCallbacks) {
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
        verifier = typeof verifier !== 'undefined' ? verifier : null;
        defaultValueTriggersCallbacks = typeof defaultValueTriggersCallbacks !== 'undefined' ? defaultValueTriggersCallbacks : true;
        LinkableBoolean.base(this, 'constructor', Boolean, verifier, defaultValue, defaultValueTriggersCallbacks);
    }

    goog.inherits(LinkableBoolean, weavecore.LinkableVariable);

    var p = LinkableBoolean.prototype;

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
        if (typeof (val) === "string") {
            val = weavecore.ObjectUtil.stringCompare(val, "true", true) === 0;
        }
        LinkableBoolean.base(this, 'setSessionState', val ? true : false);
    };

    weavecore.LinkableBoolean = LinkableBoolean;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableBoolean',
            qName: 'weavecore.LinkableBoolean'
        }]
    };

}());
