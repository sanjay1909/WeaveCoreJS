

import ILinkableObject from "../api/core/ILinkableObject";
import ILinkableHashMap from "../api/core/ILinkableHashMap";
import ILinkableDynamicObject from "../api/core/ILinkableDynamicObject";
import ILinkableVariable from "../api/core/ILinkableVariable";
import ILinkableCompositeObject from "../api/core/ILinkableCompositeObject";
import ILinkableObjectWithNewProperties from "../api/core/ILinkableObjectWithNewProperties";
import ICallbackCollection from "../api/core/ICallbackCollection";
import ILinkableObjectWithBusyStatus from "../api/core/ILinkableObjectWithBusyStatus";
import ILinkableObjectWithNewPaths from "../api/core/ILinkableObjectWithNewPaths";
import ISessionManager from "../api/core/ISessionManager";
import IDisposableObject from "../api/core/IDisposableObject";

import CallbackCollection from "./CallbackCollection";

import DynamicState from "../api/core/DynamicState";
import WeaveTreeItem from "../util/WeaveTreeItem";
import WeavePromise from "../util/WeavePromise";
import Dictionary2D from "../util/Dictionary2D";
import Language from "../util/Language";
import StandardLib from "../util/StandardLib";
import JS from "../util/JS";

import Weave from "../Weave";
import WeaveAPI from "../WeaveAPI";

export default class SessionManager
{
	constructor()
	{
		this.d2d_object_name_tree = new Dictionary2D(true, false, WeaveTreeItem);
		this._treeCallbacks = new CallbackCollection();
		this.map_obj_getSessionStateIgnore = new JS.WeakMap();
		this.map_child_owner = new JS.WeakMap();
		this.d2d_owner_child = new Dictionary2D(true, false);
		this.d2d_child_parent = new Dictionary2D(true, false);
		this.d2d_parent_child = new Dictionary2D(true, false);
		this.map_task_stackTrace = new JS.Map();
		this.d2d_owner_task = new Dictionary2D(false, false);
		this.d2d_task_owner = new Dictionary2D(false, false);
		this.map_busyTraversal = new JS.WeakMap();
		this.array_busyTraversal = [];
		this.map_unbusyTriggerCounts = new JS.Map();
		this.map_unbusyStackTraces = new JS.WeakMap();
		this.map_ILinkableObject_ICallbackCollection = new JS.WeakMap();
		this.map_ICallbackCollection_ILinkableObject = new JS.WeakMap();
		this.map_disposed = new JS.WeakMap();
		this.d2d_lhs_rhs_setState = new Dictionary2D(true, true);


		this.newLinkableChild = this.newLinkableChild.bind(this);
		this.registerLinkableChild = this.registerLinkableChild.bind(this);
		this.newDisposableChild = this.newDisposableChild.bind(this);
		this.registerDisposableChild = this.registerDisposableChild.bind(this);
		this.unregisterLinkableChild = this.unregisterLinkableChild.bind(this);
		this.excludeLinkableChildFromSessionState = this.excludeLinkableChildFromSessionState.bind(this);
		this._getRegisteredChildren = this._getRegisteredChildren.bind(this);
		this.getOwner = this.getOwner.bind(this);
		this.getLinkableOwner = this.getLinkableOwner.bind(this);
		this.getSessionStateTree = this.getSessionStateTree.bind(this);
		this.getTreeItemChildren = this.getTreeItemChildren.bind(this);
		this.getTypedStateTree = this.getTypedStateTree.bind(this);
		this.getTypedStateFromTreeNode = this.getTypedStateFromTreeNode.bind(this);
		this.addTreeCallback = this.addTreeCallback.bind(this);
		this.removeTreeCallback = this.removeTreeCallback.bind(this);
		this.copySessionState = this.copySessionState.bind(this);
		this.applyDiffForLinkableVariable = this.applyDiffForLinkableVariable.bind(this);
		this.setSessionState = this.setSessionState.bind(this);
		this.getSessionState = this.getSessionState.bind(this);
		this.getLinkablePropertyNames = this.getLinkablePropertyNames.bind(this);
		this.getLinkableDescendants = this.getLinkableDescendants.bind(this);
		this.internalGetDescendants = this.internalGetDescendants.bind(this);
		this.disposeBusyTaskPointers = this.disposeBusyTaskPointers.bind(this);
		this.assignBusyTask = this.assignBusyTask.bind(this);
		this.unassignBusyTask = this.unassignBusyTask.bind(this);
		this.unbusyTrigger = this.unbusyTrigger.bind(this);
		this.linkableObjectIsBusy = this.linkableObjectIsBusy.bind(this);
		this.getCallbackCollection = this.getCallbackCollection.bind(this);
		this.getLinkableObjectFromCallbackCollection = this.getLinkableObjectFromCallbackCollection.bind(this);
		this.objectWasDisposed = this.objectWasDisposed.bind(this);
		this.disposeObject = this.disposeObject.bind(this);
		this.debugDisposedObject = this.debugDisposedObject.bind(this);
		this._getPaths = this._getPaths.bind(this);
		this._getChildPropertyName = this._getChildPropertyName.bind(this);
		this.getPath = this.getPath.bind(this);
		this._getPath = this._getPath.bind(this);
		this.getObject = this.getObject.bind(this);
		this.getObjectFromDeprecatedPath = this.getObjectFromDeprecatedPath.bind(this);
		this.linkSessionState = this.linkSessionState.bind(this);
		this.unlinkSessionState = this.unlinkSessionState.bind(this);
		this.computeDiff = this.computeDiff.bind(this);
		this.combineDiff = this.combineDiff.bind(this);
	}

	newLinkableChild (linkableParent, linkableChildType, callback, useGroupedCallback)
	{
		callback = typeof callback !== 'undefined' ? callback : null;
		useGroupedCallback = typeof useGroupedCallback !== 'undefined' ? useGroupedCallback : false;

		if (!Weave.isLinkable(linkableParent))
			throw new Error("newLinkableChild(): Parent does not implement ILinkableObject.");

		if (!linkableChildType)
			throw new Error("newLinkableChild(): Child type parameter cannot be null.");

		if (!Weave.isLinkable(linkableChildType))
		{
			var childQName = Weave.className(linkableChildType);
			if (Weave.getDefinition(childQName))
				throw new Error("newLinkableChild(): Child class does not implement ILinkableObject.");
			else
				throw new Error("newLinkableChild(): Child class inaccessible via qualified class name: " + childQName);
		}
		var  linkableChild = new linkableChildType();
		return this.registerLinkableChild(linkableParent, linkableChild, callback, useGroupedCallback);
	};

