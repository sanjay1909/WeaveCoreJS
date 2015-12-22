/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";



    // constructor:
    /**
     * Private Class for use with {{#crossLink "LinkableHashMap"}}{{/crossLink}}
     * @class ChildListCallbackInterface
     * @extends CallbackCollection
     * @private
     * @constructor
     */
    function ChildListCallbackInterface() {
        this._setCallbackVariables = goog.bind(_setCallbackVariables, this);

        ChildListCallbackInterface.base(this, 'constructor', this._setCallbackVariables)




    }


    goog.inherits(ChildListCallbackInterface, weavecore.CallbackCollection);

    var p = ChildListCallbackInterface.prototype;

    /**
     * returned by public getter
     * @private
     * @property _lastNameAdded
     * @default null
     * @type String
     **/
    p._lastNameAdded = null;
    /**
     * returned by public getter
     * @private
     * @property _lastObjectAdded
     * @default null
     * @type ILinkableObject
     **/
    p._lastObjectAdded = null;
    /**
     * returned by public getter
     * @private
     * @property _lastNameRemoved
     * @default null
     * @type String
     **/
    p._lastNameRemoved = null;
    /**
     * returned by public getter
     * @private
     * @property _lastObjectRemoved
     * @default null
     * @type ILinkableObject
     **/
    p._lastObjectRemoved = null;

    /**
     * This is the name of the object that was added prior to running callbacks.
     * @public
     * @property lastNameAdded
     * @readOnly
     * @type String
     */
    Object.defineProperty(p, 'lastNameAdded', {
        get: function () {
            return this._lastNameAdded;
        }
    });

    /**
     * This is the object that was added prior to running callbacks.
     * @public
     * @property lastObjectAdded
     * @readOnly
     * @type ILinkableObject
     */
    Object.defineProperty(p, 'lastObjectAdded', {
        get: function () {
            return this._lastObjectAdded;
        }
    });

    /**
     * This is the name of the object that was removed prior to running callbacks.
     * @public
     * @property lastNameRemoved
     * @readOnly
     * @type String
     */
    Object.defineProperty(p, 'lastNameRemoved', {
        get: function () {
            return this._lastNameRemoved;
        }
    });

    /**
     * This is the object that was removed prior to running callbacks.
     * @public
     * @property lastObjectRemoved
     * @readOnly
     * @type ILinkableObject
     */
    Object.defineProperty(p, 'lastObjectRemoved', {
        get: function () {
            return this._lastObjectRemoved;
        }
    });
    /**
     * This function will set the list callback variables:
     *     lastNameAdded, lastObjectAdded, lastNameRemoved, lastObjectRemoved, childListChanged
     * @method _setCallbackVariables
     * @private
     * @param {String} name This is the name of the object that was just added or removed from the hash map.
     * @param {ILinkableObject} objectAdded This is the object that was just added to the hash map.
     * @param {ILinkableObject} objectRemoved This is the object that was just removed from the hash map.
     */
    function _setCallbackVariables(name, objectAdded, objectRemoved) {
        this._lastNameAdded = objectAdded ? name : null;
        this._lastObjectAdded = objectAdded;
        this._lastNameRemoved = objectRemoved ? name : null;
        this._lastObjectRemoved = objectRemoved;
    };

    /**
     * This function will run callbacks immediately, setting the list callback variables before each one.
     * @method runCallbacks
     * @param {String} name
     * @param {ILinkableObject} objectAdded
     * @param {ILinkableObject} objectRemoved
     */
    p.runCallbacks = function (name, objectAdded, objectRemoved) {
        // remember previous values
        var _name = this._lastNameAdded || this._lastNameRemoved;
        var _added = this._lastObjectAdded;
        var _removed = this._lastObjectRemoved;

        this._runCallbacksImmediately(name, objectAdded, objectRemoved);

        // restore previous values (in case an external JavaScript popup caused us to interrupt something else)
        this._setCallbackVariables(_name, _added, _removed);
    };



    weavecore.ChildListCallbackInterface = ChildListCallbackInterface;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'ChildListCallbackInterface',
            qName: 'weavecore.ChildListCallbackInterface'
        }],
        interfaces: [weavecore.IChildListCallbackInterface]
    };


}());
