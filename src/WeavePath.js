/* ***** BEGIN LICENSE BLOCK *****
 *
 * This file is part of Weave.
 *
 * The Initial Developer of Weave is the Institute for Visualization
 * and Perception Research at the University of Massachusetts Lowell.
 * Portions created by the Initial Developer are Copyright (C) 2008-2015
 * the Initial Developer. All Rights Reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * The Weave instance.
 * @namespace weave
 * @name weave
 */
//"use strict";

if (typeof window === 'undefined') {
    this.weave = this.weave || {};
} else {
    window.weave = window.weave || {};
}


weave._getObjectFromPathOrVariableName_error = null;
/**
 * Stores information for removeCallback() and removeAllCallbacks()
 */
weave._d2d_callback_target = new weavecore.Dictionary2D(false, true);
weave._funcToWrapper = new Map();

Object.defineProperties(weave, {
    '_compiler': {
        value: new weavecore.Compiler()
    },
    '_variables': {
        value: {} //This object maps an expression name to the saved expression function.
    }

});








/**
 * A set of static functions intended for use as a  API.
 *
 * The user interface in Weave is initially generated from a saved session state.
 * User interactions affect the session state, and changes in the session state affect
 * the display at runtime.  The API provides a window into the session state so most
 * interactions that can be made through the GUI can also be made through JavaScript calls.
 *
 * @author adufilie
 */

/**
 * @inheritDoc
 */
weave.getSessionState = function (objectPath) {
    var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
    if (object) {
        var state = WeaveAPI.SessionManager.getSessionState(object);
        convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
        return state;
    }

    externalWarning("No ILinkableObject from which to get session state at path {0}", weavecore.Compiler.stringify(objectPath));
    return null;
}

/**
 * This function modifies a session state, converting any nested XML objects to Strings.
 * @param state A session state that may contain nested XML objects.
 */
function convertSessionStateToPrimitives(state) {
    for (var key in state) {
        var value = state[key];
        /*if (value is XML)
        	state[key] = (value as XML).toXMLString();
        else*/
        convertSessionStateToPrimitives(value);
    }
}

/**
 * @inheritDoc
 */
weave.setSessionState = function (objectPath, newState, removeMissingObjects) {
    removeMissingObjects = (removeMissingObjects === undefined) ? true : removeMissingObjects;
    var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
    if (object) {
        WeaveAPI.SessionManager.setSessionState(object, newState, removeMissingObjects);
        return true;
    }

    externalError("No ILinkableObject for which to set session state at path {0}", weavecore.Compiler.stringify(objectPath));
    return false;
}

/**
 * @inheritDoc
 */
weave.getObjectType = function (objectPath) {
    var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
    if (object)
        return object.constructor.name;

    // no warning since getObjectType() may be used to check whether or not an object exists.
    return null;
}

/**
 * @inheritDoc
 */
weave.getChildNames = function (objectPath) {
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

/**
 * @inheritDoc
 */
weave.setChildNameOrder = function (hashMapPath, orderedChildNames) {
    var hm = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, hashMapPath);
    var hashMap = (hm && hm instanceof weavecore.LinkableHashMap) ? hm : null;
    if (hashMap) {
        // it's ok if there are no names specified, because that wouldn't accomplish anything anyway
        if (orderedChildNames)
            hashMap.setNameOrder(orderedChildNames);
        return true;
    }

    externalError("No ILinkableHashMap for which to reorder children at path {0}", weavecore.Compiler.stringify(hashMapPath));
    return false;
}

/**
 * @inheritDoc
 */
