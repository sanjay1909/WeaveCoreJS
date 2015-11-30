/**
 * @module weavecore
 */

// namespace
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
    Object.defineProperty(LinkableWatcher, 'NS', {
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
    Object.defineProperty(LinkableWatcher, 'CLASS_NAME', {
        value: 'LinkableWatcher'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This is used to dynamically attach a set of callbacks to different targets.
     * The callbacks of the LinkableWatcher will be triggered automatically when the
     * target triggers callbacks, changes, becomes null or is disposed.
     * Instead of calling this constructor directly, consider using one of the {{#crossLink "SessionManager"}}{{/crossLink}} functions
     * {{#crossLink "SessionManager/registerLinkableChild:method"}}{{/crossLink}} or  {{#crossLink "SessionManager/registerDisposableChild:method"}}{{/crossLink}} to make sure the watcher will get disposed automatically.
     * @class LinkableWatcher
     * @extends ILinkableObject
     * @constructor
     * @param {Class} typeRestriction Optionally restricts which type of targets this watcher accepts.
     * @param {Function} immediateCallback A function to add as an immediate callback.
     * @param {Function} groupedCallback A function to add as a grouped callback.
     */
    function LinkableWatcher(typeRestriction, immediateCallback, groupedCallback) {
        if (typeRestriction === undefined) typeRestriction = null;
        if (immediateCallback === undefined) immediateCallback = null;
        if (groupedCallback === undefined) groupedCallback = null;

        //weavecore.ILinkableObject.call(this);

        Object.defineProperty(this, 'sessionable', {
            value: true
        });

        this._typeRestriction = typeRestriction;

        if (immediateCallback !== null && immediateCallback !== undefined)
            WeaveAPI.SessionManager.getCallbackCollection(this).addImmediateCallback(null, immediateCallback);

        if (groupedCallback !== null && groupedCallback !== undefined)
            WeaveAPI.SessionManager.getCallbackCollection(this).addGroupedCallback(null, groupedCallback);

        this._target; // the current target or ancestor of the to-be-target
        this._foundTarget = true; // false when _target is not the desired target
        this._targetPath; // the path that is being watched
        this._pathDependencies = new weavecore.Dictionary2D(true, false); // Maps an ILinkableDynamicObject to its previous internalObject.

        Object.defineProperty(this, 'targetPath', {
            /**
             * This is the path that is currently being watched for linkable object targets.
             */
            get: function () {
                return this._targetPath ? this._targetPath.concat() : null;
            },
            /**
             * This will set a path which should be watched for new targets.
             * Callbacks will be triggered immediately if the path changes or points to a new target.
             */
            set: this._setTargetPath,
            configurable: true
        });

        Object.defineProperty(this, 'target', {
            /**
             * This is the linkable object currently being watched.
             * Setting this will unset the targetPath.
             */
            get: function () {
                return this._foundTarget ? this._target : null;
            },
            set: this._setTarget,
            configurable: true
        });

        this.__proto__._handleTargetTrigger = this.__proto__._handleTargetTrigger.bind(this);
        this.__proto__._handleTargetDispose = this.__proto__._handleTargetDispose.bind(this);
        this.__proto__._handlePathDependencies = this.__proto__._handlePathDependencies.bind(this);

    }

    //LinkableWatcher.prototype = new weavecore.ILinkableObject();
    // LinkableWatcher.prototype.constructor = LinkableWatcher;

    var p = LinkableWatcher.prototype;


    // overridable setter function for 'targetPath'
    p._setTarget = function (newTarget) {
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();
        this.targetPath = null;
        this.internalSetTarget(newTarget);
        cc.resumeCallbacks();
    }


    // overridable setter function for 'target'
    p._setTargetPath = function (path) {
        // do not allow watching the globalHashMap
        if (path && path.length === 0)
            path = null;
        if (weavecore.StandardLib.compare(this._targetPath, path) !== 0) {
            var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
            cc.delayCallbacks();

            resetPathDependencies.call(this);
            this._targetPath = path;
            handlePath.call(this);
            cc.triggerCallbacks.call(cc);

            cc.resumeCallbacks.call(cc);
        }
    }

    /**
     * This sets the new target to be watched without resetting targetPath.
     * Callbacks will be triggered immediately if the new target is different from the old one.
     */
    p.internalSetTarget = function (newTarget) {
        if (this._foundTarget && this._typeRestriction)
            newTarget = (newTarget && weavecore.ClassUtils.is(newTarget, this._typeRestriction)) ? newTarget : null;

        // do nothing if the targets are the same.
        if (this._target === newTarget)
            return;

        var sm = WeaveAPI.SessionManager;

        // unlink from old target
        if (this._target) {
            sm.getCallbackCollection(this._target).removeCallback(this._handleTargetTrigger);
            sm.getCallbackCollection(this._target).removeCallback(this._handleTargetDispose);
            // if we own the previous target, dispose it
            if (sm.getLinkableOwner(this._target) === this)
                sm.disposeObject(this._target);
            else
                sm.unregisterLinkableChild(this, this._target);
        }

        this._target = newTarget;

        // link to new target
        if (this._target) {
            // we want to register the target as a linkable child (for busy status)
            sm.registerLinkableChild(this, this._target);
            // we don't want the target triggering our callbacks directly
            sm.getCallbackCollection(this._target).removeCallback(sm.getCallbackCollection(this).triggerCallbacks);
            //this._handleTargetTrigger = this._handleTargetTrigger.bind(this);
            //this.__proto__._handleTargetTrigger = this.__proto__._handleTargetTrigger.bind(this);
            sm.getCallbackCollection(this._target).addImmediateCallback(this, this._handleTargetTrigger, false, true);
            // we need to know when the target is disposed
            //this.__proto__._handleTargetDispose = this.__proto__._handleTargetDispose.bind(this);
            sm.getCallbackCollection(this._target).addDisposeCallback(this, this._handleTargetDispose);
        }

        if (this._foundTarget)
            this._handleTargetTrigger.call(this);
    };


    p._handleTargetTrigger = function () {
        if (this._foundTarget) {
            var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
            cc.triggerCallbacks.call(cc);
        } else
            handlePath.call(this);
    };



    p._handleTargetDispose = function () {
        if (this._targetPath) {
            handlePath.call(this);
        } else {
            this._target = null;
            var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
            cc.triggerCallbacks.call(cc);

        }
    };

    function handlePath() {
        if (!this._targetPath) {
            this._foundTarget = true;
            this.internalSetTarget(null);
            return;
        }

        // traverse the path, finding ILinkableDynamicObject path dependencies along the way
        var sm = WeaveAPI.SessionManager;
        var node = WeaveAPI.globalHashMap;
        var subPath = [];
        for (var name of this._targetPath) {
            if (weavecore.ClassUtils.is(node, weavecore.ILinkableCompositeObject))
                addPathDependency.call(this, node, name);

            subPath[0] = name;
            var child = sm.getObject(node, subPath);
            if (child) {
                node = child;
            } else {
                // the path points to an object that doesn't exist yet
                if (node instanceof weavecore.LinkableHashMap) {
                    // watching childListCallbacks instead of the hash map accomplishes two things:
                    // 1. eliminate unnecessary calls to _handlePath()
                    // 2. avoid watching the root hash map (and registering the root as a child of the watcher)
                    node = node.childListCallbacks;
                }
                if (node instanceof weavecore.LinkableDynamicObject) {
                    // path dependency code will detect changes to this node, so we don't need to set the target
                    node = null;
                }
                var lostTarget = this._foundTarget;
                this._foundTarget = false;

                this.internalSetTarget(node);

                // must trigger here when we lose the target because internalSetTarget() won't trigger when _foundTarget is false
                if (lostTarget) {
                    var cc = sm.getCallbackCollection(this)
                    cc.triggerCallbacks.call(cc);
                }

                return;
            }
        }

        // we found a desired target if there is no type restriction or the object fits the restriction
        this._foundTarget = !this._typeRestriction || node instanceof this._typeRestriction;
        this.internalSetTarget(node);
    };

    function addPathDependency(parent, pathElement) {
        // if parent is an ILinkableHashMap and pathElement is a String, we don't need to add the dependency
        var lhm = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (lhm && typeof pathElement === "string")
            return;

        var ldo = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        if (ldo)
            pathElement = null;

        if (!this._pathDependencies.get(parent, pathElement)) {
            var child = WeaveAPI.SessionManager.getObject(parent, [pathElement]);
            this._pathDependencies.set(parent, pathElement, child);
            var dependencyCallbacks = getDependencyCallbacks(parent);
            //this.__proto__._handlePathDependencies = this.__proto__._handlePathDependencies.bind(this);
            dependencyCallbacks.addImmediateCallback(this, this._handlePathDependencies);
            dependencyCallbacks.addDisposeCallback(this, this._handlePathDependencies);
        }

    };

    function getDependencyCallbacks(parent) {
        var lhm = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (lhm)
            return lhm.childListCallbacks;
        return WeaveAPI.SessionManager.getCallbackCollection(parent);
    }


    p._handlePathDependencies = function () {
        var sm = WeaveAPI.SessionManager;
        for (var parent of this._pathDependencies.dictionary.keys()) {
            for (var pathElement of this._pathDependencies.dictionary.get(parent).keys()) {
                var oldChild = this._pathDependencies.get(parent, pathElement);
                var newChild = sm.getObject(parent, [pathElement]);
                if (sm.objectWasDisposed(parent) || oldChild !== newChild) {
                    resetPathDependencies.call(this);
                    handlePath.call(this);
                    return;
                }
            }
        }

    };

    function resetPathDependencies() {
        for (var parent of this._pathDependencies.dictionary.keys())
            getDependencyCallbacks(parent).removeCallback(this._handlePathDependencies);
        this._pathDependencies = new weavecore.Dictionary2D(true, false);
    };


    p.dispose = function () {
        this._targetPath = null;
        this._target = null;
        // everything else will be cleaned up automatically
    };

    weavecore.LinkableWatcher = LinkableWatcher;
    weavecore.ClassUtils.registerClass('weavecore.LinkableWatcher', LinkableWatcher);

    /*
			// JavaScript test code for path dependency case
			var lhm = weave.path('lhm').remove().request('LinkableHashMap');
			
			var a = lhm.push('a').request('LinkableDynamicObject').state(lhm.getPath('b', null));
			
			a.addCallback(function () {
			if (a.getType(null))
			console.log('a.getState(null): ', JSON.stringify(a.getState(null)));
			else
			console.log('a has no internal object');
			}, false, true);
			
			var b = lhm.push('b').request('LinkableDynamicObject').state(lhm.getPath('c'));
			
			// a has no internal object
			
			var c = lhm.push('c').request('LinkableDynamicObject').request(null, 'LinkableString').state(null, 'c value');
			
			// a.getState(null): []
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":null}]
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":"c value"}]
			
			b.remove(null);
			
			// a has no internal object
			
			b.request(null, 'LinkableString').state(null, 'b value');
			
			// a.getState(null): null
			// a.getState(null): "b value"
		*/
}());
