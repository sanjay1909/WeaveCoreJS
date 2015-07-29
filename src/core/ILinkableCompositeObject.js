if (!this.weavecore)
    this.weavecore = {};

/**
 * This is an interface to a composite object with dynamic state, meaning child objects can be dynamically added or removed.
 * The session state for this type of object is defined as an Array of DynamicState objects.
 * DynamicState objects are defined as having exactly three properties: objectName, className, and sessionState.
 * @see DynamicState
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    function ILinkableCompositeObject() {

    }



    ILinkableCompositeObject.prototype = new weavecore.ILinkableObject();
    ILinkableCompositeObject.prototype.constructor = ILinkableCompositeObject;

    // Prototypes
    var p = ILinkableCompositeObject.prototype;

    /**
     * This gets the session state of this composite object.
     * @return An Array of DynamicState objects which compose the session state for this object.
     * @see weave.api.core.DynamicState
     */
    p.getSessionState = function () {};

    /**
     * This sets the session state of this composite object.
     * @param newState An Array of child name Strings or DynamicState objects containing the new values and types for child ILinkableObjects.
     * @param removeMissingDynamicObjects If true, this will remove any child objects that do not appear in the session state.
     *     As a special case, a null session state will result in no change regardless of the removeMissingDynamicObjects value.
     * @see weave.api.core.DynamicState
     */
    p.setSessionState = function (newState, removeMissingDynamicObjects) {};

    weavecore.ILinkableCompositeObject = ILinkableCompositeObject;

}());