weave.requestObject = function (objectPath, objectType) {
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

/**
 * @inheritDoc
 */
weave.removeObject = function (objectPath) {
    if (!objectPath || !objectPath.length) {
        externalError("Cannot remove root object");
        return false;
    }

    var parentPath = objectPath.concat();
    var childName = parentPath.pop();
    var parent = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, parentPath);

    var hashMap = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;;
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


/**
 * @inheritDoc
 */
/*public function convertSessionStateObjectToXML(sessionState, tagName = null)
{
	var result:XML = WeaveXMLEncoder.encode(sessionState, tagName || "sessionState");
	return result.toXMLString();
}*/

/**
 * @inheritDoc
 */
/*public function convertSessionStateXMLToObject(sessionStateXML)
{
	var xml:XML = XML(sessionStateXML);
	var state = WeaveXMLDecoder.decode(xml);
	convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
	return state;
}*/



/**
 * Gets an object from a path or a variable name and sets weave._getObjectFromPathOrVariableName_error.
 * If the path was invalid or the variable uninitialized, weave._getObjectFromPathOrVariableName_error will be set with an appropriate error message.
 * @param objectPathOrVariableName Either an Array for a path or a String for a variable name.
 * @return The object at the specified path, the value of the specified variable, or null if the parameter was null.
 */
function getObjectFromPathOrVariableName(objectPathOrVariableName) {
    weave._getObjectFromPathOrVariableName_error = null;

    if (objectPathOrVariableName === null || objectPathOrVariableName === undefined)
        return null;

    if (objectPathOrVariableName.constructor === Array) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPathOrVariableName);
        if (object)
            return object;

        weave._getObjectFromPathOrVariableName_error = "No ILinkableObject at path " + weavecore.Compiler.stringify(objectPathOrVariableName);
        return null;
    }

    var variableName = String(objectPathOrVariableName);
    if (variableName) {
        if (weave._variables.hasOwnProperty(variableName))
            return weave._variables[variableName];

        weave._getObjectFromPathOrVariableName_error = "Undefined variable " + weavecore.Compiler.stringify(variableName);
        return null;
    }

    return null;
}



/**
 * @inheritDoc
 */
weave.evaluateExpression = function (scopeObjectPathOrVariableName, expression, variables, staticLibraries, assignVariableName) {
    variables = (variables === undefined) ? null : variables;
    staticLibraries = (staticLibraries === undefined) ? null : staticLibraries;
    assignVariableName = (assignVariableName === undefined) ? null : assignVariableName;

    try {
        if (staticLibraries)
            weave._compiler.includeLibraries.apply(null, staticLibraries);

        var isAssignment = (assignVariableName !== null); // allows '' to be used to ignore resulting value
        if (assignVariableName && !weave._compiler.isValidSymbolName(assignVariableName))
            throw new Error("Invalid variable name: " + weavecore.Compiler.encodeString(assignVariableName));

        // To avoid "variable is undefined" errors, treat variables[''] as an Array of keys and set any missing properties to undefined
        if (variables && variables[''])
            variables[''].forEach(function (key) {
                if (!variables.hasOwnProperty(key))
                    variables[key] = undefined;
            });

        var thisObject = getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
        if (weave._getObjectFromPathOrVariableName_error)
            throw new Error(weave._getObjectFromPathOrVariableName_error);
        var compiledObject = weave._compiler.compileToObject(expression);
        var isFuncDef = weave._compiler.compiledObjectIsFunctionDefinition(compiledObject);
        // passed-in variables take precedence over stored ActionScript weave._variables
        var compiledMethod = weave._compiler.compileObjectToFunction(
            compiledObject, [variables, weave._variables],
            WeaveAPI.ErrorManager.reportError.bind(WeaveAPI.ErrorManager),
            thisObject !== null,
            null,
            null,
            true,
            thisObject
        );
        var result = isFuncDef ? compiledMethod : compiledMethod.apply(thisObject);
        if (isAssignment)
            weave._variables[assignVariableName] = result;
        else
            return result;
    } catch (e) {
        externalError(e.message);
    }
    return undefined;
}



/**
 * @inheritDoc
 */
