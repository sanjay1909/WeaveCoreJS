if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * A set of static functions intended for use as a JavaScript API.
 *
 * The user interface in Weave is initially generated from a saved session state.
 * User interactions affect the session state, and changes in the session state affect
 * the display at runtime.  The API provides a window into the session state so most
 * interactions that can be made through the GUI can also be made through JavaScript calls.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ExternalSessionStateInterface, 'NS', {
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
    Object.defineProperty(ExternalSessionStateInterface, 'CLASS_NAME', {
        value: 'ExternalSessionStateInterface'
    });

    /**
     * Stores information for removeCallback() and removeAllCallbacks()
     */
    ExternalSessionStateInterface._d2d_callback_target = new weavecore.Dictionary2D();
    ExternalSessionStateInterface._funcToWrapper = new Map();
    ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = null;


    // need to nmke them static ans this referenc elost when called from jsonCall
    /**
     * This object maps an expression name to the saved expression function.
     */
    Object.defineProperties(ExternalSessionStateInterface, {
        '_compiler': {
            value: new weavecore.Compiler()
        },
        '_variables': {
            value: {} //This object maps an expression name to the saved expression function.
        }

    });

    function ExternalSessionStateInterface() {



    }

    var p = ExternalSessionStateInterface.prototype;

    /**
     * @inheritDoc
     */
    p.getSessionState = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            var state = WeaveAPI.SessionManager.getSessionState(object);
            _convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
            return state;
        }

        externalWarning("No ILinkableObject from which to get session state at path {0}", weavecore.Compiler.stringify(objectPath));
        return null;
    }

    /**
     * This function modifies a session state, converting any nested XML objects to Strings.
     * @param state A session state that may contain nested XML objects.
     */
    function _convertSessionStateToPrimitives(state) {
        var stateType = typeof state;
        if (stateType === 'string' || stateType === 'number' || stateType === 'boolean') {
            return;
        }
        for (var key in state) {
            var value = state[key];
            _convertSessionStateToPrimitives(value);
        }
    }

    p.setSessionState = function (objectPath, newState, removeMissingObjects) {
        // default parameter values
        removeMissingObjects = (removeMissingObjects === undefined) ? true : removeMissingObjects;
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            WeaveAPI.SessionManager.setSessionState(object, newState, removeMissingObjects);
            return true;
        }

        externalError("No ILinkableObject for which to set session state at path {0}", weavecore.Compiler.stringify(objectPath));
        return false;
    }

    p.getObjectType = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object)
            return object.constructor.NS + '.' + object.constructor.CLASS_NAME;

        // no warning since getObjectType() may be used to check whether or not an object exists.
        return null;
    }

    p.getChildNames = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            if (object instanceof weavecore.LinkableHashMap)
                return object.getNames();
            if (object instanceof weavecore.LinkableDynamicObject)
                return [null];
            return WeaveAPI.SessionManager.getLinkablePropertyNames(object, true);
        }

        externalError("No ILinkableObject for which to get child names at path {0}", weavecore.Compiler.stringify(objectPath));
        return null;
    }

    p.setChildNameOrder = function (hashMapPath, orderedChildNames) {
        var hashMap = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, hashMapPath);
        hashMap = (hashMap && hashMap instanceof weavecore.LinkableHashMap) ? hashMap : null;
        if (hashMap) {
            // it's ok if there are no names specified, because that wouldn't accomplish anything anyway
            if (orderedChildNames)
                hashMap.setNameOrder(orderedChildNames);
            return true;
        }

        externalError("No ILinkableHashMap for which to reorder children at path {0}", weavecore.Compiler.stringify(hashMapPath));
        return false;
    }

    p.requestObject = function (objectPath, objectType) {
        // get class definition
        var classQName = objectType;
        var classDef = weavecore.ClassUtils.getClassDefinition(objectType);
        if (classDef === null) {
            externalError("No class definition for {0}", weavecore.Compiler.stringify(classQName));
            return false;
        }
        /* if (ClassUtils.isClassDeprecated(classQName))
             externalWarning("{0} is deprecated.", objectType);*/

        // stop if there is no path specified
        if (!objectPath || !objectPath.length) {
            if (Object(WeaveAPI.globalHashMap).constructor === classDef)
                return true;

            externalError("Cannot request an object at the root path");
            return false;
        }
        // Get parent object first in case there is some backwards compatibility code that gets
        // executed when it is accessed (registering deprecated class definitions, for example).
        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, parentPath);

        // request the child object
        var hashMap = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        var dynamicObject = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        var child = null;
        if (hashMap) {
            if (typeof (childName) === 'number')
                childName = hashMap.getNames()[childName];
            child = hashMap.requestObject(String(childName), classDef, false);
        } else if (dynamicObject)
            child = dynamicObject.requestGlobalObject(String(childName), classDef, false);
        else
            child = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);

        if (child && child.constructor === classDef)
            return true;

        externalError("Request for {0} failed at path {1}", objectType, weavecore.Compiler.stringify(objectPath));
        return false;
    }

    p.removeObject = function (objectPath) {
        if (!objectPath || !objectPath.length) {
            externalError("Cannot remove root object");
            return false;
        }

        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, parentPath);

        var hashMap = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (hashMap) {
            if (typeof (childName) === 'number')
                childName = hashMap.getNames()[childName];

            if (hashMap.objectIsLocked(String(childName))) {
                externalError("Object is locked and cannot be removed (path: {0})", weavecore.Compiler.stringify(objectPath));
                return false;
            }

            hashMap.removeObject(childName);
            return true;
        }

        var dynamicObject = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        if (dynamicObject) {
            if (dynamicObject.locked) {
                externalError("Object is locked and cannot be removed (path: {0})", weavecore.Compiler.stringify(objectPath));
                return false;
            }

            dynamicObject.removeObject();
            return true;
        }

        if (parent)
            externalError("Parent object does not support dynamic children, so cannot remove child at path {0}", weavecore.Compiler.stringify(objectPath));
        else
            externalError("No parent from which to remove a child at path {0}", weavecore.Compiler.stringify(objectPath));
        return false;
    }




    /*function convertSessionStateObjectToXML(sessionState: Object, tagName: String = null): String {
        var result: XML = WeaveXMLEncoder.encode(sessionState, tagName || "sessionState");
        return result.toXMLString();
    }

    function convertSessionStateXMLToObject(sessionStateXML: String): Object {
        var xml: XML = XML(sessionStateXML);
        var state: Object = WeaveXMLDecoder.decode(xml);
        this._convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
        return state;
    }*/



    /**
     * Gets an object from a path or a variable name and sets getObjectFromPathOrVariableName_error.
     * If the path was invalid or the variable uninitialized, getObjectFromPathOrVariableName_error will be set with an appropriate error message.
     * @param objectPathOrVariableName Either an Array for a path or a String for a variable name.
     * @return The object at the specified path, the value of the specified variable, or null if the parameter was null.
     */
    //private
    function _getObjectFromPathOrVariableName(objectPathOrVariableName) {
        ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = null;

        if (objectPathOrVariableName === null || objectPathOrVariableName === undefined)
            return null;

        if (objectPathOrVariableName.constructor === Array) {
            var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPathOrVariableName);
            if (object)
                return object;

            ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = "No ILinkableObject at path " + weavecore.Compiler.stringify(objectPathOrVariableName);;
            return null;
        }

        var variableName = String(objectPathOrVariableName);
        if (variableName) {
            if (ExternalSessionStateInterface._variables.hasOwnProperty(variableName))
                return ExternalSessionStateInterface._variables[variableName];

            ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = "Undefined variable " + weavecore.Compiler.stringify(variableName);;
            return null;
        }

        return null;
    }

    /**
     * @inheritDoc
     */
    p.evaluateExpression = function (scopeObjectPathOrVariableName, expression, variables, staticLibraries, assignVariableName) {
        variables = (variables === undefined) ? null : variables;
        staticLibraries = (staticLibraries === undefined) ? null : staticLibraries;
        assignVariableName = (assignVariableName === undefined) ? null : assignVariableName;

        try {
            if (staticLibraries)
                ExternalSessionStateInterface._compiler.includeLibraries.apply(null, staticLibraries);

            var isAssignment = (assignVariableName !== null); // allows '' to be used to ignore resulting value
            if (assignVariableName && !ExternalSessionStateInterface._compiler.isValidSymbolName(assignVariableName))
                throw new Error("Invalid variable name: " + weavecore.Compiler.encodeString(assignVariableName));

            // To avoid "variable is undefined" errors, treat variables[''] as an Array of keys and set any missing properties to undefined
            if (variables && variables[''])
                variables[''].forEach(function (key) {
                    if (!variables.hasOwnProperty(key))
                        variables[key] = undefined;
                });

            var thisObject = _getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error)
                throw new Error(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
            var compiledObject = ExternalSessionStateInterface._compiler.compileToObject(expression);
            var isFuncDef = ExternalSessionStateInterface._compiler.compiledObjectIsFunctionDefinition(compiledObject);
            // passed-in variables take precedence over stored ActionScript weave._variables
            var compiledMethod = ExternalSessionStateInterface._compiler.compileObjectToFunction(
                compiledObject, [variables, ExternalSessionStateInterface._variables],
                WeaveAPI.ErrorManager.reportError.bind(WeaveAPI.ErrorManager),
                thisObject !== null,
                null,
                null,
                true,
                thisObject
            );
            var result = isFuncDef ? compiledMethod : compiledMethod.apply(thisObject);
            if (isAssignment)
                ExternalSessionStateInterface._variables[assignVariableName] = result;
            else
                return result;
        } catch (e) {
            externalError(e.message);
        }
        return undefined;
    }




    p.addCallback = function (scopeObjectPathOrVariableName, callback, triggerCallbackNow, immediateMode, delayWhileBusy) {
        // set default values
        triggerCallbackNow = (triggerCallbackNow === undefined) ? false : triggerCallbackNow;
        immediateMode = (immediateMode === undefined) ? false : immediateMode;
        delayWhileBusy = (delayWhileBusy === undefined) ? true : delayWhileBusy;

        try {
            if (scopeObjectPathOrVariableName === null || scopeObjectPathOrVariableName === undefined) {
                externalError("addCallback(): No path or variable name given");
                return false;
            }

            var object = _getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            object = (object && object instanceof weavecore.ILinkableObject) ? object : null;
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error) {
                externalError(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                externalError('No ILinkableObject to which to add a callback at path or variable ', weavecore.Compiler.stringify(scopeObjectPathOrVariableName));
                return false;
            }
            if (delayWhileBusy) {
                var fn = (ExternalSessionStateInterface._funcToWrapper.get(callback) && ExternalSessionStateInterface._funcToWrapper.get(callback) instanceof Function) ? ExternalSessionStateInterface._funcToWrapper.get(callback) : null
                callback = fn || ExternalSessionStateInterface._funcToWrapper.set(callback, generateBusyWaitWrapper(callback));
            }
            ExternalSessionStateInterface._d2d_callback_target.set(callback, object, true);
            if (immediateMode)
                WeaveAPI.SessionManager.getCallbackCollection(object).addImmediateCallback(null, callback, triggerCallbackNow);
            else
                WeaveAPI.SessionManager.getCallbackCollection(object).addGroupedCallback(null, callback, triggerCallbackNow);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            WeaveAPI.ErrorManager.reportError(e);
        }
        return false;
    }

    function generateBusyWaitWrapper(callback) {
        var wrapper = function () {
            var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(wrapper).keys();
            for (var i = 0; i < keys.length; i++) {
                var target = keys[i];
                if (WeaveAPI.SessionManager.linkableObjectIsBusy(target))
                    return;
            }
            callback();
        };
        return wrapper;
    }

    /**
     * @inheritDoc
     */
    p.removeCallback = function (objectPathOrVariableName, callback, everywhere) {
        //set parameter's default values
        everywhere = (everywhere === undefined) ? false : everywhere;
        var wrapper = ExternalSessionStateInterface._funcToWrapper.get(callback);
        if (wrapper !== null && !this.removeCallback(objectPathOrVariableName, wrapper, everywhere))
            return false;
        if (everywhere) {
            var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback).keys();
            for (var i = 0; i < keys.length; i++) {
                var target = keys[i];
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
            }
            ExternalSessionStateInterface._d2d_callback_target.dictionary.delete(callback);
            ExternalSessionStateInterface._funcToWrapper.delete(callback);
            return true;
        }

        try {
            if (objectPathOrVariableName === null || objectPathOrVariableName === undefined) {
                externalWarning("removeCallback(): No path or variable name given");
                return false;
            }

            var object = _getObjectFromPathOrVariableName(objectPathOrVariableName);
            object = (object && object instanceof weavecore.ILinkableObject) ? object : null;
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error) {
                externalError(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                console.log('No ILinkableObject from which to remove a callback at path or variable ', objectPathOrVariableName);
                return false;
            }

            ExternalSessionStateInterface._d2d_callback_target.remove(callback, object);
            WeaveAPI.SessionManager.getCallbackCollection(object).removeCallback(callback);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            WeaveAPI.ErrorManager.reportError(e);
        }
        return false;
    }

    /**
     * @inheritDoc
     */
    p.removeAllCallbacks = function () {
        var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.keys();
        keys.forEach(function (callback) {
            var targets = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback).keys();
            targets.forEach(function (target) {
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
            });
        });


        ExternalSessionStateInterface._d2d_callback_target = new weavecore.Dictionary2D(true, true);
    }

    function externalError() {
        var args = Array.prototype.slice.call(arguments);
        var format = args.shift();
        var str = weavecore.StandardLib.substitute(format, args);
        // temporary solution for Flash not escaping double-quotes when generating JavaScript throw statement
        str = weavecore.StandardLib.replace(str, '"', "'");
        throw new Error(str);
    }



    function externalWarning() {
        var args = Array.prototype.slice.call(arguments);
        var format = args.shift();
        externalError(weavecore.StandardLib.substitute("Warning: " + format, args));
    }

    weavecore.ExternalSessionStateInterface = ExternalSessionStateInterface;

}());
