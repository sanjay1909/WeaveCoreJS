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

    // constructor:
    /**
     * This is an empty interface used to identify a compiled object type.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function ICompiledObject() {

    }

    weavecore.ICompiledObject = ICompiledObject;

}());
