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


    function LinkableFile(defaultValue, taskDescription) {
        // set default values for Parameters
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : null;
        taskDescription = typeof taskDescription !== 'undefined' ? taskDescription : null;

        this.contentPromise = WeaveAPI.linkableChild(this, new weavecore.LinkablePromise(this.requestContent, taskDescription));
        this.url = WeaveAPI.linkableChild(this.contentPromise, new weavecore.LinkableString(defaultValue));

    }

    var p = LinkableFile.prototype;
    /**
     * @private
     * @type {weavecore.LinkablePromise}
     */
    p.contentPromise;


    /**
     * @private
     * @type {weavecore.Linkablestring}
     */
    p.url;


    Object.defineProperties(p, {
        result: {
            get: function () {
                return this.contentPromise.result;
            }
        },
        error: {
            get: function () {
                return this.contentPromise.error;
            }
        },
        value: {
            get: function () {
                return this.url.value;
            },
            set: function (new_value) {
                this.url.value = new_value;
            }
        }
    });

    p.requestContent = function () {
        if (!this.url.value)
            return null;
        return WeaveAPI.URLRequestUtils.getPromise(this._contentPromise, this.url.value, null, null, null, 'binary', true);
    }

    p.setSessionState = function (value) {
        this.url.setSessionState(value);
    }

    p.getSessionState = function () {
        return this.url.getSessionState();
    }




    weavecore.LinkableFile = LinkableFile;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.pCLASS_INFO = {
        names: [{
            name: 'LinkableFile',
            qName: 'weavecore.LinkableFile'
        }],
        interfaces: [weavecore.ILinkableVariable]
    };


}());
