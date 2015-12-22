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
     * This is a LinkableVariable that adds "get value" and "set value" functions for untyped values.
     * @class UntypedLinkableVariable
     * @constructor
     */
    function UntypedLinkableVariable(defaultValue, verifier, defaultValueTriggersCallbacks) {
        if (defaultValue === undefined) defaultValue = null;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;
        LinkableVariable.base(this, 'constructor', null, verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);



    }
    goog.inherits(UntypedLinkableVariable, weavecore.LinkableVariable)


    var p = UntypedLinkableVariable.prototype;

    Object.defineProperty(p, 'value', {
        get: function () {
            return this._sessionStateExternal;
        },
        set: function (value) {
            this.setSessionState(value);
        }
    });

    weavecore.UntypedLinkableVariable = UntypedLinkableVariable;

    p.CLASS_INFO = {
        names: [{
            name: 'UntypedLinkableVariable',
            qName: 'weavecore.UntypedLinkableVariable'
        }]
    };

}());
