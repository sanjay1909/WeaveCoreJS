if (typeof window === 'undefined') {
    //this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    //window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function JavaScript() {

    }



    /**
     * Maps an ID to its corresponding value for use with _jsonReviver/_jsonReplacer.
     * Also maps a Function to its corresponding ID.
     */
    Object.defineProperty(JavaScript, '_jsonLookup', {
        value: new Map()
    });


    Object.defineProperties(JavaScript, {
        'JSON_CALL': { //This is the name of the generic external interface function which uses JSON input and output.
            value: "_jsonCall"
        },
        'JSON_REPLACER': { //The name of the property used to store a replacer function for the second parameter of JSON.stringify
            value: "_jsonReplacer"
        },
        'JSON_REVIVER': { //TThe name of the property used to store a reviver function for the second parameter of JSON.parse
            value: "_jsonReviver"
        },
        'JSON_LOOKUP': { //TThe name of the property used to store a reviver function for the second parameter of JSON.parse
            value: "_jsonLookup"
        },
        'JSON_SUFFIX': { //A random String which is highly unlikely to appear in any String value.  Used as a suffix for <code>NaN, -Infinity, Infinity</code>.
            value: ';' + Math.random() + ';' + new Date()
        }

    });

    //A random String which is highly unlikely to appear in any String value.  Used as a prefix for function identifiers in JSON.
    Object.defineProperty(JavaScript, 'JSON_FUNCTION_PREFIX', {
        value: 'function' + JavaScript.JSON_SUFFIX + ';'
    });

    /**
     * Used for generating unique function IDs.
     * Use a positive increment for ActionScript functions.
     * The JavaScript equivalent uses a negative increment to avoid collisions.
     */
    JavaScript._functionCounter = 0;

    /**
     * This flag will be set to true whenever _jsonReplacer makes a replacement that requires _jsonReviver to interpret.
     */
    JavaScript._needsReviving = false;

    /**
     * Extensions to _jsonReplacer/_jsonReviver.
     */
    JavaScript._jsonExtensions = [];

    /**
     * The name of a JavaScript property of this flash instance which contains an Array of JSON replacer/reviver extensions.
     * Each object in the Array can contain "replacer" and "reviver" properties containing the extension functions.
     */
    JavaScript.JSON_EXTENSIONS = "_jsonExtensions";

    /**
     * This is set to true when initialize() has been called.
     */
    JavaScript.initialized = false;


    /**
     * If this is true, backslashes need to be escaped when returning a String to JavaScript.
     */
    JavaScript.backslashNeedsEscaping = true;

    /**
     * Caches a new proxy function for a JavaScript function in _jsonLookup.
     * @param id The ID of the JavaScript function.
     * @return The proxy function.
     */
    JavaScript._cacheProxyFunction = function (id) {
        var params = {
            "id": id,
            "catch": false
        };

        //replaced JavaScript Exec with the function to avoid eval
        var func = function () {
            params['args'] = Array.prototype.slice.call(arguments);
            return (function () {
                var args = params['args'];
                var id = params['id'];
                var func = this._jsonReviver('', id);
                return func.apply(func['this'], args);
            }).apply(weave);
        };



        JavaScript._jsonLookup[func] = id;
        JavaScript._jsonLookup[id] = func;

        return func;
    }

    /**
     * Initializes json variable and required external JSON interface.
     */
    JavaScript.initialize = function () {
        // one-time initialization attempt
        JavaScript.initialized = true;

        // save special IDs for values not supported by JSON
			[NaN, Infinity, -Infinity].forEach(function (symbol) {
            JavaScript._jsonLookup.set(symbol + JavaScript.JSON_SUFFIX, symbol)
        });

        // determine if backslashes need to be escaped
        var slashes = "\\\\";
        JavaScript.backslashNeedsEscaping = true;
        //(ExternalInterface.call('function(slashes){ return slashes; }', slashes) !== slashes);


        //ExternalInterface.addCallback(JavaScript.JSON_CALL, _jsonCall);
        weave[JavaScript.JSON_CALL] = JavaScript._jsonCall;

        (function () {
            var JSON_CALL = JavaScript.JSON_CALL;
            var JSON_LOOKUP = JavaScript.JSON_LOOKUP;
            var JSON_SUFFIX = JavaScript.JSON_SUFFIX;
            var JSON_REVIVER = JavaScript.JSON_REVIVER;
            var JSON_REPLACER = JavaScript.JSON_REPLACER;
            var JSON_EXTENSIONS = JavaScript.JSON_EXTENSIONS;
            var JSON_FUNCTION_PREFIX = JavaScript.JSON_FUNCTION_PREFIX;
            var flash = this;
            var toJson = function (value) {
                return JSON.stringify(value, flash[JSON_REPLACER]);
            };
            var fromJson = function (value) {
                return JSON.parse(value, flash[JSON_REVIVER]);
            };
            var functionCounter = 0;
            var lookup = flash[JSON_LOOKUP] = {};
            var extensions = flash[JSON_EXTENSIONS] = [];
            var symbols = [NaN, Infinity, -Infinity];
            for (var i in symbols)
                lookup[symbols[i] + JSON_SUFFIX] = symbols[i];

            function cacheProxyFunction(id) {
                var func = function () {
                    if (!flash[JSON_CALL])
                        throw new Error("Cannot use the JavaScript API of a Flash object after it has been removed from the DOM.");
                    var params = Array.prototype.slice.call(arguments);
                    var paramsJson = toJson(params);
                    var resultJson = flash[JSON_CALL](id, paramsJson);
                    return fromJson(resultJson);
                };
                func[JSON_FUNCTION_PREFIX] = id;
                return lookup[id] = func;
            }
            flash[JSON_REPLACER] = function (key, value) {
                if (typeof value === "function") {
                    if (!value[JSON_FUNCTION_PREFIX]) {
                        var id = JSON_FUNCTION_PREFIX + (--functionCounter);
                        value[JSON_FUNCTION_PREFIX] = id;
                        lookup[id] = value;
                    }
                    value = value[JSON_FUNCTION_PREFIX];
                } else if (typeof value === "number" && !isFinite(value))
                    value = value + JSON_SUFFIX;
                else if (Array.isArray(value) && !(value instanceof Array))
                    value = Array.prototype.slice.call(value);
                for (var i in extensions)
                    if (typeof extensions[i] === "object" && typeof extensions[i].replacer === "function")
                        value = extensions[i].replacer.call(flash, key, value);
                return value;
            };
            flash[JSON_REVIVER] = function (key, value) {
                if (typeof value === "string") {
                    if (lookup.hasOwnProperty(value))
                        value = lookup[value];
                    else if (value.substr(0, JSON_FUNCTION_PREFIX.length) == JSON_FUNCTION_PREFIX)
                        value = cacheProxyFunction(value);
                }
                for (var i in extensions)
                    if (typeof extensions[i] === "object" && typeof extensions[i].reviver === "function")
                        value = extensions[i].reviver.call(flash, key, value);
                return value;
            };
        }).apply(weave);
        /* JavaScript.exec({
                 "JSON_FUNCTION_PREFIX": JavaScript.JSON_FUNCTION_PREFIX,
                 "JSON_EXTENSIONS": JavaScript.JSON_EXTENSIONS,
                 "JSON_REPLACER": JavaScript.JSON_REPLACER,
                 "JSON_REVIVER": JavaScript.JSON_REVIVER,
                 "JSON_SUFFIX": JavaScript.JSON_SUFFIX,
                 "JSON_LOOKUP": JavaScript.JSON_LOOKUP,
                 "JSON_CALL": JavaScript.JSON_CALL
             },
             'var flash = this;',
             'var toJson = function(value) { return JSON.stringify(value, flash[JSON_REPLACER]); };',
             'var fromJson = function(value) { return JSON.parse(value, flash[JSON_REVIVER]); };',
             'var functionCounter = 0;',
             'var lookup = flash[JSON_LOOKUP] = {};',
             'var extensions = flash[JSON_EXTENSIONS] = [];',
             'var symbols = [NaN, Infinity, -Infinity];',
             'for (var i in symbols)',
             '   lookup[symbols[i] + JSON_SUFFIX] = symbols[i];',
             'function cacheProxyFunction(id) {',
             '   var func = function() {',
             '       if (!flash[JSON_CALL])',
             '           throw new Error("Cannot use the JavaScript API of a Flash object after it has been removed from the DOM.");',
             '       var params = Array.prototype.slice.call(arguments);',
             '       var paramsJson = toJson(params);',
             '       var resultJson = flash[JSON_CALL](id, paramsJson);',
             '       return fromJson(resultJson);',
             '   };',
             '   func[JSON_FUNCTION_PREFIX] = id;',
             '   return lookup[id] = func;',
             '}',
             'flash[JSON_REPLACER] = function(key, value) {',
             '   if (typeof value === "function") {',
             '       if (!value[JSON_FUNCTION_PREFIX]) {',
             '           var id = JSON_FUNCTION_PREFIX + (--functionCounter);',
             '           value[JSON_FUNCTION_PREFIX] = id;',
             '           lookup[id] = value;',
             '       }',
             '       value = value[JSON_FUNCTION_PREFIX];',
             '   }',
             '   else if (typeof value === "number" && !isFinite(value))',
             '       value = value + JSON_SUFFIX;',
             '   else if (Array.isArray(value) && !(value instanceof Array))',
             '       value = Array.prototype.slice.call(value);',
             '   for (var i in extensions)',
             '       if (typeof extensions[i] === "object" && typeof extensions[i].replacer === "function")',
             '           value = extensions[i].replacer.call(flash, key, value);',
             '   return value;',
             '};',
             'flash[JSON_REVIVER] = function(key, value) {',
             '   if (typeof value === "string") {',
             '       if (lookup.hasOwnProperty(value))',
             '           value = lookup[value];',
             '       else if (value.substr(0, JSON_FUNCTION_PREFIX.length) == JSON_FUNCTION_PREFIX)',
             '           value = cacheProxyFunction(value);',
             '   }',
             '   for (var i in extensions)',
             '       if (typeof extensions[i] === "object" && typeof extensions[i].reviver === "function")',
             '           value = extensions[i].reviver.call(flash, key, value);',
             '   return value;',
             '};'
         );*/
    }

    JavaScript.exec = function () {
        var paramsAndCode = Array.prototype.slice.call(arguments);
        if (!JavaScript.initialized)
            JavaScript.initialize();

        if (paramsAndCode.length === 1 && paramsAndCode[0] instanceof Array)
            paramsAndCode = paramsAndCode[0];

        /*var pNames = JSON ? null : [];
        var pValues = JSON ? null : [];*/
        var code = [];
        //var marshallExceptions = true;

        // separate function parameters from code
        paramsAndCode.forEach(function (item) {
            if (item.constructor.name === 'Object') {
                // We assume that all the keys in the Object are valid JavaScript identifiers,
                // since they are to be used in the code as variables.
                for (var key in item) {
                    var value = item[key];
                    if (key === 'this') {
                        // put a variable declaration at the beginning of the code
                        var thisVar = (value && typeof value === 'string') ? value : null;
                        if (thisVar) {
                            code.unshift("var " + thisVar + " = this;");
                        }
                    } else if (key === 'catch') {
                        // save error handler
                        //marshallExceptions = value;
                    } else if (JSON) {
                        // put a variable declaration at the beginning of the code
                        var jsValue;
                        if (value === null || value === undefined || typeof value === "number" || typeof value === "boolean")
                            jsValue = String(value);
                        else if (value instanceof Function)
                            jsValue = 'this.' + JavaScript.JSON_REVIVER + '("", ' + json.stringify(value, JavaScript._jsonReplacer) + ')';
                        else if (typeof value === 'object') {
                            JavaScript._needsReviving = false;
                            jsValue = JSON.stringify(value, JavaScript._jsonReplacer);
                            if (JavaScript._needsReviving)
                                jsValue = 'JSON.parse(' + JSON.stringify(jsValue) + ', this.' + JavaScript.JSON_REVIVER + ')';
                        } else
                            jsValue = JSON.stringify(value);

                        code.unshift("var " + key + " = " + jsValue + ";");
                    }
                }
            } else {
                code.push(String(item));
            }
        });
        var appliedCode = '(function(){\n' + code.join('\n') + '\n}).apply(weave)';

        var result = undefined;
        try {
            // work around unescaped backslash bug
            if (JavaScript.backslashNeedsEscaping && appliedCode.indexOf('\\') >= 0)
                appliedCode = appliedCode.split('\\').join('\\\\');

            result = evalFunction(appliedCode, null);
            if (result)
                result = JSON.parse(result, JavaScript._jsonReviver);

        } catch (e) {
            console.log(e);
        }
        return result;
    }

    function evalFunction(__code_from_flash__, __arguments_from_flash__) {
        try {
            return JSON.stringify(window.eval(__code_from_flash__), weavecore.JavaScript.JSON_REPLACER);
        } catch (e) {
            e.message += "\n" + __code_from_flash__;
            console.error(e);
        }
    }

    /**
     * Handles a JavaScript request.
     * @param methodId The ID of the method to call.
     * @param paramsJson An Array of parameters to pass to the method, stringified with JSON.
     * @return The result of calling the method, stringified with JSON.
     */
    JavaScript._jsonCall = function (methodId, paramsJson) {

        var method = JavaScript._jsonReviver('', methodId);
        method = (method && method instanceof Function) ? method : null;
        if (method === null)
            throw new Error('No method with id="' + methodId + '"');

        // json to object
        //var params;
        //if (JSON)
        var params = JSON.parse(paramsJson, JavaScript._jsonReviver);
        /*else
        	params = (paramsJson as Array).map(_mapJsonReviver);*/

        var result = method.apply(null, params);

        // object to json
        //var resultJson;
        //if (json)
        var resultJson = JSON.stringify(result, JavaScript._jsonReplacer) || 'null';
        /*else
        	resultJson = result is Array ? (result as Array).map(_mapJsonReplacer) : _jsonReplacer('', result);*/

        // work around unescaped backslash bug
        if (typeof (resultJson) === 'string' && JavaScript.backslashNeedsEscaping && (resultJson).indexOf('\\') >= 0)
            resultJson = (resultJson).split('\\').join('\\\\');

        return resultJson;
    }

    /**
     * Preserves primitive values not supported by JSON: undefined, NaN, Infinity, -Infinity
     * Also looks up or generates a Function corresponding to its ID value.
     */
    JavaScript._jsonReviver = function (key, value) {
        if (typeof (value) === 'string') {
            if (JavaScript._jsonLookup.hasOwnProperty(value))
                value = JavaScript._jsonLookup.get(value);
            else if ((value).substr(0, JavaScript.JSON_FUNCTION_PREFIX.length) === JavaScript.JSON_FUNCTION_PREFIX)
                value = JavaScript._cacheProxyFunction(value); // ID -> Function
        }
        JavaScript._jsonExtensions.forEach(function (extension) {
            if (extension[JavaScript.JSON_REVIVER] instanceof Function)
                value = extension[JavaScript.JSON_REVIVER](key, value);
        });
        return value;
    }

    /**
     * Preserves primitive values not supported by JSON: NaN, Infinity, -Infinity
     * Also looks up or generates an ID corresponding to a Function value.
     */
    JavaScript._jsonReplacer = function (key, value) {
        // Function -> ID
        if (value && value instanceof Function) {
            var id = JavaScript._jsonLookup.get(value);
            if (!id) {
                id = JavaScript.JSON_FUNCTION_PREFIX + (++JavaScript._functionCounter);
                JavaScript._jsonLookup.set(value, id);
                JavaScript._jsonLookup.set(id, value);
            }
            JavaScript._needsReviving = true;
            value = id;
        } else if (typeof (value) === "number" && !isFinite(value)) {
            JavaScript._needsReviving = true;
            value = value + JavaScript.JSON_SUFFIX;
        }
        JavaScript._jsonExtensions.forEach(function (extension) {
            if (extension[JavaScript.NEEDS_REVIVING] instanceof Function && extension[JavaScript.NEEDS_REVIVING](key, value))
                JavaScript._needsReviving = true;
            if (extension[JavaScript.JSON_REPLACER] instanceof Function)
                value = extension[JavaScript.JSON_REPLACER](key, value);
        });
        return value;
    }


    JavaScript.extendJson = function (replacer, reviver, needsReviving) {
        var extension = {};
        extension[JavaScript.JSON_REPLACER] = replacer;
        extension[JavaScript.JSON_REVIVER] = reviver;
        extension[JavaScript.NEEDS_REVIVING] = needsReviving;
        JavaScript._jsonExtensions.push(extension);
    }


    /**
     * Exposes a method to JavaScript.
     * @param methodName The name to be used in JavaScript.
     * @param method The method.
     */
    JavaScript.registerMethod = function (methodName, method) {
        if (!JavaScript.initialized)
            JavaScript.initialize();

        var jsonId = JavaScript._jsonReplacer('', method)
        this[methodName] = this[JavaScript.JSON_REVIVER]('', jsonId);

    }

    /**
     * Handles a JavaScript request.
     * @param methodId The ID of the method to call.
     * @param paramsJson An Array of parameters to pass to the method, stringified with JSON.
     * @return The result of calling the method, stringified with JSON.
     */
    JavaScript._jsonCall = function (methodId, paramsJson) {
        //ExternalInterface.marshallExceptions = true; // let the external code handle errors

        var method = JavaScript._jsonReviver('', methodId);
        method = (method && method instanceof Function) ? method : null;
        if (method === null)
            throw new Error('No method with id="' + methodId + '"');

        // json to object
        var params = JSON.parse(paramsJson, JavaScript._jsonReviver);

        var result = method.apply(null, params);

        // object to json
        var resultJson = JSON.stringify(result, JavaScript._jsonReplacer) || 'null';


        // work around unescaped backslash bug
        if (typeof resultJson === 'string' && JavaScript.backslashNeedsEscaping && (resultJson).indexOf('\\') >= 0)
            resultJson = (resultJson).split('\\').join('\\\\');

        return resultJson;
    }

    weavecore.JavaScript = JavaScript;

}());
