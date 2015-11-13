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


WeaveAPI._pathLookup = new Map();

WeaveAPI._jsonReviver = function (key, value) {
    var WP = 'WeavePath';
    if (value !== null && typeof (value) === 'object' && value.hasOwnProperty(WP) && value[WP] instanceof Array) {
        for (key in value)
            if (key !== WP)
                return value;
        return WeaveAPI.SessionManager.getObject(value[WP]);
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