	registerLinkableChild (linkableParent, linkableChild, callback, useGroupedCallback)
	{
		callback = typeof callback !== 'undefined' ? callback : null;
		useGroupedCallback = typeof useGroupedCallback !== 'undefined' ? useGroupedCallback : false;

		if (!Weave.isLinkable(linkableParent))
			throw new Error("registerLinkableChild(): Parent does not implement ILinkableObject.");

		if (!Weave.isLinkable(linkableChild))
			throw new Error("registerLinkableChild(): Child parameter cannot be null.");

		if (linkableParent == linkableChild)
			throw new Error("registerLinkableChild(): Invalid attempt to register sessioned property having itself as its parent");

		if (callback != null)
		{
			var cc = this.getCallbackCollection(linkableChild);
			if (useGroupedCallback)
				cc.addGroupedCallback(linkableParent, callback);
			else
				cc.addImmediateCallback(linkableParent, callback);
		}

		this.registerDisposableChild(linkableParent, linkableChild);
		if (this.d2d_child_parent.get(linkableChild, linkableParent) === undefined)
		{
			this.d2d_child_parent.set(linkableChild, linkableParent, true);
			this.d2d_parent_child.set(linkableParent, linkableChild, true);
			var parentCC = this.getCallbackCollection(linkableParent);
			//todo: make sure clsure is working
			this.getCallbackCollection(linkableChild).addImmediateCallback(linkableParent, Language.closure(parentCC.triggerCallbacks, parentCC, 'triggerCallbacks'), false, true);
		}
		this._treeCallbacks.triggerCallbacks();
		return linkableChild;
	};


	newDisposableChild(disposableParent, disposableChildType)
	{
		return this.registerDisposableChild(disposableParent, new disposableChildType());
	};


	registerDisposableChild(disposableParent, disposableChild)
	{
		if (!disposableParent)
			throw new Error("registerDisposableChild(): Parent parameter cannot be null.");

		if (!disposableChild)
			throw new Error("registerDisposableChild(): Child parameter cannot be null.");

		var handler;
		if (this.objectWasDisposed(disposableParent))
			throw new Error("registerDisposableChild(): Parent was previously disposed");

		if (!this.map_child_owner.has(disposableChild))
		{
			this.map_child_owner.set(disposableChild, disposableParent);
			this.d2d_owner_child.set(disposableParent, disposableChild, true);
			if (this.objectWasDisposed(disposableChild))
				throw new Error("registerDisposableChild(): Child was previously disposed");
			//todo: getAsyncInstanceHandler? // for react async class mostly
			handler = Weave.getAsyncInstanceHandler(disposableChild.constructor);
			if (handler != null)
				handler(disposableChild);
		}
		return disposableChild;
	};

	/**
	 * Use this function with care.  This will remove child objects from the session state of a parent and
	 * stop the child from triggering the parent callbacks.
	 */
	unregisterLinkableChild(parent, child)
	{
		if (!parent)
			throw new Error("unregisterLinkableChild(): Parent parameter cannot be null.");

		if (!child)
			throw new Error("unregisterLinkableChild(): Child parameter cannot be null.");

		this.d2d_child_parent.remove(child, parent);
		this.d2d_parent_child.remove(parent, child);
		this.getCallbackCollection(child).removeCallback(parent, Language.closure(this.getCallbackCollection(parent).triggerCallbacks, this.getCallbackCollection(parent), 'triggerCallbacks'));
		this._treeCallbacks.triggerCallbacks();
	};

	/**
	 * This function will add or remove child objects from the session state of a parent.  Use this function
	 * with care because the child will no longer be "sessioned."  The child objects will continue to trigger the
	 * callbacks of the parent object, but they will no longer be considered a part of the parent's session state.
	 * If you are not careful, this will break certain functionalities that depend on the session state of the parent.
	 */
	excludeLinkableChildFromSessionState(parent, child) {
		if (parent == null || child == null) {
			JS.error("SessionManager.excludeLinkableChildFromSessionState(): Parameters to this function cannot be null.");
			return;
		}
		if (this.d2d_child_parent.get(child, parent))
			this.d2d_child_parent.set(child, parent, false);
		if (this.d2d_parent_child.get(parent, child))
			this.d2d_parent_child.set(parent, child, false);
	};


	/**
	 * This function will return all the child objects that have been registered with a parent.
	 */
	_getRegisteredChildren(parent) {
		return this.d2d_parent_child.secondaryKeys(parent);
	};

	getOwner(child) {
		return this.map_child_owner.get(child);
	};


	getLinkableOwner(child)
	{
		return this.map_child_owner.get(child);
	};


	getSessionStateTree(root, objectName) {
		if (!root)
			return null;
		var treeItem = this.d2d_object_name_tree.get(root, objectName);
		if (!treeItem.data)
		{
			treeItem.data = root;
			treeItem.children = Language.closure(this.getTreeItemChildren, this, 'getTreeItemChildren');
			treeItem.dependency = root ? root.childListCallbacks : root;
		}
		if (objectName)
			treeItem.label = objectName;
		return treeItem;
	};


	getTreeItemChildren(treeItem)
	{
		var object = treeItem.data;
		var children = [];
		var names;
		var childObject;
		var ignoreList = new JS.WeakMap();
		//todo try using is rather checking by casting using as
		var lhm = Language.as(object, ILinkableHashMap);
		if (lhm)
		{
			names = lhm.getNames();
			var childObjects = lhm.getObjects();
			let len = names.length;
			for (var i = 0; i < len; i++)
			{
				childObject = childObjects[i];
				if (this.d2d_child_parent.get(childObject, lhm))
				{
					if (ignoreList.has(childObject))
						continue;
					ignoreList.set(childObject, true);
					children.push(this.getSessionStateTree(childObject, names[i]));
				}
			}
		}
		else
		{
			var ldo = Language.as(object, ILinkableDynamicObject);
			if (ldo)
			{
				names = ldo.targetPath ? null : [null];
			}
			else if (object)
			{
				names = this.getLinkablePropertyNames(object);
			}

			for (var i in names)
			{
				var name = names[i];
				{
					if (ldo)
						childObject = ldo.internalObject;
					else
						childObject = object[name];
					if (!childObject)
						continue;
					if (this.d2d_child_parent.get(childObject, object))
					{
						if (ignoreList.has(childObject))
							continue;
						ignoreList.set(childObject, true);
						children.push(this.getSessionStateTree(childObject, name));
					}
				}
			}

		}
		if (children.length == 0)
			children = null;
		return children;
	};


