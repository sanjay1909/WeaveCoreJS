createjs.Ticker.setFPS(50);
//createjs.Ticker.

// constructor:

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}


Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_IMMEDIATE', {
    value: 0
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_HIGH', {
    value: 1
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_NORMAL', {
    value: 2
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_LOW', {
    value: 3
});


/**
 * Shortcut for WeaveAPI.SessionManager.newDisposableChild() and WeaveAPI.SessionManager.registerDisposableChild()
 * @see weavecore.ISessionManager#newDisposableChild()
 * @see weavecore.ISessionManager#registerDisposableChild()
 * @export
 * @param {Object} disposableParent
 * @param {Object} disposableChildOrType
 * @return {*}
 */
WeaveAPI.disposableChild = function (disposableParent, disposableChildOrType) {
    if (weavecore.ClassUtils.isClass(disposableChildOrType))
        return WeaveAPI.SessionManager.newDisposableChild(disposableParent, disposableChildOrType);
    return WeaveAPI.SessionManager.registerDisposableChild(disposableParent, disposableChildOrType);
};

/**
 * Shortcut for WeaveAPI.SessionManager.newLinkableChild() and WeaveAPI.SessionManager.registerLinkableChild()
 * @see weavecore.ISessionManager#newLinkableChild()
 * @see weavecore.ISessionManager#registerLinkableChild()
 * @export
 * @param {Object} linkableParent
 * @param {Object} linkableChildOrType
 * @param {Function=} callback
 * @param {boolean=} useGroupedCallback
 * @return {*}
 */
WeaveAPI.linkableChild = function (linkableParent, linkableChildOrType, callback, useGroupedCallback) {
    callback = typeof callback !== 'undefined' ? callback : null;
    useGroupedCallback = typeof useGroupedCallback !== 'undefined' ? useGroupedCallback : false;
    if (weavecore.ClassUtils.isClass(linkableChildOrType))
        return WeaveAPI.SessionManager.newLinkableChild(linkableParent, linkableChildOrType, callback, useGroupedCallback);
    return WeaveAPI.SessionManager.registerLinkableChild(linkableParent, linkableChildOrType, callback, useGroupedCallback);
};

/**
 * Shortcut for WeaveAPI.SessionManager.getSessionState()
 * @copy weavecore.ISessionManager#getSessionState()
 * @export
 * @param {weavecore.ILinkableObject} linkableObject
 * @return {Object}
 */
WeaveAPI.getState = function (linkableObject) {
    return WeaveAPI.SessionManager.getSessionState(linkableObject);
};


/**
 * Shortcut for WeaveAPI.SessionManager.setSessionState()
 * @copy weavecore.ISessionManager#setSessionState()
 * @export
 * @param {weavecore.ILinkableObject} linkableObject
 * @param {Object} newState
 * @param {boolean=} removeMissingDynamicObjects
 */
WeaveAPI.setState = function (linkableObject, newState, removeMissingDynamicObjects) {
    removeMissingDynamicObjects = typeof removeMissingDynamicObjects !== 'undefined' ? removeMissingDynamicObjects : true;
    WeaveAPI.SessionManager.setSessionState(linkableObject, newState, removeMissingDynamicObjects);
};


/**
 * Shortcut for WeaveAPI.SessionManager.copySessionState()
 * @copy weavecore.ISessionManager#copySessionState()
 * @export
 * @param {weavecore.ILinkableObject} source
 * @param {weavecore.ILinkableObject} destination
 */
WeaveAPI.copyState = function (source, destination) {
    WeaveAPI.SessionManager.copySessionState(source, destination);
};

/**
 * Shortcut for WeaveAPI.SessionManager.linkSessionState()
 * @copy weave.api.core.ISessionManager#linkSessionState()
 * @export
 * @param {weavejs.api.core.ILinkableObject} primary
 * @param {weavejs.api.core.ILinkableObject} secondary
 */
WeaveAPI.linkState = function (primary, secondary) {
    WeaveAPI.SessionManager.linkSessionState(primary, secondary);
};


/**
 * Shortcut for WeaveAPI.SessionManager.unlinkSessionState()
 * @copy weavecore.ISessionManager#unlinkSessionState()
 * @export
 * @param {weavecore.ILinkableObject} first
 * @param {weavecore.ILinkableObject} second
 */
WeaveAPI.unlinkState = function (first, second) {
    WeaveAPI.SessionManager.unlinkSessionState(first, second);
};

/**
 * Checks if an object or class implements ILinkableObject
 * @export
 * @param {Object} objectOrClass
 * @return {boolean}
 */
WeaveAPI.isLinkable = function (objectOrClass) {
    if (weavecore.ClassUtils.is(objectOrClass, weavecore.ILinkableObject))
        return true;
    return objectOrClass && WeaveAPI.isLinkable(objectOrClass.prototype);
};

/**
 * Shortcut for WeaveAPI.SessionManager.disposeObject()
 * @copy weavecore.ISessionManager#disposeObject()
 * @export
 * @param {Object} object
 */
