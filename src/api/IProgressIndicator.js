/**
 * @interface
 * @extends {weavecore.ILinkableObject}
 */
weavecore.IProgressIndicator = function () {};
weavecore.IProgressIndicator.prototype.getTaskCount = function () {};
weavecore.IProgressIndicator.prototype.addTask = function (taskToken, busyObject, description) {};
weavecore.IProgressIndicator.prototype.hasTask = function (taskToken) {};
weavecore.IProgressIndicator.prototype.updateTask = function (taskToken, progress) {};
weavecore.IProgressIndicator.prototype.removeTask = function (taskToken) {};
weavecore.IProgressIndicator.prototype.getNormalizedProgress = function () {};


/**
 * Metadata
 *
 * @type {Object.<string, Array.<Object>>}
 */
weavecore.IProgressIndicator.prototype.CLASS_INFO = {
    names: [{
        name: 'IProgressIndicator',
        qName: 'weavecore.IProgressIndicator'
    }],
    interfaces: [weavecore.ILinkableObject]
};