	getTypedStateTree(root)
	{
		return this.getTypedStateFromTreeNode(this.getSessionStateTree(root, null));
	};


	getTypedStateFromTreeNode(node, i, a)
	{
		i = typeof i !== 'undefined' ? i : 0;
		a = typeof a !== 'undefined' ? a : null;
		var state;
		var children = node.children;
		if (Language.is(node.data, ILinkableVariable) || !children)
			state = this.getSessionState(node.data);
		else
			state = children.map(Language.closure(this.getTypedStateFromTreeNode, this, 'getTypedStateFromTreeNode'));
		return DynamicState.create(node.label, Weave.className(node.data), state);
	};


	/**
	 * Adds a grouped callback that will be triggered when the session state tree changes.
	 * USE WITH CARE. The groupedCallback should not run computationally-expensive code.
	 */
	addTreeCallback(relevantContext, groupedCallback, triggerCallbackNow)
	{
		triggerCallbackNow = typeof triggerCallbackNow !== 'undefined' ? triggerCallbackNow : false;
		this._treeCallbacks.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow);
	};


	removeTreeCallback(relevantContext, groupedCallback)
	{
		this._treeCallbacks.removeCallback(relevantContext, groupedCallback);
	};

	copySessionState(source, destination) 
	{
		var sessionState = this.getSessionState(source);
		this.setSessionState(destination, sessionState, true);
	};


	applyDiffForLinkableVariable(base, diff) 
	{
		if (base === null || diff === null || typeof(base) !== 'object' || typeof(diff) !== 'object' || Language.is(diff, Array))
			return diff;
		for (var key in diff) {
			var value = diff[key];
			if (value === undefined)
				delete base[key];
			else
				base[key] = this.applyDiffForLinkableVariable(base[key], value);
		}
		return base;
	};

	
	setSessionState(linkableObject, newState, removeMissingDynamicObjects) 
	{
		removeMissingDynamicObjects = typeof removeMissingDynamicObjects !== 'undefined' ? removeMissingDynamicObjects : true;
		
		if (linkableObject == null) 
		{
			JS.error("SessionManager.setSessionState(): linkableObject cannot be null.");
			return;
		}
		
		var lv = Language.as(linkableObject, ILinkableVariable);
		if (lv) {
			if (removeMissingDynamicObjects == false && newState && Weave.className(newState) == 'Object')
			{
				lv.setSessionState(this.applyDiffForLinkableVariable(JS.copyObject(lv.getSessionState()), newState));
			}
			else
			{
				lv.setSessionState(newState);
			}
			return;
		}
		var lco = Language.as(linkableObject, ILinkableCompositeObject);
		if (lco)
		{
			if (Language.is(newState, String))
				newState = [newState];

			if (newState != null && !Language.is(newState, Array))
			{
				var array = [];
				for (var key in newState)
					array.push(DynamicState.create(key, null, newState[key]));
				newState = array;
			}
			lco.setSessionState(Language.as(newState, Array), removeMissingDynamicObjects);
			return;
		}
		if (newState == null)
			return;
		var objectCC = this.getCallbackCollection(linkableObject);
		objectCC.delayCallbacks();
		var name;
		var propertyNames = this.getLinkablePropertyNames(linkableObject);
		var foundMissingProperty = false;
		var hasDeprecatedStateMapping = Language.is(linkableObject,ILinkableObjectWithNewProperties) || JS.hasProperty(linkableObject, SessionManager.DEPRECATED_STATE_MAPPING);
		for (var i in propertyNames)
		{
			name = propertyNames[i];
			{
				if (!newState.hasOwnProperty(name))
				{
					if (removeMissingDynamicObjects && hasDeprecatedStateMapping)
						foundMissingProperty = true;
					continue;
				}
				var property = null;
				try
				{
					property = Language.as(linkableObject[name], ILinkableObject);
				}
				catch (e)
				{
					JS.error('SessionManager.setSessionState(): Unable to get property "' + name + '" of class "' + Weave.className(linkableObject) + '"', e);
				}
				if (property == null)
					continue;
				if (!this.d2d_child_parent.get(property, linkableObject))
					continue;
				this.setSessionState(property, newState[name], removeMissingDynamicObjects);
			}
		}

		if (hasDeprecatedStateMapping)
		{
			var doMapping = false;
			if (foundMissingProperty)
			{
				for (var i in propertyNames)
				{
					name = propertyNames[i];
					{
						if (!newState.hasOwnProperty(name)) {
							doMapping = true;
							break;
						}
					}
				}

			}
			else
			{
				for (name in newState)
				{
					try
					{
						property = Language.as(linkableObject[name], ILinkableObject);
					}
					catch (e)
					{
						JS.error('SessionManager.setSessionState(): Unable to get property "' + name + '" of class "' + Weave.className(linkableObject) + '"', e);
					}
					if (!property || !Weave.isLinkable(property) || !this.d2d_child_parent.get(property, linkableObject))
					{
						doMapping = true;
						break;
					}
				}
			}
			if (doMapping)
			{
				var mapping = linkableObject[SessionManager.DEPRECATED_STATE_MAPPING];
				if (Language.is(mapping, Function))
					mapping.call(linkableObject, newState, removeMissingDynamicObjects);
				else
					SessionManager.traverseAndSetState(newState, mapping, removeMissingDynamicObjects);
			}
		}
		objectCC.resumeCallbacks();
	};

	getSessionState(linkableObject)
	{
		if (linkableObject == null)
		{
			JS.error("SessionManager.getSessionState(): linkableObject cannot be null.");
			return null;
		}

		var result = null;
		if (Language.is(linkableObject, ILinkableVariable))
		{
			result = Language.as(linkableObject, ILinkableVariable).getSessionState();
		}
		else if (Language.is(linkableObject, ILinkableCompositeObject))
		{
			result = Language.as(linkableObject, ILinkableCompositeObject).getSessionState();
		}
		else
		{
			var propertyNames = this.getLinkablePropertyNames(linkableObject, true);
			var resultNames = [];
			var resultProperties = [];
			var property = null;
			var i;

			for (var j in propertyNames)
			{
				var name = propertyNames[j];
				{
					try
					{
						property = null;
						property = Language.as(linkableObject[name], ILinkableObject);
					}
					catch (e)
					{
						JS.error('Unable to get property "' + name + '" of class "' + Weave.className(linkableObject) + '"');
					}
					if (property != null && !this.map_obj_getSessionStateIgnore.get(property))
					{
						if (!this.d2d_child_parent.get(property, linkableObject))
							continue;
						this.map_obj_getSessionStateIgnore.set(property, true);
						resultNames.push(name);
						resultProperties.push(property);
					}
				}
			}

			let resultNamesLength = resultNames.length;
			if (resultNamesLength > 0)
			{
				result = new Object();

				for (i = 0; i < resultNamesLength; i++) {
					var value = this.getSessionState(resultProperties[i]);
					property = Language.as(resultProperties[i], ILinkableObject);
					if (value == null && !Language.is(property, ILinkableVariable) && !Language.is(property, ILinkableCompositeObject))
						continue;
					result[resultNames[i]] = value;
				}
			}
		}
		this.map_obj_getSessionStateIgnore.set(linkableObject, undefined);
		return result;
	};

	/**
	 * This function gets a list of sessioned property names so accessor functions for non-sessioned properties do not have to be called.
	 */
	getLinkablePropertyNames(linkableObject, filtered)
	{
		filtered = typeof filtered !== 'undefined' ? filtered : false;
		if (linkableObject == null)
		{
			JS.error("SessionManager.getLinkablePropertyNames(): linkableObject cannot be null.");
			return [];
		}
		var propertyNames;
		var linkableNames;
		var name;
		var property;
		var info = WeaveAPI.ClassRegistry.getClassInfo(linkableObject);
		if (info && false)
		{
			if (!info[SessionManager.LINKABLE_PROPERTIES])
			{
				info[SessionManager.LINKABLE_PROPERTIES] = propertyNames = [];
				var arr = [info.variables, info.accessors];
				for (var i in arr)
				{
					var lookup = arr[i];

					for (name in lookup)
						if (Weave.isLinkable(Weave.getDefinition(lookup[name].type)))
							propertyNames.push(name);
				}

			}
			propertyNames = info[SessionManager.LINKABLE_PROPERTIES];
			if (!filtered)
				return propertyNames;
		} else {
			if (Weave.isAsyncClass(linkableObject['constructor']))
				propertyNames = JS.getOwnPropertyNames(linkableObject);
			else
				propertyNames = JS.getPropertyNames(linkableObject, true);
		}
		linkableNames = [];
		for (var i in propertyNames)
		{
			name = propertyNames[i];
			{
				property = linkableObject[name];
				if (Weave.isLinkable(property))
					if (!filtered || this.d2d_child_parent.get(property, linkableObject))
						linkableNames.push(name);
			}}

		return linkableNames;
	};



	getLinkableDescendants(root, filter)
	{
		filter = typeof filter !== 'undefined' ? filter : null;
		var /** @type {Array} */ result = [];
		if (root)
			this.internalGetDescendants(result, root, filter, new JS.WeakMap(), Number.MAX_VALUE);
		if (result.length > 0 && result[0] == root)
			result.shift();
		return result;
	};


	internalGetDescendants(output, root, filter, ignoreList, depth)
	{
		if (root == null || ignoreList.has(root))
			return;
		ignoreList.set(root, true);
		if (filter == null || Language.is(root, filter))
			output.push(root);
		if (--depth <= 0)
			return;
		var children = this.d2d_parent_child.secondaryKeys(root);
		for (var i in children)
		{
			var child = children[i];

			this.internalGetDescendants(output, child, filter, ignoreList, depth);}

	};

	disposeBusyTaskPointers(disposedObject)
	{
		this.d2d_owner_task.removeAllPrimary(disposedObject);
		this.d2d_task_owner.removeAllSecondary(disposedObject);
	};

	assignBusyTask(taskToken, busyObject) 
	{
		if (WeaveAPI.debugAsyncStack)
			this.map_task_stackTrace.set(taskToken, new Error("Stack trace when task was last assigned"));
		if (this.d2d_task_owner.get(taskToken, busyObject))
			return;
		if (WeavePromise.isThenable(taskToken) && !WeaveAPI.ProgressIndicator.hasTask(taskToken)) {
			var unassign = this.unassignBusyTask.bind(this, taskToken);
			taskToken.then(unassign, unassign);
		}
		this.d2d_owner_task.set(busyObject, taskToken, true);
		this.d2d_task_owner.set(taskToken, busyObject, true);
	};


	unassignBusyTask(taskToken) 
	{
		if (ProgressIndicator.hasTask(taskToken))
		{
			ProgressIndicator.removeTask(taskToken);
			return;
		}
		var owners = this.d2d_task_owner.secondaryKeys(taskToken);
		this.d2d_task_owner.removeAllPrimary(taskToken);
		for (var i in owners)
		{
			var owner = owners[i];
			{
				this.d2d_owner_task.remove(owner, taskToken);
				var map_task = this.d2d_owner_task.map.get(owner);
				if (map_task && map_task.size)
					continue;
				this.map_unbusyTriggerCounts.set(owner, this.getCallbackCollection(owner).triggerCounter);
				WeaveAPI.Scheduler.startTask(null, Language.closure(this.unbusyTrigger, this, 'unbusyTrigger'), WeaveAPI.TASK_PRIORITY_IMMEDIATE);
				if (WeaveAPI.debugAsyncStack)
				{
					var /** @type {Error} */ stackTrace = new Error("Stack trace when last task was unassigned");
					this.map_unbusyStackTraces.set(owner, {assigned:this.map_task_stackTrace.get(taskToken), unassigned:stackTrace, token:taskToken});
				}
			}}

	};

	/**
	 * Called the frame after an owner's last busy task is unassigned.
	 * Triggers callbacks if they have not been triggered since then.
	 */
	unbusyTrigger(stopTime) 
	{
		while (this.map_unbusyTriggerCounts.size) 
		{
			if (JS.now() > stopTime)
				return 0;
			var entries = JS.mapEntries(this.map_unbusyTriggerCounts);
			for (var i in entries)
			{
				var owner_triggerCount = entries[i];
				{
					var owner = owner_triggerCount[0];
					var triggerCount = owner_triggerCount[1];
					this.map_unbusyTriggerCounts['delete'](owner);
					var cc = this.getCallbackCollection(owner);
					if (Language.is(cc, CallbackCollection) ? Language.as(cc, CallbackCollection).wasDisposed : this.objectWasDisposed(owner))
						continue;
					if (cc.triggerCounter != triggerCount)
						continue;
					if (this.linkableObjectIsBusy(owner))
						continue;
					if (WeaveAPI.debugAsyncStack && SessionManager.debugUnbusy)
					{
						var stackTraces = this.map_unbusyStackTraces.get(owner);
						JS.log('Triggering callbacks because they have not triggered since owner has becoming unbusy:', owner);
						JS.log(stackTraces.assigned);
						JS.log(stackTraces.unassigned);
					}
					cc.triggerCallbacks();
				}}

		}
		return 1;
	};



	linkableObjectIsBusy(linkableObject) 
	{
		if (Language.is(linkableObject, ICallbackCollection))
			linkableObject = this.getLinkableObjectFromCallbackCollection(linkableObject);
		
		if (!linkableObject)
			return false;

		var busy = false;
		var arrayBusyTraversalLength = this.array_busyTraversal.length;
		this.array_busyTraversal[arrayBusyTraversalLength] = linkableObject;
		this.map_busyTraversal.set(linkableObject, true);
		outerLoop : for (var i = 0; i < arrayBusyTraversalLength; i++)
		{
			linkableObject = this.array_busyTraversal[i];
			var ilowbs = Language.as(linkableObject, ILinkableObjectWithBusyStatus);
			if (ilowbs)
			{
				if (ilowbs.isBusy()) {
					busy = true;
					break;
				}
				continue;
			}
			var  tasks = this.d2d_owner_task.secondaryKeys(linkableObject);
			for(var i in tasks)
			{
				var task = tasks[i];
				{
					if (WeaveAPI.debugAsyncStack) {
						var stackTrace = this.map_task_stackTrace.get(task);
					}
					busy = true;
					break outerLoop;
				}
			}

			var children = this.d2d_parent_child.secondaryKeys(linkableObject);

			for (var i in children)
			{
				var child = children[i];
				{
					if (!this.map_busyTraversal.get(child))
					{
						this.array_busyTraversal[arrayBusyTraversalLength] = child;
						this.map_busyTraversal.set(child, true);
					}
				}
			}

		};

		for (var i in this.array_busyTraversal)
		{
			linkableObject = this.array_busyTraversal[i];

			this.map_busyTraversal.set(linkableObject, false);
		}

		this.array_busyTraversal.length = arrayBusyTraversalLength = 0;
		return busy;
	};

	getCallbackCollection(linkableObject)
	{
		if (linkableObject == null)
			return null;

		if (Language.is(linkableObject, ICallbackCollection))
			return linkableObject;

		var objectCC = this.map_ILinkableObject_ICallbackCollection.get(linkableObject);
		if (objectCC == null)
		{
			objectCC = new CallbackCollection();
			if (WeaveAPI.debugAsyncStack)
				objectCC._linkableObject = linkableObject;

			this.map_ILinkableObject_ICallbackCollection.set(linkableObject, objectCC);
			this.map_ICallbackCollection_ILinkableObject.set(objectCC, linkableObject);
			this.registerDisposableChild(linkableObject, objectCC);
		}
		return objectCC;
	};


	getLinkableObjectFromCallbackCollection(callbackCollection)
	{
		return this.map_ICallbackCollection_ILinkableObject.get(callbackCollection) || callbackCollection;
	};


	objectWasDisposed(object)
	{
		if (object == null)
			return false;
		if (!this.d2d_owner_child.map.has(object)) {
			this.d2d_owner_child.map.set(object, new JS.Map());
			var handler = Weave.getAsyncInstanceHandler(object.constructor);
			if (handler != null)
				handler(object);
		}
		if (Language.is(object, ILinkableObject)) {
			var  cc = this.getCallbackCollection(object);
			if (cc)
				return cc.wasDisposed;
		}
		return this.map_disposed.has(object);
	};

	disposeObject(object)
	{
		var self = this;
		var __localFn0__ = function()
		{
			self.debugDisposedObject(linkableObject, error);
		};

		if (object != null && !this.map_disposed.get(object))
		{
			this.map_disposed.set(object, true);
			this.disposeBusyTaskPointers(object);
			try
			{
				if (Language.is(object, IDisposableObject))
				{
					object.dispose();
				}
				else if (typeof(object[SessionManager.DISPOSE]) === 'function')
				{
					object[SessionManager.DISPOSE]();
				}
			}
			catch (e)
			{
				JS.error(e);
			}
			var  linkableObject = Language.as(object, ILinkableObject);
			if (linkableObject)
			{
				var  objectCC = this.getCallbackCollection(linkableObject);
				if (objectCC != linkableObject)
					this.disposeObject(objectCC);
			}
			var  parents = this.d2d_child_parent.secondaryKeys(object);

			for (var i in parents)
			{
				var parent = parents[i];
				this.d2d_parent_child.remove(parent, object);
			}

			this.d2d_child_parent.removeAllPrimary(object);
			var owner = this.map_child_owner.get(object);

			if (owner != null)
			{
				this.d2d_owner_child.remove(owner, object);
				this.map_child_owner['delete'](object);
			}
			var children = this.d2d_owner_child.secondaryKeys(object);
			this.d2d_owner_child.removeAllPrimary(object);
			this.d2d_parent_child.removeAllPrimary(object);

			for (var i in children)
			{
				var child = children[i];

				this.disposeObject(child);}

			if (WeaveAPI.debugAsyncStack && linkableObject)
			{
				var error = new Error("This is the stack trace from when the object was previously disposed.");
				objectCC.addImmediateCallback(null, __localFn0__);
			}
			this._treeCallbacks.triggerCallbacks();
		}
	};


	debugDisposedObject(disposedObject, disposedError)
	{
		var  obj;
		var  ownerPath = [];
		do
		{
			obj = this.getLinkableOwner(obj);
			if (obj)
				ownerPath.unshift(obj);
		} while (obj);

		var parents = this.d2d_child_parent.secondaryKeys(disposedObject);
		var children = this.d2d_parent_child.secondaryKeys(disposedObject);
		var sessionState = this.getSessionState(disposedObject);
		var msg = "WARNING: An object triggered callbacks after previously being disposed.";
		if (Language.is(disposedObject, ILinkableVariable))
			msg += ' (value = ' + disposedObject.getSessionState() + ')';
		JS.error(disposedError);
		JS.error(msg, disposedObject);
	};


	_getPaths(root, descendant)
	{
		var results = [];
		var parents = this.d2d_child_parent.secondaryKeys(descendant);

		for (var i in parents)
		{
			var parent = parents[i];
			{
				var  name = this._getChildPropertyName(Language.as(parent, ILinkableObject), descendant);
				if (name != null) {
					var  result = this._getPaths(root, Language.as(parent, ILinkableObject));
					if (result != null) {
						result.push(name);
						results.push(result);
					}
				}
			}
		}

		if (results.length == 0)
			return root == null ? results : null;
		return results;
	};


	_getChildPropertyName(parent, child)
	{
		if (Language.is(parent, ILinkableHashMap))
			return Language.as(parent,ILinkableHashMap).getName(child);
		var names = this.getLinkablePropertyNames(parent);
		for (var i in names)
		{
			var name = names[i];

			if (parent[name] == child)
				return name;
		}

		return null;
	};


	getPath(root, descendant)
	{
		if (!root || !descendant)
			return null;
		var tree = this.getSessionStateTree(root, null);
		var path = this._getPath(tree, descendant);
		return path;
	};


	_getPath(tree, descendant)
	{
		if (tree.data == descendant)
			return [];
		var children = tree.children;

		for (var i in children)
		{
			var child = children[i];
			{
				var path = this._getPath(child, descendant);
				if (path)
				{
					path.unshift(child.label);
					return path;
				}
			}
		}

		return null;
	};
	
	getObject(root, path) 
	{
		if (!path)
			return null;
		var object = root;
		let pathLength = path.length;
		for (var  i = 0; i < pathLength; i++) 
		{
			var  propertyName = path[i];
			if (object == null || this.map_disposed.get(object))
				return null;
			if (Language.is(object, ILinkableHashMap)) 
			{
				//todo: why property name is going to be number?
				if (Language.is(propertyName, Number))
					object = object.getObjects()[propertyName];
				else
					object = object.getObject(String(propertyName));
			} 
			else if (Language.is(object, ILinkableDynamicObject)) 
			{
				object = object.internalObject;
			} 
			else if (Language.is(object[propertyName], ILinkableObject)) 
			{
				object = object[propertyName];
			} 
			else 
			{
				if (Language.is(object, ILinkableObjectWithNewPaths) || JS.hasProperty(object, SessionManager.DEPRECATED_PATH_REWRITE))
				{
					var rewrittenPath = object[SessionManager.DEPRECATED_PATH_REWRITE](path.slice(i));
					if (rewrittenPath)
						return this.getObject(object, rewrittenPath);
				}
				if (Language.is(object,ILinkableObjectWithNewProperties) || JS.hasProperty(object, SessionManager.DEPRECATED_STATE_MAPPING))
					return this.getObjectFromDeprecatedPath(object[SessionManager.DEPRECATED_STATE_MAPPING], path, i);
				return null;
			}
		}
		return this.map_disposed.get(object) ? null : object;
	};


	getObjectFromDeprecatedPath(mapping, path, startAtIndex)
	{
		var object;
		if (Language.is(mapping, Array))
		{
			for (var i in mapping)
			{
				var item = mapping[i];
				{
					object = this.getObjectFromDeprecatedPath(item, path, startAtIndex);
					if (object)
						return object;
				}
			}

			return null;
		}
		let pathLength = path.length;
		for (var  i = startAtIndex; i < pathLength; i++)
		{
			if (!mapping || typeof(mapping) !== 'object')
				return null;
			mapping = mapping[path[i]];

			object = Language.as(mapping, ILinkableObject);
			if (object)
				return i + 1 == pathLength ? object : this.getObject(object, path.slice(i + 1));
		}
		return null;
	};




	linkSessionState(primary, secondary)
	{
		var self = this;
		var  __localFn0__ = function() {
			self.setSessionState(primary, self.getSessionState(secondary), true);
		}

		var  __localFn1__ = function() {
			self.setSessionState(secondary, self.getSessionState(primary), true);
		}
		if (primary == null || secondary == null)
		{
			JS.error("SessionManager.linkSessionState(): Parameters to this function cannot be null.");
			return;
		}
		if (primary == secondary)
		{
			JS.error("Warning! Attempt to link session state of an object with itself");
			return;
		}
		if (Language.is(this.d2d_lhs_rhs_setState.get(primary, secondary), Function))
			return;
		var setPrimary = __localFn0__;
		var setSecondary = __localFn1__;
		this.d2d_lhs_rhs_setState.set(primary, secondary, setPrimary);
		this.d2d_lhs_rhs_setState.set(secondary, primary, setSecondary);
		this.getCallbackCollection(secondary).addImmediateCallback(primary, setPrimary);
		this.getCallbackCollection(primary).addImmediateCallback(secondary, setSecondary, true);
	};


	unlinkSessionState(first, second)
	{
		if (first == null || second == null) {
			JS.error("SessionManager.unlinkSessionState(): Parameters to this function cannot be null.");
			return;
		}
		var setFirst = Language.as(this.d2d_lhs_rhs_setState.remove(first, second), Function);
		var setSecond = Language.as(this.d2d_lhs_rhs_setState.remove(second, first), Function);
		this.getCallbackCollection(second).removeCallback(first, setFirst);
		this.getCallbackCollection(first).removeCallback(second, setSecond);
	};


	computeDiff(oldState, newState)
	{
		if (oldState == null)
			oldState = null;
		if (newState == null)
			newState = null;
		var type = typeof(oldState);
		var  diffValue;
		if (typeof(newState) != type)
			return JS.copyObject(newState);

		if (type == 'xml')
		{
			throw new Error("XML is not supported as a primitive session state type.");
		}
		else if (type == 'number')
		{
			if (isNaN(Language.as(oldState, Number)) && isNaN(Language.as(newState, Number)))
				return undefined;
			if (oldState != newState)
				return newState;
			return undefined;
		}
		else if (oldState === null || newState === null || type != 'object')
		{
			if (oldState !== newState)
				return JS.copyObject(newState);
			return undefined;
		}
		else if (Language.is(oldState, Array) && Language.is(newState, Array))
		{
			if (!DynamicState.isDynamicStateArray(oldState) && !DynamicState.isDynamicStateArray(newState))
			{
				if (StandardLib.compare(oldState, newState) == 0)
					return undefined;
				return JS.copyObject(newState);
			}
			var i;
			var typedState;
			var changeDetected = false;
			var oldLookup = {};
			var objectName;
			var className;
			var sessionState;
			
			let oldStateLength =  oldState.length;
			let newStateLength =  newState.length;
			let DynStateObjName = DynamicState.OBJECT_NAME ;
			let DynStateClassName = DynamicState.CLASS_NAME ;
			let DynStateSessionState = DynamicState.SESSION_STATE ;
			
			for (i = 0; i < oldStateLength; i++)
			{
				typedState = oldState[i];
				objectName = typedState[DynStateObjName];
				oldLookup[objectName || ''] = typedState;
			}
			
			if (oldStateLength != newStateLength)
				changeDetected = true;

			var result = [];
			for (i = 0; i < newStateLength; i++)
			{
				typedState = newState[i];
				objectName = typedState[DynStateObjName];
				className = typedState[DynStateClassName];
				sessionState = typedState[DynStateSessionState];
				var oldTypedState = oldLookup[objectName || ''];
				delete oldLookup[objectName || ''];

				if (oldTypedState != null && oldTypedState[DynStateClassName] == className)
				{
					className = null;
					diffValue = this.computeDiff(oldTypedState[DynStateSessionState], sessionState);
					if (diffValue === undefined) {
						result.push(objectName);
						if (!changeDetected && oldState[i][DynStateObjName] != objectName)
							changeDetected = true;
						continue;
					}
					sessionState = diffValue;
				}
				else
				{
					sessionState = JS.copyObject(sessionState);
				}
				result.push(DynamicState.create(objectName || null, className, sessionState));
				changeDetected = true;
			}

			for (objectName in oldLookup)
			{
				result.push(DynamicState.create(objectName || null, SessionManager.DIFF_DELETE));
				changeDetected = true;
			}

			if (changeDetected)
				return result;
			return undefined;
		}
		else
		{
			var diff = undefined;
			for (var oldName in oldState)
			{
				diffValue = this.computeDiff(oldState[oldName], newState[oldName]);
				if (diffValue !== undefined)
				{
					if (!diff)
						diff = {};
					if (newState.hasOwnProperty(oldName))
						diff[oldName] = diffValue;
					else
						diff[oldName] = undefined;
				}
			}
			for (var newName in newState)
			{
				if (oldState[newName] === undefined && newState[newName] !== undefined)
				{
					if (!diff)
						diff = {};
					diff[newName] = JS.copyObject(newState[newName]);
				}
			}
			return diff;
		}
	};


	combineDiff(baseDiff, diffToAdd)
	{
		if (baseDiff == null)
			baseDiff = null;
		if (diffToAdd == null)
			diffToAdd = null;
		var baseType = typeof(baseDiff);
		var diffType = typeof(diffToAdd);
		if (baseDiff == null || diffToAdd == null || baseType != diffType || baseType != 'object')
		{
			baseDiff = JS.copyObject(diffToAdd);
		}
		else if (Language.is(baseDiff, Array) && Language.is(diffToAdd, Array))
		{
			var i;
			if (DynamicState.isDynamicStateArray(baseDiff) || DynamicState.isDynamicStateArray(diffToAdd))
			{
				var typedState;
				var objectName;
				var baseLookup = {};
				for (i = 0; i < baseDiff.length; i++)
				{
					typedState = baseDiff[i];
					if (Language.is(typedState, String) || typedState == null)
						objectName = typedState;
					else
						objectName = Language.as(typedState[DynamicState.OBJECT_NAME], String);
					baseLookup[objectName] = typedState;
					baseDiff[i] = objectName;
				}

				for (i = 0; i < diffToAdd.length; i++)
				{
					typedState = diffToAdd[i];
					if (Language.is(typedState, String) || typedState == null)
						objectName = Language.as(typedState, String);
					else
						objectName = Language.as(typedState[DynamicState.OBJECT_NAME], String);

					if (baseLookup.hasOwnProperty(objectName))
					{
						for (var j = Language.as(baseDiff, Array).indexOf(objectName); j < baseDiff.length - 1; j++)
							baseDiff[j] = baseDiff[j + 1];
						baseDiff[baseDiff.length - 1] = objectName;
					}
					else
					{
						baseDiff.push(objectName);
					}

					var oldTypedState = baseLookup[objectName];
					if (Language.is(oldTypedState, String) || oldTypedState == null)
					{
						baseLookup[objectName] = JS.copyObject(typedState);
					}
					else if (!(Language.is(typedState, String) || typedState == null))
					{
						var className = typedState[DynamicState.CLASS_NAME];
						if (className && className != oldTypedState[DynamicState.CLASS_NAME])
						{
							baseLookup[objectName] = JS.copyObject(typedState);
						}
						else
						{
							oldTypedState[DynamicState.SESSION_STATE] = this.combineDiff(oldTypedState[DynamicState.SESSION_STATE], typedState[DynamicState.SESSION_STATE]);
						}
					}
				}
				for (i = 0; i < baseDiff.length; i++)
					baseDiff[i] = baseLookup[baseDiff[i]];
			}
			else
			{
				i = baseDiff.length = diffToAdd.length;
				while (i--)
				{
					var value = diffToAdd[i];
					if (value == null || typeof(value) != 'object')
						baseDiff[i] = value;
					else
						baseDiff[i] = this.combineDiff(baseDiff[i], value);
				}
			}
		}
		else
		{
			for (var  newName in diffToAdd)
				baseDiff[newName] = this.combineDiff(baseDiff[newName], diffToAdd[newName]);
		}
		return baseDiff;
	};


	testDiff()
	{
		var states = [[{objectName:'a', className:'aClass', sessionState:'aVal'}, {objectName:'b', className:'bClass', sessionState:'bVal1'}], [{objectName:'b', className:'bClass', sessionState:'bVal2'}, {objectName:'a', className:'aClass', sessionState:'aVal'}], [{objectName:'a', className:'aNewClass', sessionState:'aVal'}, {objectName:'b', className:'bClass', sessionState:null}], [{objectName:'b', className:'bClass', sessionState:null}]];
		var diffs = [];
		var combined = [];
		var baseDiff = null;
		for (var i = 1; i < states.length; i++)
		{
			var  diff = this.computeDiff(states[i - 1], states[i]);
			diffs.push(diff);
			baseDiff = this.combineDiff(baseDiff, diff);
			combined.push(JS.copyObject(baseDiff));
		}
		JS.log('diffs', diffs);
		JS.log('combined', combined);
	};



	/**
	 * Reflection
	 *
	 * @return {Object.<string, Function>}
	 */
	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'newLinkableChild': { type: '*', declaredBy: 'SessionManager'},
					'registerLinkableChild': { type: '*', declaredBy: 'SessionManager'},
					'newDisposableChild': { type: '*', declaredBy: 'SessionManager'},
					'registerDisposableChild': { type: '*', declaredBy: 'SessionManager'},
					'unregisterLinkableChild': { type: 'void', declaredBy: 'SessionManager'},
					'excludeLinkableChildFromSessionState': { type: 'void', declaredBy: 'SessionManager'},
					'getOwner': { type: 'Object', declaredBy: 'SessionManager'},
					'getLinkableOwner': { type: 'ILinkableObject', declaredBy: 'SessionManager'},
					'getSessionStateTree': { type: 'WeaveTreeItem', declaredBy: 'SessionManager'},
					'getTypedStateTree': { type: 'Object', declaredBy: 'SessionManager'},
					'addTreeCallback': { type: 'void', declaredBy: 'SessionManager'},
					'removeTreeCallback': { type: 'void', declaredBy: 'SessionManager'},
					'copySessionState': { type: 'void', declaredBy: 'SessionManager'},
					'setSessionState': { type: 'void', declaredBy: 'SessionManager'},
					'getSessionState': { type: 'Object', declaredBy: 'SessionManager'},
					'getLinkablePropertyNames': { type: 'Array', declaredBy: 'SessionManager'},
					'getLinkableDescendants': { type: 'Array', declaredBy: 'SessionManager'},
					'assignBusyTask': { type: 'void', declaredBy: 'SessionManager'},
					'unassignBusyTask': { type: 'void', declaredBy: 'SessionManager'},
					'linkableObjectIsBusy': { type: 'Boolean', declaredBy: 'SessionManager'},
					'getCallbackCollection': { type: 'ICallbackCollection', declaredBy: 'SessionManager'},
					'getLinkableObjectFromCallbackCollection': { type: 'ILinkableObject', declaredBy: 'SessionManager'},
					'objectWasDisposed': { type: 'Boolean', declaredBy: 'SessionManager'},
					'disposeObject': { type: 'void', declaredBy: 'SessionManager'},
					'_getPaths': { type: 'Array', declaredBy: 'SessionManager'},
					'getPath': { type: 'Array', declaredBy: 'SessionManager'},
					'getObject': { type: 'ILinkableObject', declaredBy: 'SessionManager'},
					'linkSessionState': { type: 'void', declaredBy: 'SessionManager'},
					'unlinkSessionState': { type: 'void', declaredBy: 'SessionManager'},
					'computeDiff': { type: '*', declaredBy: 'SessionManager'},
					'combineDiff': { type: 'Object', declaredBy: 'SessionManager'},
					'testDiff': { type: 'void', declaredBy: 'SessionManager'}
				};
			}
		};
	};

}