WeaveAPI.dispose = function (object) {
    WeaveAPI.SessionManager.disposeObject(object);
};


/**
 * Shortcut for WeaveAPI.SessionManager.objectWasDisposed()
 * @copy weavecore.ISessionManager#objectWasDisposed()
 * @export
 * @param {Object} object
 * @return {boolean}
 */
WeaveAPI.wasDisposed = function (object) {
    return WeaveAPI.SessionManager.objectWasDisposed(object);
};

/**
 * Shortcut for WeaveAPI.SessionManager.getCallbackCollection()
 * @copy weavecore.ISessionManager#getCallbackCollection()
 * @export
 * @param {weavecore.ILinkableObject} linkableObject
 * @return {weavecore.ICallbackCollection}
 */
WeaveAPI.getCallbacks = function (linkableObject) {
    return WeaveAPI.SessionManager.getCallbackCollection(linkableObject);
};

/**
 * Shortcut for WeaveAPI.SessionManager.getLinkableOwner()
 * @copy weave.api.core.ISessionManager#getLinkableOwner()
 * @export
 * @param {weavejs.api.core.ILinkableObject} child
 * @return {weavejs.api.core.ILinkableObject}
 */
WeaveAPI.getOwner = function (child) {
    return WeaveAPI.SessionManager.getLinkableOwner(child);
};

/**
 * Shortcut for WeaveAPI.SessionManager.getPath()
 * @copy weave.api.core.ISessionManager#getPath()
 * @export
 * @param {weavejs.api.core.ILinkableObject} root
 * @param {weavejs.api.core.ILinkableObject} descendant
 * @return {Array}
 */
WeaveAPI.findPath = function (root, descendant) {
    return WeaveAPI.SessionManager.getPath(root, descendant);
};

/**
 * @export
 * @const
 * @type {Array}
 */
WeaveAPI.defaultPackages = ['weavecore'];

/**
 * Gets the qualified class name from a class definition or an object instance.
 * @export
 * @param {Object} def
 * @return {string}
 */
WeaveAPI.className = function (def) {
    if (!def)
        return null;
    if (!def.prototype)
        def = def.constructor;
    if (def.prototype && def.prototype.CLASS_INFO)
        return def.prototype.CLASS_INFO.names[0].qName;
    return def.name;
};

/**
 * @export
 * @param {string} name
 * @return {*}
 */
WeaveAPI.getDefinition = function (name) {
    var arr = name.split('.');
    if (arr.length === 2) {
        var package = arr[0];
        var className = arr[1];
        return window[package][className];
    }

    for (var i = 0; i < WeaveAPI.defaultPackages.length; i++) {
        var pkg = WeaveAPI.defaultPackages[i];
        if (window[pkg][name]) {
            return window[pkg][name];
        }
    }
    return null;
};


WeaveAPI._pathLookup = new Map();

WeaveAPI._jsonReviver = function (key, value) {
    var WP = 'WeavePath';
    if (value !== null && typeof (value) === 'object' && value.hasOwnProperty(WP) && value[WP] instanceof Array) {
        for (key in value)
            if (key !== WP)
                return value;
        return WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, value[WP]);
    }
    return value;
}

WeaveAPI._jsonReplacer = function (key, value) {
    if (value instanceof weavecore.ILinkableObject) {
        var obj = WeaveAPI._pathLookup.get(value);
        if (obj === undefined || obj === null) {
            var path = WeaveAPI.SessionManager.getPath(WeaveAPI.globalHashMap, value);
            // return null for ILinkableObjects not in session state tree
            obj = path ? {
                "WeavePath": path
            } : null;
            WeaveAPI._pathLookup.set(value, obj);
        }
        return obj;
    }
    return value;
}






WeaveAPI._needsReviving = function (key, value) {
    return value instanceof weavecore.ILinkableObject && WeaveAPI._jsonReplacer(key, value) !== null;
}

// moved to weavePath as IIFE function
/*WeaveAPI.addJsonExtension = function () {
    weavecore.JavaScript.extendJson(WeaveAPI._jsonReplacer, WeaveAPI._jsonReviver, WeaveAPI._needsReviving);
    weavecore.JavaScript.exec({
            "this": "weave",
            "WP": "WeavePath",
            "JSON_EXTENSIONS": weavecore.JavaScript.JSON_EXTENSIONS
        },
        'function replacer(key, value) {',
        '    if (value instanceof weave[WP]) {',
        '        var obj = {};',
        '        obj[WP] = value.getPath();',
        '        return obj;',
        '    }',
        '    return value;',
        '}',
        'function reviver(key, value) {',
        '    if (value != null && typeof value === "object" && value.hasOwnProperty(WP) && Array.isArray(value[WP])) {',
        '        for (key in value)',
        '            if (key != WP)',
        '                return value;',
        '        return weave.path(value[WP]);',
        '    }',
        '    return value;',
        '}',
        'weave[JSON_EXTENSIONS].push({"description": "ILinkableObject/WeavePath", "replacer": replacer, "reviver": reviver});'
    );
};*/