weave.addCallback = function (scopeObjectPathOrVariableName, callback, triggerCallbackNow, immediateMode, delayWhileBusy) {
    triggerCallbackNow = (triggerCallbackNow === undefined) ? false : triggerCallbackNow;
    immediateMode = (immediateMode === undefined) ? false : immediateMode;
    delayWhileBusy = (delayWhileBusy === undefined) ? true : delayWhileBusy;
    try {
        if (scopeObjectPathOrVariableName === null || scopeObjectPathOrVariableName === undefined) {
            externalError("addCallback(): No path or variable name given");
            return false;
        }

        var ob = getObjectFromPathOrVariableName(scopeObjectPathOrVariableName)
        var object = (ob && ob instanceof weavecore.ILinkableObject) ? ob : null;
        if (weave._getObjectFromPathOrVariableName_error) {
            externalError(weave._getObjectFromPathOrVariableName_error);
            return false;
        }
        if (object === null || object === undefined) {
            externalError("No ILinkableObject to which to add a callback at path or variable {0}", weavecore.Compiler.stringify(scopeObjectPathOrVariableName));
            return false;
        }

        if (delayWhileBusy) {
            var fn = (weave._funcToWrapper[callback] && weave._funcToWrapper[callback] instanceof Function) ? weave._funcToWrapper[callback] : null
            callback = fn || (weave._funcToWrapper[callback] = generateBusyWaitWrapper(callback));
        }


        weave._d2d_callback_target.set(callback, object, true);
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
        var keys = weave._d2d_callback_target.dictionary.get(wrapper).keys();
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
weave.removeCallback = function (objectPathOrVariableName, callback, everywhere) {
    everywhere = (everywhere === undefined) ? false : everywhere;
    var wrapper = weave._funcToWrapper[callback];
    if (wrapper !== null && !removeCallback(objectPathOrVariableName, wrapper, everywhere))
        return false;

    if (everywhere) {
        var keys = weave._d2d_callback_target.dictionary.get(callback).keys();
        for (var i = 0; i < keys.length; i++) {
            var target = keys[i];
            WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
        }

        weave._d2d_callback_target.dictionary.delete(callback);
        weave._funcToWrapper.delete(callback);
        return true;
    }

    try {
        if (objectPathOrVariableName === null) {
            externalWarning("removeCallback(): No path or variable name given");
            return false;
        }

        var ob = getObjectFromPathOrVariableName(objectPathOrVariableName)
        var object = (ob && ob instanceof weavecore.ILinkableObject) ? ob : null;
        if (weave._getObjectFromPathOrVariableName_error) {
            externalError(weave._getObjectFromPathOrVariableName_error);
            return false;
        }
        if (object === null) {
            externalWarning("No ILinkableObject from which to remove a callback at path or variable {0}", weavecore.Compiler.stringify(objectPathOrVariableName));
            return false;
        }

        weave._d2d_callback_target.remove(callback, object);
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
weave.removeAllCallbacks = function () {
    var keys = weave._d2d_callback_target.dictionary.keys();
    keys.forEach(function (callback) {
        var targets = weave._d2d_callback_target.dictionary.get(callback).keys();
        targets.forEach(function (target) {
            WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
        });
    });


    weave._d2d_callback_target = new weavecore.Dictionary2D(true, true);
}


function externalError() {
    var args = Array.prototype.slice.call(arguments);
    var format = args.shift();
    var str = weavecore.StandardLib.substitute(format, args);
    // temporary solution for Flash not escaping double-quotes when generating JavaScript throw statement
    str = weavecore.StandardLib.replace(str, '"', "'");
    throw new Error(str);
}



function externalWarning(format, ...args) {
    var args = Array.prototype.slice.call(arguments);
    var format = args.shift();
    externalError(StandardLib.substitute("Warning: " + format, args));
}







var asFunction_lookup = {};
/**
 * Provides backwards compatibility for callbacks given as strings.
 * Also sets callback['this'] = thisArg, if provided, which is used by Weave when calling the function.
 */
function asFunction(callback, thisArg) {
    if (typeof callback === 'string')
        callback = asFunction_lookup[callback] || (asFunction_lookup[callback] = function () {
            return window.eval('(' + callback + ')()');
        });
    if (thisArg !== undefined)
        callback['this'] = thisArg;
    return callback;
}

var _addCallback = weave.addCallback;

weave.addCallback = function (target, callback, triggerNow, immediateMode, delayWhileBusy) {
    callback = asFunction(callback, Array.isArray(target) ? weave.path(target) : weave.path());
    /*if (!immediateMode)
        callback = WeaveAPI.StageUtils.callLater(this, callback);*/
    return _addCallback.apply(this, Array.prototype.slice.call(arguments));
};

var _removeCallback = weave.removeCallback;

weave.removeCallback = function (target, callback, everywhere) {
    return _removeCallback.call(this, target, asFunction(callback), everywhere);
};

var _loadFile = weave.loadFile;

weave.loadFile = function (url, callback, noCacheHack) {
    return _loadFile.call(this, url, asFunction(callback), noCacheHack);
};

/**
 * Creates a WeavePath object.  WeavePath objects are immutable after they are created.
 * This is a shortcut for "new weave.WeavePath(basePath)".
 * @param basePath An optional Array (or multiple parameters) specifying the path to an object in the session state.
 *                 A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A WeavePath object.
 * @see  weave.WeavePath
 */
weave.path = function ( /*...basePath*/ ) {
    var basePath = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
    return new weave.WeavePath(basePath);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * WeavePath constructor.  WeavePath objects are immutable after they are created.
 * @class WeavePath
 * @param basePath An optional Array (or multiple parameters) specifying the path to an object in the session state.
 *                 A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A WeavePath object.
 */
weave.WeavePath = function ( /*...basePath*/ ) {
    // "private" instance variables
    this._path = this._A(arguments, 1);
    this._parent = null; // parent WeavePath returned by pop()
};



// "private" shared properties

/**
 * Stores JavaScript variables common to all WeavePath objects.
 * Used by vars(), exec(), and getValue()
 * @private
 */
weave.WeavePath.prototype._vars = {};

/**
 * Remembers which JavaScript variables should be unset after the next call to exec() or getValue().
 * @private
 */
weave.WeavePath.prototype._tempVars = {};

/**
 * Cleans up temporary variables.
 * @private
 */
weave.WeavePath.prototype._deleteTempVars = function () {
    var vars = weave.WeavePath.prototype._vars;
    var tempVars = weave.WeavePath.prototype._tempVars;
    for (var key in tempVars)
        if (tempVars[key])
            delete vars[key];
    weave.WeavePath.prototype._tempVars = {};
};

/**
 * Private function for internal use.
 *
 * Converts an arguments object to an Array.
 * @param args An arguments object.
 * @param option An integer flag for special behavior.
 *   - If set to 1, it handles arguments like (...LIST) where LIST can be either an Array or multiple arguments.
 *   - If set to 2, it handles arguments like (...LIST, REQUIRED_PARAM) where LIST can be either an Array or multiple arguments.
 * @private
 */
weave.WeavePath.prototype._A = function (args, option) {
    if (args.length === option && Array.isArray(args[0]))
        return [].concat(args[0], Array.prototype.slice.call(args, 1));
    return Array.prototype.slice.call(args);
};



// public shared properties

/**
 * A pointer to the Weave instance.
 */
weave.WeavePath.prototype.weave = weave;



// public chainable methods

/**
 * Creates a new WeavePath relative to the current one.
 * @param relativePath An Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A new WeavePath object which remembers the current WeavePath as its parent.
 */
weave.WeavePath.prototype.push = function ( /*...relativePath*/ ) {
    var args = this._A(arguments, 1);
    var newWeavePath = new this.weave.WeavePath(this._path.concat(args));
    newWeavePath._parent = this;
    return newWeavePath;
};

/**
 * Returns to the previous WeavePath that spawned the current one with push().
 * @return The parent WeavePath object.
 */
weave.WeavePath.prototype.pop = function () {
    if (this._parent)
        return this._parent;
    else
        this._failMessage('pop', 'stack is empty');
    return null;
};

/**
 * Requests that an object be created if it doesn't already exist at the current path (or relative path, if specified).
 * This function can also be used to assert that the object at the current path is of the type you expect it to be.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param objectType The name of an ActionScript class in Weave.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.request = function ( /*...relativePath, objectType*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('request', args)) {
        var type = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.requestObject(pathcopy, type) || this._failPath('request', pathcopy);
    }
    return this;
};

/**
 * Removes a dynamically created object.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.remove = function ( /*...relativePath*/ ) {
    var pathcopy = this._path.concat(this._A(arguments, 1));
    weave.removeObject(pathcopy) || this._failPath('remove', pathcopy);
    return this;
};

/**
 * Reorders the children of an ILinkableHashMap at the current path.
 * @param orderedNames An Array (or multiple parameters) specifying ordered child names.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.reorder = function ( /*...orderedNames*/ ) {
    var args = this._A(arguments, 1);
    if (this._assertParams('reorder', args)) {
        this.weave.setChildNameOrder(this._path, args) || this._failMessage('reorder', 'path does not refer to an ILinkableHashMap: ' + this._path);
    }
    return this;
};

/**
 * Sets the session state of the object at the current path or relative to the current path.
 * Any existing dynamically created objects that do not appear in the new state will be removed.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param state The session state to apply.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.state = function ( /*...relativePath, state*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('state', args)) {
        var state = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.setSessionState(pathcopy, state, true) || this._failObject('state', pathcopy);
    }
    return this;
};

/**
 * Applies a session state diff to the object at the current path or relative to the current path.
 * Existing dynamically created objects that do not appear in the new state will remain unchanged.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param diff The session state diff to apply.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.diff = function ( /*...relativePath, diff*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('diff', args)) {
        var diff = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.setSessionState(pathcopy, diff, false) || this._failObject('diff', pathcopy);
    }
    return this;
};

/**
 * Adds a callback to the object at the current path.
 * When the callback is called, a WeavePath object initialized at the current path will be used as the 'this' context.
 * If the same callback is added to multiple paths, only the last path will be used as the 'this' context.
 * @param callback The callback function.
 * @param triggerCallbackNow Optional parameter, when set to true will trigger the callback now.
 * @param immediateMode Optional parameter, when set to true will use an immediate callback instead of a grouped callback.
 * @param delayWhileBusy Optional parameter, specifies whether to delay the callback while the object is busy. Default is true.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.addCallback = function (callback, triggerCallbackNow, immediateMode, delayWhileBusy) {
    if (this._assertParams('addCallback', arguments)) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this._path);
        this.weave.addCallback.apply(this.weave, args) || this._failObject('addCallback', this._path);
    }
    return this;
};

/**
 * Removes a callback from the object at the current path or from everywhere.
 * @param callback The callback function.
 * @param everywhere Optional parameter, if set to true will remove the callback from every object to which it was added.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.removeCallback = function (callback, everywhere) {
    if (this._assertParams('removeCallback', arguments)) {
        this.weave.removeCallback(this._path, callback, everywhere) || this._failObject('removeCallback', this._path);
    }
    return this;
};

/**
 * Specifies additional variables to be used in subsequent calls to exec() and getValue().
 * The variables will be made globally available for any WeavePath object created from the same Weave instance.
 * @param newVars An object mapping variable names to values.
 * @param temporary Optional parameter. If set to true, these variables will be unset after the next call to exec() or getValue()
 *                  no matter how either function is called, including from inside custom WeavePath functions.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.vars = function (newVars, temporary) {
    for (var key in newVars) {
        this._tempVars[key] = !!temporary;
        this._vars[key] = newVars[key];
    }
    return this;
};

/**
 * Specifies additional libraries to be included in subsequent calls to exec() and getValue().
 * @param libraries An Array (or multiple parameters) specifying ActionScript class names to include as libraries.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.libs = function ( /*...libraries*/ ) {
    var args = this._A(arguments, 1);
    if (this._assertParams('libs', args)) {
        // include libraries for future evaluations
        this.weave.evaluateExpression(null, null, null, args);
    }
    return this;
};

/**
 * Evaluates an ActionScript expression using the current path, vars, and libs.
 * The 'this' context within the script will be the object at the current path.
 * @param script The script to be evaluated by Weave under the scope of the object at the current path.
 * @param callback_or_variableName Optional callback function or variable name.
 * - If given a callback function, the function will be passed the result of
 *   evaluating the expression, setting the 'this' value to the current WeavePath object.
 * - If given a variable name, the result will be stored as a variable
 *   as if it was passed as an object property to WeavePath.vars().  It may then be used
 *   in future calls to WeavePath.exec() or retrieved with WeavePath.getValue().
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.exec = function (script, callback_or_variableName) {
    var type = typeof callback_or_variableName;
    var callback = type === 'function' ? callback_or_variableName : null;
    // Passing "" as the variable name avoids the overhead of converting the ActionScript object to a JavaScript object.
    var variableName = type === 'string' ? callback_or_variableName : "";
    this._vars[''] = Object.keys(this._vars); // include a list of keys in property '' so undefined variables will be preserved
    var result = this.weave.evaluateExpression(this._path, script, this._vars, null, variableName);
    this._deleteTempVars();
    // if an AS var was saved, delete the corresponding JS var if present to avoid overriding it in future expressions
    if (variableName)
        delete this._vars[variableName];
    if (callback)
        callback.apply(this, [result]);

    return this;
};

/**
 * Calls a function using the current WeavePath object as the 'this' value.
 * @param func The function to call.
 * @param args An optional list of arguments to pass to the function.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.call = function (func /*[, ...args]*/ ) {
    if (this._assertParams('call', arguments)) {
        var a = this._A(arguments);
        a.shift().apply(this, a);
    }
    return this;
};

/**
 * Applies a function to each item in an Array or an Object.
 * @param items Either an Array or an Object to iterate over.
 * @param visitorFunction A function to be called for each item in items. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  item, key, items.
 *                        If items is an Array, the key will be an integer. If items is an Object, the key will be a String.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEach = function (items, visitorFunction) {
    if (this._assertParams('forEach', arguments, 2)) {
        if (Array.isArray(items) && Array.prototype.forEach)
            items.forEach(visitorFunction, this);
        else
            for (var key in items) visitorFunction.call(this, items[key], key, items);
    }
    return this;
};

/**
 * Calls a function for each child of the current WeavePath or the one specified by a relativePath. The function receives child names.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param visitorFunction A function to be called for each child object. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  name, index, names.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEachName = function ( /*...relativePath, visitorFunction*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('forEachName', args)) {
        var visitorFunction = args.pop();
        this.getNames(args).forEach(visitorFunction, this);
    }
    return this;
};

/**
 * Calls a function for each child of the current WeavePath or the one specified by a relativePath. The function receives child WeavePath objects.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param visitorFunction A function to be called for each child object. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  child, index, children.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEachChild = function ( /*...relativePath, visitorFunction*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('forEachChild', args)) {
        var visitorFunction = args.pop();
        this.getChildren(args).forEach(visitorFunction, this);
    }
    return this;
};

/**
 * Calls weaveTrace() in Weave to print to the log window.
 * @param args A list of parameters to pass to weaveTrace().
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.trace = function ( /* ...args */ ) {
    var args = this._A(arguments);
    this.weave.evaluateExpression(null, "weaveTrace.apply(null, args)", {
        "args": args
    }, null, "");
    return this;
};