SessionManager.prototype.CLASS_INFO = { names: [{ name: 'SessionManager', qName: 'SessionManager'}], interfaces: [ISessionManager] };

SessionManager.debugUnbusy = false;
SessionManager.DEPRECATED_STATE_MAPPING = 'deprecatedStateMapping';
SessionManager.DEPRECATED_PATH_REWRITE = 'deprecatedPathRewrite';
SessionManager.LINKABLE_PROPERTIES = 'linkableProperties';
SessionManager.DISPOSE = "dispose";


/**
 * Uses DynamicState.traverseState() to traverse a state and copy portions of the state to ILinkableObjects.
 */
SessionManager.traverseAndSetState = function(state, mapping, removeMissingDynamicObjects)
{
	removeMissingDynamicObjects = typeof removeMissingDynamicObjects !== 'undefined' ? removeMissingDynamicObjects : true;
	var ilo = Language.as(mapping, ILinkableObject);
	if (ilo) 
	{
		Weave.setState(ilo, state, removeMissingDynamicObjects);
	} 
	else if (Language.is(mapping, Function)) 
	{
		mapping(state, removeMissingDynamicObjects);
	} 
	else if (Language.is(mapping, Array)) 
	{
		for (var i in mapping)
		{
			var item = mapping[i];
			SessionManager.traverseAndSetState(state, item, removeMissingDynamicObjects);
		}

	} 
	else if (state && typeof(state) === 'object' && typeof(mapping) === 'object')
	{
		for (var key in mapping) 
		{
			var value = DynamicState.traverseState(state, [key]);
			if (value !== undefined)
				SessionManager.traverseAndSetState(value, mapping[key], removeMissingDynamicObjects);
		}
	}
};


SessionManager.DIFF_DELETE = 'delete';






