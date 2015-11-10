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
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'CLASS_NAME', {
        value: 'UntypedLinkableVariable'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'SESSIONABLE', {
        value: true
    });

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
        weavecore.LinkableVariable.call(this, null, verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);
        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (value) {
                this.setSessionState(value);
            }
        });


    }

    UntypedLinkableVariable.prototype = new weavecore.LinkableVariable();
    UntypedLinkableVariable.prototype.constructor = UntypedLinkableVariable;

    var p = UntypedLinkableVariable.prototype;

    weavecore.UntypedLinkableVariable = UntypedLinkableVariable;
    weavecore.ClassUtils.registerClass('weavecore.UntypedLinkableVariable', UntypedLinkableVariable);

}());