// non-chainable methods

/**
 * Returns a copy of the current path Array or the path Array of a descendant object.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names to be appended to the result.
 * @return An Array of successive child names used to identify an object in a Weave session state.
 */
weave.WeavePath.prototype.getPath = function ( /*...relativePath*/ ) {
    return this._path.concat(this._A(arguments, 1));
};

/**
 * Gets an Array of child names under the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return An Array of child names.
 */
weave.WeavePath.prototype.getNames = function ( /*...relativePath*/ ) {
    return this.weave.getChildNames(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets an Array of child WeavePath objects under the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return An Array of child WeavePath objects.
 */
weave.WeavePath.prototype.getChildren = function ( /*...relativePath*/ ) {
    var relativePath = this._A(arguments, 1);
    return this.weave.getChildNames(this._path.concat(relativePath))
        .map(function (name) {
            return new this.weave.WeavePath(this._path.concat(relativePath, name));
        }, this);
};

/**
 * Gets the type (qualified class name) of the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The qualified class name of the object at the current or descendant path, or null if there is no object.
 */
weave.WeavePath.prototype.getType = function ( /*...relativePath*/ ) {
    return this.weave.getObjectType(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets the session state of an object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The session state of the object at the current or descendant path.
 */
weave.WeavePath.prototype.getState = function ( /*...relativePath*/ ) {
    return this.weave.getSessionState(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets the changes that have occurred since previousState for the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param previousState The previous state for comparison.
 * @return A session state diff.
 */
weave.WeavePath.prototype.getDiff = function ( /*...relativePath, previousState*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('getDiff', args)) {
        var previousState = args.pop();
        var pathcopy = this._path.concat(args);
        var script = "return WeaveAPI.SessionManager.computeDiff(previousState, WeaveAPI.SessionManager.getSessionState(this));";
        return this.weave.evaluateExpression(pathcopy, script, {
            "previousState": previousState
        });
    }
    return null;
};

/**
 * Gets the changes that would have to occur to get to another state for the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param otherState The other state for comparison.
 * @return A session state diff.
 */
weave.WeavePath.prototype.getReverseDiff = function ( /*...relativePath, otherState*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('getReverseDiff', args)) {
        var otherState = args.pop();
        var pathcopy = this._path.concat(args);
        var script = "return WeaveAPI.SessionManager.computeDiff(WeaveAPI.SessionManager.getSessionState(this), otherState);";
        return this.weave.evaluateExpression(pathcopy, script, {
            "otherState": otherState
        });
    }
    return null;
};

/**
 * Returns the value of an ActionScript expression or variable using the current path, vars, and libs.
 * The 'this' context within the script will be set to the object at the current path.
 * @param script_or_variableName The script to be evaluated by Weave, or simply a variable name.
 * @return The result of evaluating the script or variable.
 */
weave.WeavePath.prototype.getValue = function (script_or_variableName) {
    this._vars[''] = Object.keys(this._vars); // include a list of keys in property '' so undefined variables will be preserved
    var result = this.weave.evaluateExpression(this._path, script_or_variableName, this._vars);
    this._deleteTempVars();
    return result;
};

/**
 * Provides a human-readable string containing the path.
 */
weave.WeavePath.prototype.toString = function () {
    var pathStr = typeof JSON !== 'undefined' && JSON.stringify ? JSON.stringify(this._path) : this._path.toString();
    return "WeavePath(" + pathStr + ")";
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// helper functions
weave.WeavePath.prototype._assertParams = function (methodName, args, minLength) {
    if (!minLength)
        minLength = 1;
    if (args.length < minLength) {
        var msg = 'requires at least ' + ((minLength === 1) ? 'one parameter' : (minLength + ' parameters'));
        this._failMessage(methodName, msg);
        return false;
    }
    return true;
};

weave.WeavePath.prototype._failPath = function (methodName, path) {
    this._failMessage(methodName, 'command failed', path);
};

weave.WeavePath.prototype._failObject = function (methodName, path) {
    this._failMessage(methodName, 'object does not exist', path);
};

weave.WeavePath.prototype._failMessage = function (methodName, message, path) {
    var str = 'WeavePath.' + methodName + '(): ' + message;
    if (path) {
        var pathStr = typeof JSON !== 'undefined' && JSON.stringify ? JSON.stringify(path) : path;
        str += ' (path: ' + pathStr + ')';
    }
    throw new Error(str);
};