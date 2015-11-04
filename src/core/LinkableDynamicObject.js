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

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableDynamicObject, 'NS', {
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
    Object.defineProperty(LinkableDynamicObject, 'CLASS_NAME', {
        value: 'LinkableDynamicObject'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableDynamicObject, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This object links to an internal ILinkableObject.
     * The internal object can be either a local one or a global one identified by a global name.
     * @class LinkableDynamicObject
     * @extends LinkableWatcher
     * @constructor
     * @param {Class} typeRestriction If specified, this will limit the type of objects that can be added to this LinkableHashMap.
     */
    function LinkableDynamicObject(typeRestriction) {
        if (typeRestriction === undefined) typeRestriction = null;
        // this is a constraint on the type of object that can be linked
        this._typeRestrictionClassName;
        this._typeRestriction = typeRestriction;
        // when this is true, the linked object cannot be changed
        this._locked = false;

        weavecore.LinkableWatcher.call(this, typeRestriction);
        if (typeRestriction)
            this._typeRestrictionClassName = typeRestriction.NS + '.' + typeRestriction.CLASS_NAME;

        // the callback collection for this object
        // private const
        Object.defineProperty(this, '_cc', {
            value: WeaveAPI.SessionManager.registerDisposableChild(this, new weavecore.CallbackCollection())
        });

        Object.defineProperty(LinkableDynamicObject, 'ARRAY_CLASS_NAME', {
            value: 'Array'
        });

        /**
         * @inheritDoc
         */
        Object.defineProperty(this, 'internalObject', {
            get: function () {
                return this.target;
            }
        });

        // override public
        Object.defineProperty(this, 'targetPath', {
            get: function () {
                return weavecore.LinkableWatcher.prototype.targetPath
            },

            set: function (path) {
                if (this._locked)
                    return;
                weavecore.LinkableWatcher.prototype.targetPath = path;
            },
            configurable: true
        });

        // override public
        Object.defineProperty(this, 'target', {
            get: function () {
                return weavecore.LinkableWatcher.prototype.target;
            },

            set: function (newTarget) {
                if (this._locked)
                    return;

                if (!newTarget) {
                    weavecore.LinkableWatcher.prototype.target = null;
                    return;
                }

                this._cc.delayCallbacks();

                // if the target can be found by a path, use the path
                var sm = WeaveAPI.SessionManager;
                var path = sm.getPath(WeaveAPI.globalHashMap, newTarget);
                if (path) {
                    this.targetPath = path;
                } else {
                    // it's ok to assign a local object that we own or that doesn't have an owner yet
                    // otherwise, unset the target
                    var owner = sm.getLinkableOwner(newTarget);
                    if (owner === this || !owner)
                        weavecore.LinkableWatcher.prototype.target = newTarget;
                    else
                        weavecore.LinkableWatcher.prototype.target = null;
                }

                this._cc.resumeCallbacks();
            },
            configurable: true
        });


        Object.defineProperty(this, 'globalName', {
            /**
             * This is the name of the linked global object, or null if the internal object is local.
             */
            get: function () {
                if (this._targetPath && this._targetPath.length == 1)
                    return this._targetPath[0];
                return null;
            },
            /**
             * This function will change the internalObject if the new globalName is different, unless this object is locked.
             * If a new global name is given, the session state of the new global object will take precedence.
             * @param newGlobalName This is the name of the global object to link to, or null to unlink from the current global object.
             */
            set: function (newGlobalName) {
                if (this._locked)
                    return;

                // change empty string to null
                if (!newGlobalName)
                    newGlobalName = null;

                var oldGlobalName = this.globalName;
                if (oldGlobalName === newGlobalName)
                    return;

                this._cc.delayCallbacks();

                if (newGlobalName === null || newGlobalName === undefined) {
                    // unlink from global object and copy session state into a local object
                    this.requestLocalObjectCopy(this.internalObject);
                } else {
                    // when switcing from a local object to a global one that doesn't exist yet, copy the local object
                    if (this.target && !this.targetPath && !WeaveAPI.globalHashMap.getObject(newGlobalName))
                        WeaveAPI.globalHashMap.requestObjectCopy(newGlobalName, this.internalObject);

                    // link to new global name
                    this.targetPath = [newGlobalName];
                }

                this._cc.resumeCallbacks();
            }
        });

        /**
         * @inheritDoc
         */
        Object.defineProperty(this, 'locked', {
            get: function () {
                return this.locked;
            }

        });

        Object.defineProperty(this, 'triggerCounter', {
            get: function () {
                this._cc.triggerCounter;
            }

        });

        Object.defineProperty(this, 'callbacksAreDelayed', {
            get: function () {
                this._cc.callbacksAreDelayed;
            }

        });





    }

    LinkableDynamicObject.prototype = new weavecore.LinkableWatcher();
    LinkableDynamicObject.prototype.constructor = LinkableDynamicObject;

    var p = LinkableDynamicObject.prototype;


    p.lock = function () {
        this._locked = true;
    };

    /**
     * @inheritDoc
     */
    //public

    p.getSessionState = function () {
        var obj = this.targetPath || this.target;
        if (!obj)
            return [];

        var className = obj.constructor.NS + obj.constructor.CLASS_NAME;
        var sessionState = obj || WeaveAPI.SessionManager.getSessionState(obj);
        return [weavecore.DynamicState.create(null, className, sessionState)];
    };

    /**
     * @inheritDoc
     */
    //public

    p.setSessionState = function (newState, removeMissingDynamicObjects) {
        //console.log(debugId(this), removeMissingDynamicObjects ? 'diff' : 'state', Compiler.stringify(newState, null, '\t'));

        // special case - no change
        if (newState === null || newState === undefined)
            return;

        try {
            // make sure callbacks only run once
            this._cc.delayCallbacks();

            // stop if there are no items
            if (!newState.length) {
                if (removeMissingDynamicObjects)
                    this.target = null;
                return;
            }

            // if it's not a dynamic state array, treat it as a path
            if (!weavecore.DynamicState.isDynamicStateArray(newState, true)) {
                this.targetPath = newState;
                return;
            }

            // if there is more than one item, it's in a deprecated format
            /*if (newState.length > 1) {
                handleDeprecatedSessionState(newState, removeMissingDynamicObjects);
                return;
            }*/

            var dynamicState = newState[0];
            var className = dynamicState[weavecore.DynamicState.CLASS_NAME];
            var objectName = dynamicState[weavecore.DynamicState.OBJECT_NAME];
            var sessionState = dynamicState[weavecore.DynamicState.SESSION_STATE];

            // backwards compatibility
            /*if (className == 'weave.core::GlobalObjectReference' || className == 'GlobalObjectReference') {
                className = ARRAY_CLASS_NAME;
                sessionState = [objectName];
            }*/

            if (className === ARRAY_CLASS_NAME || (!className && this.targetPath))
                this.targetPath = sessionState;
            else if (className === SessionManager.DIFF_DELETE)
                this.target = null;
            else {
                var prevTarget = this.target;
                // if className is not specified, make no change unless removeMissingDynamicObjects is true
                if (className || removeMissingDynamicObjects)
                    setLocalObjectType.call(this, className);
                //TODO:Remove hardcoded NameSpace
                //var classDef = eval("weavecore." + className);
                var classDef = window[className];
                if ((!className && this.target) || (classDef && this.target instanceof classDef))
                    WeaveAPI.SessionManager.setSessionState(this.target, sessionState, prevTarget !== this.target || removeMissingDynamicObjects);
            }
        } finally {
            // allow callbacks to run once now
            this._cc.resumeCallbacks();
        }
    };





    // override protected

    p.internalSetTarget = function (newTarget) {
        // don't allow recursive linking
        if (newTarget === this || WeaveAPI.SessionManager.getLinkableDescendants(newTarget, LinkableDynamicObject).indexOf(this) >= 0)
            newTarget = null;

        weavecore.LinkableWatcher.prototype.internalSetTarget(newTarget);
    };



    //private
    //to-do
    // replace weavecore with ns and figure out best way to deal this
    function setLocalObjectType(className) {
        // stop if locked
        if (this._locked)
            return;

        this._cc.delayCallbacks();

        this.targetPath = null;

        var classDef = eval(className);
        if ((classDef.prototype instanceof weavecore.ILinkableObject || classDef.SESSIONABLE) && (this._typeRestriction === null || this._typeRestriction === undefined || classDef === this._typeRestriction)) {

            var obj = this.target;
            if (!obj || obj.constructor !== classDef || !(obj instanceof classDef))
                weavecore.LinkableWatcher.prototype.target = new classDef();
        } else {
            weavecore.LinkableWatcher.prototype.target = null;
        }

        this._cc.resumeCallbacks();
    };

    /**
     * @inheritDoc
     */


    p.requestLocalObject = function (objectType, lockObject) {
        this._cc.delayCallbacks();

        //To-do
        // this will fail if we minify the weavecore, as constructor name wont be same in minified version
        // we nee dot get namespace of that object here too
        // temp solution store  Ns name in the object instance as String
        if (objectType)
            setLocalObjectType.call(this, objectType.NS + '.' + objectType.CLASS_NAME);
        else
            this.target = null;

        if (lockObject)
            this._locked = true;

        this._cc.resumeCallbacks();

        if (objectType)
            return (this.target && this.target instanceof objectType) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestGlobalObject = function (name, objectType, lockObject) {
        if (!name)
            return this.requestLocalObject(objectType, lockObject);

        if (!this._locked) {
            this._cc.delayCallbacks();

            this.targetPath = [name];
            WeaveAPI.globalHashMap.requestObject(name, objectType, lockObject);
            if (lockObject)
                this._locked = true;

            this._cc.resumeCallbacks();
        }

        if (objectType)
            return (this.target && this.target instanceof objectType) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestLocalObjectCopy = function (objectToCopy) {
        this._cc.delayCallbacks(); // make sure callbacks only trigger once
        var classDef = objectToCopy ? objectToCopy.constructor : null;
        var object = this.requestLocalObject(classDef, false);
        if (object !== null && object !== undefined && objectToCopy !== null && objectToCopy !== undefined) {
            var state = WeaveAPI.SessionManager.getSessionState(objectToCopy);
            WeaveAPI.SessionManager.setSessionState(object, state, true);
        }
        this._cc.resumeCallbacks();
    };


    p.removeObject = function () {
        if (!this._locked)
            weavecore.LinkableWatcher.prototype.target = null;
    };

    p.dispose = function () {
        // explicitly dispose the CallbackCollection before anything else
        this._cc.dispose();
        weavecore.LinkableWatcher.prototype.dispose();
    };

    ////////////////////////////////////////////////////////////////////////
    // ICallbackCollection interface included for backwards compatibility
    /** @inheritDoc */
    p.addImmediateCallback = function (relevantContext, callback, runCallbackNow, alwaysCallLast) {
        runCallbackNow = (runCallbackNow === undefined) ? false : runCallbackNow;
        alwaysCallLast = (alwaysCallLast === undefined) ? false : alwaysCallLast;
        this._cc.addImmediateCallback(relevantContext, callback, runCallbackNow, alwaysCallLast);
    };

    /** @inheritDoc */
    p.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow) {
        triggerCallbackNow = (triggerCallbackNow === undefined) ? false : triggerCallbackNow;
        this._cc.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow);
    };

    /** @inheritDoc */
    p.addDisposeCallback = function (relevantContext, callback) {
        this._cc.addDisposeCallback(relevantContext, callback);
    };

    /** @inheritDoc */
    p.removeCallback = function (callback) {
        this._cc.removeCallback(callback);
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.triggerCallbacks = function () {
        this._cc.triggerCallbacks();
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.delayCallbacks = function () {
        this._cc.delayCallbacks();
    };

    /** @inheritDoc */
    p.resumeCallbacks = function () {
        this._cc.resumeCallbacks();
    };

    weavecore.LinkableDynamicObject = LinkableDynamicObject;
    weavecore.ClassUtils.registerClass('weavecore.LinkableDynamicObject', LinkableDynamicObject);


}());
