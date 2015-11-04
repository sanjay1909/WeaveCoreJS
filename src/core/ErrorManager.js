if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function ErrorManager() {
        weavecore.ILinkableObject.call(this);
        this._errors = [];
        Object.defineProperty(this, 'errors', {
            get: function () {
                return this._errors;
            }
        });

    }

    ErrorManager.prototype = new weavecore.ILinkableObject();
    ErrorManager.prototype.constructor = ErrorManager;
    var p = ErrorManager.prototype;

    p.reportError = function (error, faultMessage, faultContent) {
        faultMessage = (faultMessage === undefined) ? null : faultMessage;
        faultContent = (faultContent === undefined) ? null : faultContent;

        if (typeof (error) === 'string') {
            error = new Error(error);
        }

        this._errors.push(error);
        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();

    }

    weavecore.ErrorManager = ErrorManager;
    weavecore.ClassUtils.registerClass('weavecore.ErrorManager', ErrorManager);
    WeaveAPI.ErrorManager = new ErrorManager();

}());
