// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    /**
     * This serves as a structure for storing the information required to make a function call.
     * This is used in the Compiler class to avoid parsing tokens multiple times.
     * To avoid function call overhead, no public functions are not defined in this class.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function CompiledFunctionCall(compiledMethod, compiledParams) {
        /**
         * This is a compiled object that evaluates to a method.
         */
        this.compiledMethod = compiledMethod;
        /**
         * This is an Array of CompiledObjects that must be evaluated before calling the method.
         */
        this.compiledParams = compiledParams;



        if (!compiledMethod)
            throw new Error("compiledMethod cannot be null");

        if (compiledParams) {
            compiledParams.forEach(function (param) {
                if (param === null)
                    throw new Error("compiledParams cannot contain nulls");
            });
        }






        this.evaluateConstants();
    }

    CompiledFunctionCall._clone = function (obj, i, a) {
        i = (i === undefined) ? -1 : i;
        a = (a === undefined) ? null : a;
        var cfc = obj;
        if (cfc)
            return new weavecore.CompiledFunctionCall(CompiledFunctionCall._clone(cfc.compiledMethod), cfc.compiledParams && cfc.compiledParams.map(_clone));
        return obj;
    }


    var p = CompiledFunctionCall.prototype;

    /**
     * This is a compiled object that evaluates to a method.
     */
    p.compiledMethod;
    /**
     * This is an Array of CompiledObjects that must be evaluated before calling the method.
     */
    p.compiledParams;

    /**
     * This is used to keep track of which compiled parameter is currently being evaluated.
     */
    p.evalIndex;
    /**
     * When the function is called as a property of an object, this will store a pointer to the object
     * so that it can be used as the 'this' parameter in Function.apply().
     */
    p.evaluatedHost;
    /**
     * When the function is called as a property of an object, this will store the property name in case the host is a Proxy object.
     */
    p.evaluatedMethodName;
    /**
     * This is used to store the result of evaluating the compiledMethod before evaluating the parameters.
     */
    p.evaluatedMethod;
    /**
     * This is an Array of constants to use as parameters to the method.
     * This Array is used to store the results of evaluating the compiledParams Array before calling the method.
     */
    p.evaluatedParams;
    /**
     * An optional set of original tokens to use in place of this CompiledFunctionCall when decompiling.
     */
    p.originalTokens;

    p.evaluateConstants = function () {
        // if name is constant, evaluate it once now
        if (this.compiledMethod instanceof weavecore.CompiledConstant)
            this.evaluatedMethod = (this.compiledMethod).value;
        else
            this.evaluatedMethod = null;

        if (this.compiledParams) {
            if (!this.evaluatedParams) {
                this.evaluatedParams = [];
                this.evaluatedParams.length = this.compiledParams.length;
            } else
                this.evaluatedParams.length = this.compiledParams.length;

            // move constant values from the compiledParams array to the evaluatedParams array.
            for (var i = 0; i < this.compiledParams.length; i++)
                if (this.compiledParams[i] instanceof weavecore.CompiledConstant)
                    this.evaluatedParams[i] = (this.compiledParams[i]).value;
        } else {
            this.evaluatedParams = null;
        }
    }

    /**
     * Makes a deep copy of this and any nested CompiledFunctionCall objects suitable for recursive function execution.
     */
    p.clone = function () {
        return CompiledFunctionCall._clone(this);
    }

    weavecore.CompiledFunctionCall = CompiledFunctionCall;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'CompiledFunctionCall',
            qName: 'weavecore.CompiledFunctionCall'
        }],
        interfaces: [weavecore.ICompiledObject]
    };

}());
