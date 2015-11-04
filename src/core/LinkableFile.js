if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableString that handles the process of managing a promise for file content from a URL.
 * @author pkovac
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFile, 'NS', {
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
    Object.defineProperty(LinkableFile, 'CLASS_NAME', {
        value: 'LinkableFile'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFile, 'SESSIONABLE', {
        value: true
    });

    function LinkableFile(defaultValue, taskDescription) {
        // set default values for Parameters
        if (defaultValue === undefined) defaultValue = null;
        if (taskDescription === undefined) taskDescription = null;

        // Note: Calling  weavecore.LinkableVariable.call() will set all the default values for member variables defined in the super class,
        // which means we can't set _sessionStateInternal = NaN here.
        weavecore.LinkableVariable.call(this);

        this._contentPromise = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkablePromise(requestContent.bind(this), taskDescription));
        this._url = WeaveAPI.SessionManager.registerLinkableChild(this._contentPromise, new weavecore.LinkableString(defaultValue));

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._url.value;
            },
            set: function (new_value) {
                this._url.value = new_value;
            }

        });

        Object.defineProperty(this, 'result', {
            get: function () {
                return this._contentPromise.result;
            }

        });

        Object.defineProperty(this, 'error', {
            get: function () {
                return this._contentPromise.error;
            }

        });

    }

    function requestContent() {
        if (!this._url.value)
            return null;
        return WeaveAPI.URLRequestUtils.getPromise(this._contentPromise, this._url.value, null, null, null, 'binary', true);
    }

    LinkableFile.prototype = new weavecore.LinkableVariable();
    LinkableFile.prototype.constructor = LinkableFile;

    var p = LinkableFile.prototype;

    p.setSessionState = function (value) {
        this._url.setSessionState(value);
    }

    p.getSessionState = function () {
        return this._url.getSessionState();
    }




    weavecore.LinkableFile = LinkableFile;
    weavecore.ClassUtils.registerClass('weavecore.LinkableFile', LinkableFile);

}());
