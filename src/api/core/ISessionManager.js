export default class ISessionManager
{
	constructor()
	{
	}

	getCallbackCollection(linkableObject){};
	getLinkableObjectFromCallbackCollection(callbackCollection) {};
	newLinkableChild(linkableParent, linkableChildType, callback, useGroupedCallback) {};
	registerLinkableChild(linkableParent, linkableChild, callback, useGroupedCallback) {};
	newDisposableChild(disposableParent, disposableChildType) {};
	registerDisposableChild(disposableParent, disposableChild) {};
	getOwner(child) {};
	getLinkableOwner(child) {};
	getLinkableDescendants(root, filter) {};
	assignBusyTask(taskToken, busyObject) {};
	unassignBusyTask(taskToken) {};
	linkableObjectIsBusy(linkableObject) {};
	setSessionState(linkableObject, newState, removeMissingDynamicObjects) {};
	getSessionState(linkableObject) {};
	computeDiff(oldState, newState) {};
	combineDiff(baseDiff, diffToAdd) {};
	copySessionState(source, destination) {};
	linkSessionState(primary, secondary) {};
	unlinkSessionState(first, second) {};
	disposeObject(object) {};
	objectWasDisposed(object) {};
	getPath(root, descendant) {};
	getObject(root, path) {};

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
					'getCallbackCollection': { type: 'ICallbackCollection', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getLinkableObjectFromCallbackCollection': { type: 'ILinkableObject', declaredBy: 'weavejs.api.core.ISessionManager'},
					'newLinkableChild': { type: '*', declaredBy: 'weavejs.api.core.ISessionManager'},
					'registerLinkableChild': { type: '*', declaredBy: 'weavejs.api.core.ISessionManager'},
					'newDisposableChild': { type: '*', declaredBy: 'weavejs.api.core.ISessionManager'},
					'registerDisposableChild': { type: '*', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getOwner': { type: 'Object', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getLinkableOwner': { type: 'ILinkableObject', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getLinkableDescendants': { type: 'Array', declaredBy: 'weavejs.api.core.ISessionManager'},
					'assignBusyTask': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'unassignBusyTask': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'linkableObjectIsBusy': { type: 'Boolean', declaredBy: 'weavejs.api.core.ISessionManager'},
					'setSessionState': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getSessionState': { type: 'Object', declaredBy: 'weavejs.api.core.ISessionManager'},
					'computeDiff': { type: '*', declaredBy: 'weavejs.api.core.ISessionManager'},
					'combineDiff': { type: 'Object', declaredBy: 'weavejs.api.core.ISessionManager'},
					'copySessionState': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'linkSessionState': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'unlinkSessionState': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'disposeObject': { type: 'void', declaredBy: 'weavejs.api.core.ISessionManager'},
					'objectWasDisposed': { type: 'Boolean', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getPath': { type: 'Array', declaredBy: 'weavejs.api.core.ISessionManager'},
					'getObject': { type: 'ILinkableObject', declaredBy: 'weavejs.api.core.ISessionManager'}
				};
			}
		};
	};

}

ISessionManager.prototype.CLASS_INFO = { names: [{ name: 'ISessionManager', qName: 'weavejs.api.core.ISessionManager'}] };

