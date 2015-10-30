// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    /**
     * This serves as a wrapper for a constant value to remember that it was compiled.
     * This is used in the Compiler class to avoid parsing tokens multiple times.
     * To avoid function call overhead, no public functions are defined in this class.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function CompiledConstant(name, value) {

        this.name = name;
        this.value = value;

    }

    CompiledConstant.prototype = new weavecore.ICompiledObject();
    CompiledConstant.prototype.constructor = CompiledConstant;

    weavecore.CompiledConstant = CompiledConstant;

}());
