if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

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

    /**
     * temporary solution to save the namespace for this class/prototype
     * @public
     * @property NS
     * @readOnly
     * @type String
     */
    Object.defineProperty(CompositeObject, 'NS', {
        value: 'weavecore'
    });

    /**
     * temporary solution to save the className for this class/prototype
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(CompositeObject, 'CLASS_NAME', {
        value: 'CompositeObject'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(CompositeObject, 'SESSIONABLE', {
        value: true
    });


    function CompositeObject() {
        weavecore.ILinkableObject.call(this);

        Object.defineProperties(this, {
            'sessionString': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString())
            },
            'sessionNumber': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber())
            }
        });
    }



    CompositeObject.prototype = new weavecore.ILinkableObject();
    CompositeObject.prototype.constructor = CompositeObject;

    // Prototypes
    var p = CompositeObject.prototype;



    weavecore.CompositeObject = CompositeObject;
    weavecore.ClassUtils.registerClass('weavecore.CompositeObject', CompositeObject);

}());
