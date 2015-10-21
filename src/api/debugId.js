/**
 * @module WeaveAPI
 */

//namesapce
if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}


WeaveAPI.debugID = function (object) {
    return WeaveAPI.DebugUtils.debugId(object);
}
