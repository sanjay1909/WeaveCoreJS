if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function DebugUtils() {

    }

    /****************************
     **  Object id and lookup  **
     ****************************/

    DebugUtils._idToObjRef = new Map();
    DebugUtils._objToId = new WeakMap(); // weakKeys=true to avoid memory leak
    DebugUtils._nextId = 0;

    /**
     * This function generates or returns a previously generated identifier for an object.
     */
    DebugUtils.debugId = function (object) {
        var type = typeof (object);
        if (object === null || type !== 'object' && type !== 'function')
            return String(object);
        var idString = DebugUtils._objToId.get(object);
        if (!idString) {
            var idNumber = DebugUtils._nextId++;
            var className = object.constructor.name;
            idString = className + '#' + idNumber;

            var ref = new Map();
            ref.set(object, true);
            // save lookup from object to idString
            DebugUtils._objToId.set(object, idString);
            // save lookup from idString and idNumber to weak object reference
            DebugUtils._idToObjRef.set(idNumber, ref);
            DebugUtils._idToObjRef.set(idString, ref);
        }
        return idString;
    }

    weavecore.DebugUtils = DebugUtils;
    WeaveAPI.DebugUtils = new DebugUtils();

}());
