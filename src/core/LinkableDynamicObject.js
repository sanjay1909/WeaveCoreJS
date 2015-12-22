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




    Object.defineProperty(LinkableDynamicObject, 'ARRAY_CLASS_NAME', {
        value: "Array"
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
        typeRestriction = typeof typeRestriction !== 'undefined' ? typeRestriction : null;
        this.cc = WeaveAPI.disposableChild(this, weavecore.CallbackCollection);
        LinkableDynamicObject.base(this, 'constructor', typeRestriction);
    }

    goog.inherits(LinkableDynamicObject, weavecore.LinkableWatcher);

    var p = LinkableDynamicObject.prototype;

    /**
     * @private
     * @type {weavejs.core.CallbackCollection}
     */
    p.cc;


    /**
     * @private
     * @type {boolean}
     */
    p._locked = false;

    Object.defineProperties(p, {
        /** @export */
        internalObject: {
            get: function () {
                return this.target;
            }
        },
        target: {
            get: function () {
                return weavecore.ClassUtils.superGetter(LinkableDynamicObject, this, 'target');
            },
            set: function (newTarget) {
                if (this._locked)
                    return;
                if (!newTarget) {
                    weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', null);
                    return;
                }
                this.cc.delayCallbacks();
                var path = WeaveAPI.findPath(WeaveAPI.globalHashMap, newTarget);
                if (path) {
                    this.targetPath = path;
                } else {
                    var owner = WeaveAPI.getOwner(newTarget);
                    if (owner === this || !owner)
                        weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', newTarget);
                    else
                        weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', null);
                }
                this.cc.resumeCallbacks();
            }
        },
        targetPath: {
            get: function () {
                return weavecore.ClassUtils.superGetter(LinkableDynamicObject, this, 'targetPath');
            },
            set: function (path) {
                if (this._locked)
                    return;
                weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'targetPath', path);
            }
        },
        globalName: {
            get: function () {
                if (this._targetPath && this._targetPath.length == 1)
                    return this._targetPath[0];
                return null;
            },
            set: function (newGlobalName) {
                if (this._locked)
                    return;
                if (!newGlobalName)
                    newGlobalName = null;
                var oldGlobalName = this.globalName;
                if (oldGlobalName == newGlobalName)
                    return;
                this.cc.delayCallbacks();
                if (newGlobalName == null) {
                    this.requestLocalObjectCopy(this.internalObject);
                } else {
                    var root = WeaveAPI.globalHashMap;
                    if (this.target && !this.targetPath && !root.getObject(newGlobalName))
                        root.requestObjectCopy(newGlobalName, this.internalObject);
                    this.targetPath = [newGlobalName];
                }
                this.cc.resumeCallbacks();
            }
        },
        locked: {
            get: function () {
                return this._locked;
            }
        },
        triggerCounter: {
            get: function () {
                return this.cc.triggerCounter;
            }
        },
        callbacksAreDelayed: {
            get: function () {
                return this.cc.callbacksAreDelayed;
            }
        }
    });




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

        var className = WeaveAPI.className(obj);
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
            this.cc.delayCallbacks();

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

            if (className === LinkableDynamicObject.ARRAY_CLASS_NAME || (!className && this.targetPath))
                this.targetPath = sessionState;
            else if (className === WeaveAPI.SessionManager.DIFF_DELETE)
                this.target = null;
            else {
                var prevTarget = this.target;
                // if className is not specified, make no change unless removeMissingDynamicObjects is true
                if (className || removeMissingDynamicObjects)
                    this.setLocalObjectType(className);
                //TODO:Remove hardcoded NameSpace
                //var classDef = eval("weavecore." + className);
                var classDef = window[className];
                if ((!className && this.target) || (classDef && weavecore.ClassUtils.is(this.target, classDef)))
                    WeaveAPI.setState(this.target, sessionState, prevTarget !== this.target || removeMissingDynamicObjects);
            }
        } finally {
            // allow callbacks to run once now
            this.cc.resumeCallbacks();
        }
    };





    // override protected

    p.internalSetTarget = function (newTarget) {
        // don't allow recursive linking
        if (newTarget === this || WeaveAPI.SessionManager.getLinkableDescendants(newTarget, LinkableDynamicObject).indexOf(this) >= 0)
            newTarget = null;

        LinkableDynamicObject.base(this, 'internalSetTarget', newTarget);
    };



    //private
    //to-do
    // replace weavecore with ns and figure out best way to deal this
    p.setLocalObjectType = function (classDef) {
        // stop if locked
        if (this._locked)
            return;

        this.cc.delayCallbacks();

        this.targetPath = null;

        if (WeaveAPI.isLinkable(classDef) && (this._typeRestriction == null || weavecore.ClassUtils.is(classDef.prototype, this._typeRestriction))) {
            var obj = this.target;
            if (!obj || obj.constructor !== classDef)
                weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', new classDef());
        } else {
            weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', null);
        }


        this.cc.resumeCallbacks();
    };

    /**
     * @inheritDoc
     */


    p.requestLocalObject = function (objectType, lockObject) {
        this.cc.delayCallbacks();

        //To-do
        // this will fail if we minify the weavecore, as constructor name wont be same in minified version
        // we nee dot get namespace of that object here too
        // temp solution store  Ns name in the object instance as String
        if (objectType)
            this.setLocalObjectType(objectType);
        else
            this.target = null;

        if (lockObject)
            this._locked = true;

        this.cc.resumeCallbacks();

        if (objectType)
            return (this.target && weavecore.ClassUtils.is(this.target, objectType)) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestGlobalObject = function (name, objectType, lockObject) {
        if (!name)
            return this.requestLocalObject(objectType, lockObject);

        if (!this._locked) {
            this.cc.delayCallbacks();

            this.targetPath = [name];
            WeaveAPI.globalHashMap.requestObject(name, objectType, lockObject);
            if (lockObject)
                this._locked = true;

            this.cc.resumeCallbacks();
        }

        if (objectType)
            return (this.target && weavecore.ClassUtils.is(this.target, objectType)) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestLocalObjectCopy = function (objectToCopy) {
        this.cc.delayCallbacks(); // make sure callbacks only trigger once
        var classDef = objectToCopy ? objectToCopy.constructor : null;
        var object = this.requestLocalObject(classDef, false);
        if (object !== null && object !== undefined && objectToCopy !== null && objectToCopy !== undefined) {
            WeaveAPI.copyState(objectToCopy, object);
        }
        this.cc.resumeCallbacks();
    };


    p.removeObject = function () {
        if (!this._locked)
            weavecore.ClassUtils.superSetter(LinkableDynamicObject, this, 'target', null);
    };

    p.dispose = function () {
        // explicitly dispose the CallbackCollection before anything else
        this.cc.dispose();
        LinkableDynamicObject.base(this, 'dispose');
    };

    ////////////////////////////////////////////////////////////////////////
    // ICallbackCollection interface included for backwards compatibility
    /** @inheritDoc */
    p.addImmediateCallback = function (relevantContext, callback, runCallbackNow, alwaysCallLast) {
        runCallbackNow = typeof runCallbackNow !== 'undefined' ? runCallbackNow : false;
        alwaysCallLast = typeof alwaysCallLast !== 'undefined' ? alwaysCallLast : false;
        this.cc.addImmediateCallback(relevantContext, callback, runCallbackNow, alwaysCallLast);
    };

    /** @inheritDoc */
    p.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy) {
        triggerCallbackNow = typeof triggerCallbackNow !== 'undefined' ? triggerCallbackNow : false;
        delayWhileBusy = typeof delayWhileBusy !== 'undefined' ? delayWhileBusy : true;
        this.cc.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy);
    };

    /** @inheritDoc */
    p.addDisposeCallback = function (relevantContext, callback) {
        this.cc.addDisposeCallback(relevantContext, callback);
    };

    /** @inheritDoc */
    p.removeCallback = function (callback) {
        this.cc.removeCallback(callback, this.cc);
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.triggerCallbacks = function () {
        this.cc.triggerCallbacks();
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.delayCallbacks = function () {
        this.cc.delayCallbacks();
    };

    /** @inheritDoc */
    p.resumeCallbacks = function () {
        this.cc.resumeCallbacks();
    };

    weavecore.LinkableDynamicObject = LinkableDynamicObject;
    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableDynamicObject',
            qName: 'weavecore.LinkableDynamicObject'
        }],
        interfaces: [weavecore.ILinkableDynamicObject, weavecore.ICallbackCollection]
    };



}());
