/**
 * @module WeaveAPI
 */

//namesapce
if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}




(function () {
    function Internal() {

    }

    /**
     * This is a two-dimensional dictionary, where _triggerCounterMap[linkableObject][observer]
     * equals the previous triggerCounter value from linkableObject observed by the observer.
     */
    Object.defineProperty(Internal, '_triggerCounterMap', {
        value: new Map()
    });

    /**
     * This function is used to detect if callbacks of a linkable object were triggered since the last time detectLinkableObjectChange
     * was called with the same parameters, likely by the observer.  Note that once this function returns true, subsequent calls will
     * return false until the callbacks are triggered again, unless clearChangedNow is set to false.  It may be a good idea to specify
     * a private object as the observer so no other code can call detectLinkableObjectChange with the same observer and linkableObject
     * parameters.
     * @param observer The object that is observing the change.
     * @param linkableObject The object that is being observed.
     * @param clearChangedNow If this is true, the trigger counter will be reset to the current value now so that this function will
     *        return false if called again with the same parameters before the next time the linkable object triggers its callbacks.
     * @return A value of true if the callbacks for the linkableObject have triggered since the last time this function was called
     *         with the same observer and linkableObject parameters.
     */
    Internal.detectLinkableObjectChange = function (observer, linkableObject, clearChangedNow) {
        clearChangedNow = (clearChangedNow === undefined) ? true : clearChangedNow;
        if (!Internal._triggerCounterMap[linkableObject])
            Internal._triggerCounterMap[linkableObject] = new Map();

        var previousCount = Internal._triggerCounterMap[linkableObject][observer]; // untyped to handle undefined value
        var newCount = WeaveAPI.SessionManager.getCallbackCollection(linkableObject).triggerCounter;
        if (previousCount !== newCount) // !== avoids casting to handle the case (0 !== undefined)
        {
            if (clearChangedNow)
                Internal._triggerCounterMap[linkableObject][observer] = newCount;
            return true;
        }
        return false;
    }

    window.WeaveAPI.Internal = Internal;
}());

WeaveAPI.detectLinkableObjectChange = function () {
    var args = Array.prototype.slice.call(arguments);
    var observer = args.shift();
    var linkableObjects = args;
    var changeDetected = false;
    // it's important not to short-circuit like a boolean OR (||) because we need to clear the 'changed' flag on each object.
    linkableObjects.forEach(function (linkableObject) {
        if (linkableObject && WeaveAPI.Internal.detectLinkableObjectChange(observer, linkableObject, true)) // clear 'changed' flag
            changeDetected = true;
    })
    return changeDetected;
}
