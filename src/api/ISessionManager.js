/**
 * @interface
 */
weavecore.ISessionManager = function () {};
weavecore.ISessionManager.prototype.getCallbackCollection = function (linkableObject) {};
weavecore.ISessionManager.prototype.getLinkableObjectFromCallbackCollection = function (callbackCollection) {};
weavecore.ISessionManager.prototype.newLinkableChild = function (linkableParent, linkableChildType, callback, useGroupedCallback) {};
weavecore.ISessionManager.prototype.registerLinkableChild = function (linkableParent, linkableChild, callback, useGroupedCallback) {};
weavecore.ISessionManager.prototype.newDisposableChild = function (disposableParent, disposableChildType) {};
weavecore.ISessionManager.prototype.registerDisposableChild = function (disposableParent, disposableChild) {};
weavecore.ISessionManager.prototype.getLinkableOwner = function (child) {};
weavecore.ISessionManager.prototype.getLinkableDescendants = function (root, filter) {};
weavecore.ISessionManager.prototype.assignBusyTask = function (taskToken, busyObject) {};
weavecore.ISessionManager.prototype.unassignBusyTask = function (taskToken) {};
weavecore.ISessionManager.prototype.linkableObjectIsBusy = function (linkableObject) {};
weavecore.ISessionManager.prototype.setSessionState = function (linkableObject, newState, removeMissingDynamicObjects) {};
weavecore.ISessionManager.prototype.getSessionState = function (linkableObject) {};
weavecore.ISessionManager.prototype.computeDiff = function (oldState, newState) {};
weavecore.ISessionManager.prototype.combineDiff = function (baseDiff, diffToAdd) {};
weavecore.ISessionManager.prototype.copySessionState = function (source, destination) {};
weavecore.ISessionManager.prototype.linkSessionState = function (primary, secondary) {};
weavecore.ISessionManager.prototype.unlinkSessionState = function (first, second) {};
weavecore.ISessionManager.prototype.disposeObject = function (object) {};
weavecore.ISessionManager.prototype.objectWasDisposed = function (object) {};
weavecore.ISessionManager.prototype.getPath = function (root, descendant) {};
weavecore.ISessionManager.prototype.getObject = function (root, path) {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.ISessionManager.prototype.CLASS_INFO = {
    names: [{
        name: 'ISessionManager',
        qName: 'weavecore.ISessionManager'
    }]
};
