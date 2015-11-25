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
    Object.defineProperty(LinkableFunction, 'NS', {
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
    Object.defineProperty(LinkableFunction, 'CLASS_NAME', {
        value: 'LinkableFunction'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFunction, 'SESSIONABLE', {
        value: true
    });

    /**
     * This is used as a placeholder to prevent re-compiling erroneous code.
     */
    Object.defineProperties(LinkableFunction, {
        'macros': {
            value: new weavecore.LinkableHashMap(LinkableFunction) //This is a list of macros that can be used in any LinkableFunction expression.
        },
        'macroLibraries': { //This is a list of libraries to include in the static compiler for macros.
            value: WeaveAPI.SessionManager.registerLinkableChild(WeaveAPI.globalHashMap, new weavecore.LinkableVariable(null, LinkableFunction.verifyLibraries))
        }
    });

    LinkableFunction._macroProxy = null; //* This is a proxy object for use as a symbol table for the compiler.

    LinkableFunction.debug = false;
    /**
     * This is the static compiler to be used by every LinkableFunction.
     */
    LinkableFunction._compiler = null;
    LinkableFunction._allLinkableFunctions = new Map(); // the keys in this are LinkableFunction instances

    LinkableFunction.RETURN_UNDEFINED = function () {
        return undefined;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    // static section



    /**
     * This function checks if a macro exists.
     * @param macroName The name of a macro to check.
     * @return A value of true if the specified macro exists, or false if it does not.
     */
    LinkableFunction._hasMacro = function (macroName) {
        return LinkableFunction.macros.getObject(macroName) !== null;
    }

    /**
     * This function evaluates a macro specified in the macros hash map,
     * catching and reporting any errors that are thrown.
     * @param macroName The name of the macro to evaluate.
     * @return The result of evaluating the macro.
     */
    LinkableFunction.evaluateMacro = function (macroName) {
        var lf = LinkableFunction.macros.getObject(macroName);
        lf = (lf && lf instanceof LinkableFunction) ? lf : null
        if (!lf)
            return undefined;
        if (lf._triggerCount !== lf.triggerCounter)
            lf.validate();
        if (lf._isFunctionDefinition)
            return lf;
        return lf.apply();
    }
    LinkableFunction.callMacro = function () {
        var params = Array.prototype.slice.call(arguments);
        var macroName = params.shift();
        // error catching/reporting is handled automatically for LinkableFunctions in the macros list.
        var lf = LinkableFunction.macros.getObject(macroName);
        return lf ? lf.apply(null, params) : undefined;
    }
    LinkableFunction.applyMacro = function () {
        var params = Array.prototype.slice.call(arguments);
        var macroName = params.shift();
        // error catching/reporting is handled automatically for LinkableFunctions in the macros list.
        var lf = LinkableFunction.macros.getObject(macroName);
        return lf ? lf.apply(null, params) : undefined;
    }





    LinkableFunction.verifyLibraries = function (state) {
        var array = state;

        // backwards compatibility for String
        if (typeof state === "string")
            array = WeaveAPI.CSVParser.parseCSVRow(state);

        // modify session state using deprecated class replacements
        if (array)
            array = array.map(function (name, i, a) {
                /*if (ClassUtils.isClassDeprecated(name))
                	return getQualifiedClassName(ClassUtils.getClassDefinition(name));*/
                return name;
            });

        // if we don't have any changes, use the original array
        if (weavecore.StandardLib.compare(array, state) === 0)
            return true;

        // use the new array
        LinkableFunction.macroLibraries.setSessionState(array);
        return false;
    }

    /**
     * This function will add a library to the static list of macro libraries if it is not already added.
     * @param libraryQName A library to add to the list of static libraries.
     */
    LinkableFunction.includeMacroLibrary = function (libraryQName) {
        var array = LinkableFunction.macroLibraries.getSessionState() || [];
        if (array.indexOf(libraryQName) < 0) {
            array.push(libraryQName);
            LinkableFunction.macroLibraries.setSessionState(array);
        }
    }



    /**
     * This function returns a new compiler initialized with the libraries specified by the public static libraries variable.
     * @param reportErrors If this is true, errors will be reported through WeaveAPI.ErrorManager.
     * @return A new initialized compiler.
     */
    LinkableFunction._getNewCompiler = function (reportErrors) {
        var compiler = new weavecore.Compiler();
        try {
            compiler.includeLibraries.apply(null, LinkableFunction.macroLibraries.getSessionState());
        } catch (e) {
            /*if (reportErrors)
            	reportError(e);*/
            conole.error(e)
        }
        return compiler;
    }

    /**
     * Tests if an expression is a single, valid symbol name.
     */
    LinkableFunction.isValidSymbolName = function (expression) {
        if (!LinkableFunction._compiler)
            LinkableFunction._compiler = LinkableFunction._getNewCompiler(true);
        return LinkableFunction._compiler.isValidSymbolName(expression);
    }

    // constructor:
    /**
     * LinkableFunction allows a function to be defined by a String that can use macros defined in the static macros hash map.
     * Libraries listed in macroLibraries variable will be included when compiling the function.
     * @class LinkableFunction
     * @constructor
     */
    /**
     * @param defaultValue The default function definition.
     * @param ignoreRuntimeErrors If this is true, errors thrown during evaluation of the function will be caught and values of undefined will be returned.
     * @param useThisScope When true, variable lookups will be evaluated as if the function were in the scope of the thisArg passed to the apply() function.
     * @param paramNames An Array of parameter names that can be used in the function definition.
     */
    function LinkableFunction(defaultValue, ignoreRuntimeErrors, useThisScope, paramNames) {
        if (defaultValue === undefined) defaultValue = null;
        if (ignoreRuntimeErrors === undefined) ignoreRuntimeErrors = false;
        if (useThisScope === undefined) useThisScope = false;
        if (paramNames === undefined) paramNames = null;
        weavecore.LinkableString.call(weavecore.StandardLib.unIndent(defaultValue));

        this._catchErrors = false;
        this._ignoreRuntimeErrors = ignoreRuntimeErrors;
        this._useThisScope = useThisScope;
        this._compiledMethod = null;
        this._paramNames = paramNames && paramNames.concat();;
        this._isFunctionDefinition = false;
        this._triggerCount = 0;

        Object.defineProperty(this, "length", {
            get: function () { //* This gets the length property of the generated Function.
                if (this._triggerCount !== this.triggerCounter)
                    this.validate();
                return this._compiledMethod.length;
            }
        });

        LinkableFunction.macroLibraries.addImmediateCallback(this, this.triggerCallbacks, false, true);
        WeaveAPI.SessionManager.getCallbackCollection(LinkableFunction.macros).addImmediateCallback(this, handleMacros.bind(this), false, true);





    }

    LinkableFunction.prototype = new weavecore.LinkableVariable();
    LinkableFunction.prototype.constructor = LinkableFunction;

    var p = LinkableFunction.prototype;

    function handleMacros() {
        if (WeaveAPI.SessionManager.getLinkableOwner(this) !== LinkableFunction.macros)
            this.triggerCallbacks();
    }



    /**
     * This will attempt to compile the function.  An Error will be thrown if this fails.
     */
    p.validate = function () {
        if (this._triggerCount !== this.triggerCounter) {
            // if this LinkableFunction is in the macros list, errors should be caught and reported.
            if (LinkableFunction.macros.getName(this))
                this._catchErrors = true;

            this._triggerCount = this.triggerCounter;
            // in case compile fails, prevent re-compiling erroneous code
            this._compiledMethod = LinkableFunction.RETURN_UNDEFINED;
            this._isFunctionDefinition = false;

            if (LinkableFunction._macroProxy === null)
                LinkableFunction._macroProxy = new weavecore.ProxyObject(LinkableFunction._hasMacro, LinkableFunction.evaluateMacro, null, LinkableFunction.callMacro); // allows evaluating macros but not setting them

            if (WeaveAPI.detectLinkableObjectChange(LinkableFunction._getNewCompiler, LinkableFunction.macroLibraries))
                LinkableFunction._compiler = LinkableFunction._getNewCompiler(true);

            var object = LinkableFunction._compiler.compileToObject(value);
            this._isFunctionDefinition = LinkableFunction._compiler.compiledObjectIsFunctionDefinition(object);
            this._compiledMethod = LinkableFunction._compiler.compileObjectToFunction(object, LinkableFunction._macroProxy, errorHandler.bind(this), this._useThisScope, this._paramNames);
        }
    }

    function errorHandler(e) {
        if (LinkableFunction.debug)
            console.error(e);

        if (this._ignoreRuntimeErrors || LinkableFunction.debug)
            return true;

        if (this._catchErrors) {
            console.error(e);
            return false;
        }

        throw e;
    }



    /**
     * This will evaluate the function with the specified parameters.
     * @param thisArg The value of 'this' to be used when evaluating the function.
     * @param argArray An Array of arguments to be passed to the compiled function.
     * @return The result of evaluating the function.
     */
    p.apply = function (thisArg, argArray) {
        if (this._triggerCount != this.triggerCounter)
            this.validate();
        return this._compiledMethod.apply(thisArg, argArray);
    }

    /**
     * This will evaluate the function with the specified parameters.
     * @param thisArg The value of 'this' to be used when evaluating the function.
     * @param args Arguments to be passed to the compiled function.
     * @return The result of evaluating the function.
     */
    p.call = function () {
        var args = Array.prototype.slice.call(arguments);
        var thisArg = args.shift();
        if (this._triggerCount !== this.triggerCounter)
            this.validate();
        return this._compiledMethod.apply(thisArg, args);
    }

    weavecore.LinkableFunction = LinkableFunction;
    weavecore.ClassUtils.registerClass('weavecore.LinkableFunction', LinkableFunction);

}());
