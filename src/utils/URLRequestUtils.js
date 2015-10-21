if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}


(function () {

    URLRequestUtils.debug = false;
    URLRequestUtils.delayResults = false; // when true, delays result/fault handling and fills the 'delayed' Array.

    // array of objects with properties:  label:String, resume:Function
    Object.defineProperty(URLRequestUtils, 'delayed', {
        value: []
    });


    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_TEXT', {
        value: 'text'
    });

    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_BINARY', {
        value: 'binary'
    });
    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_VARIABLES', {
        value: 'variables'
    });

    Object.defineProperty(URLRequestUtils, 'LOCAL_FILE_URL_SCHEME', {
        value: 'local://'
    });




    function URLRequestUtils(defaultValue, taskDescription) {
        /**
         * A mapping of URL Strings to CustomXMLHttpRequest.
         * This mapping is necessary for cached requests to return the active request.
         */
        Object.defineProperty(this, '_requestURLToLoader', {
            value: {}
        });

        this._localFiles = {};
        this._baseURL;

    }

    var p = URLRequestUtils.prototype;

    /**
     * This will set the base URL for use with relative URL requests.
     */
    p.setBaseURL = function (baseURL) {
        // only set baseURL if there is a ':' before first '/'
        if (baseURL.split('/')[0].indexOf(':') >= 0) {
            // remove '?' and everything after
            this._baseURL = baseURL.split('?')[0];
        }
    }


    function addBaseURL(url) {
        if (this._baseURL)
            url = weavecore.URLUtil.getFullURL(this._baseURL, url);
    }



    p.getPromise = function (relevantContext, url, data, method, requestHeaders, dataFormat, allowMultipleEvents) {

        allowMultipleEvents = allowMultipleEvents === undefined ? false : allowMultipleEvents;

        var client;

        if (url.indexOf(URLRequestUtils.LOCAL_FILE_URL_SCHEME) === 0) {
            var fileName = url.substr(URLRequestUtils.LOCAL_FILE_URL_SCHEME.length);
            // If it's a local file, we still need to create a promise.
            // CustomURLLoader doesn't load if the last parameter to the constructor is false.
            if (allowMultipleEvents)
                client = this._requestURLToLoader[url];
            if (!client) {
                client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, false);
                if (allowMultipleEvents)
                    this._requestURLToLoader[url] = client;
            }
            client.promise.addRelevantContext(relevantContext);
            if (this._localFiles.hasOwnProperty(fileName)) {
                WeaveAPI.StageUtils.callLater(relevantContext, client.applyResult.bind(client), [this._localFiles[fileName]]);
            } else {
                fault = "Error: Missing local file: " + fileName;
                WeaveAPI.StageUtils.callLater(relevantContext, client.applyFault.bind(client), [fault]);
            }

            return client.promise;

        }

        addBaseURL.call(this, url);

        // attempt to load crossdomain.xml from same folder as file
        //Security.loadPolicyFile(URLUtil.getFullURL(request.url, 'crossdomain.xml'));

        try {
            client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, true);
        } catch (e) {
            // When an error occurs, we need to run the asyncFaultHandler later
            // and return a new URLLoader. CustomURLLoader doesn't load if the
            // last parameter to the constructor is false.
            client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, false);

            WeaveAPI.StageUtils.callLater(relevantContext, client.applyFault.bind(client), [e]);
        }

        client.promise.addRelevantContext(relevantContext);

        return client.promise;



    }


    weavecore.URLRequestUtils = URLRequestUtils;
    WeaveAPI.URLRequestUtils = new URLRequestUtils();






}());

(function () {
    /**
     * Lookup for hosts that previously failed due to crossdomain.xml security error
     */
    Object.defineProperty(CustomClient, '_failedHosts', {
        value: {} // host -> true
    });

    /**
     * Maps a status code to a description.
     */
    Object.defineProperty(CustomClient, 'HTTP_STATUS_CODES', {
        value: {
            "100": "Continue",
            "101": "Switching Protocol",
            "200": "OK",
            "201": "Created",
            "202": "Accepted",
            "203": "Non-Authoritative Information",
            "204": "No Content",
            "205": "Reset Content",
            "206": "Partial Content",
            "300": "Multiple Choice",
            "301": "Moved Permanently",
            "302": "Found",
            "303": "See Other",
            "304": "Not Modified",
            "305": "Use Proxy",
            "306": "unused",
            "307": "Temporary Redirect",
            "308": "Permanent Redirect",
            "400": "Bad Request",
            "401": "Unauthorized",
            "402": "Payment Required",
            "403": "Forbidden",
            "404": "Not Found",
            "405": "Method Not Allowed",
            "406": "Not Acceptable",
            "407": "Proxy Authentication Required",
            "408": "Request Timeout",
            "409": "Conflict",
            "410": "Gone",
            "411": "Length Required",
            "412": "Precondition Failed",
            "413": "Request Entity Too Large",
            "414": "Request-URI Too Long",
            "415": "Unsupported Media Type",
            "416": "Requested Range Not Satisfiable",
            "417": "Expectation Failed",
            "500": "Internal Server Error",
            "501": "Not Implemented",
            "502": "Bad Gateway",
            "503": "Service Unavailable",
            "504": "Gateway Timeout",
            "505": "HTTP Version Not Supported"
        }
    });

    function CustomClient(url, data, method, requestHeaders, dataFormat, loadNow) {

        method = method === null ? 'GET' : method;
        this._label;
        this._customPromise;
        this._isClosed = false;
        this._url = url;
        this._method = method;
        this._requestHeaders = requestHeaders;
        this.data = data;

        //XMLHttpRequest is a host object(DOM objects) so we cant extend using prototype
        Object.defineProperty(this, 'client', {
            value: new XMLHttpRequest()
        })

        //var ie9_XHR = window.XDomainRequest;
        //var XHR = ie9_XHR || XMLHttpRequest;
        //XHR.call(this);

        this._resumeFunc = null;
        this._resumeParam = null;


        this._resolve;
        this._reject;
        this._customPromise = new weavecore.CustomPromise(this, function (_resolve, _reject) {
            this._resolve = _resolve;
            this._reject = _reject;
        }.bind(this));
        /**
         * This is the promise that keeps track of repsonders.
         */
        Object.defineProperty(this, 'promise', {
            get: function () {
                return this._customPromise
            }
        });

        /**
         * list of function gets executed for promise then
         */
        Object.defineProperty(this, 'responders', {
            value: []
        });

        /**
         * This is the URLRequest that was passed to load().
         */
        Object.defineProperty(this, 'url', {
            get: function () {
                return this._url
            }
        });


        /**
         * Gets the open or closed status of the URLLoader.
         */
        Object.defineProperty(this, 'isClosed', {
            get: function () {
                return this._isClosed
            }
        });


        if (loadNow) {
            if (weavecore.URLRequestUtils.delayResults) {
                label = url;
                //to-do : change to binary data temporary solution JSON string
                try {
                    var stringData = JSON.stringify(data);
                    label += ' ' + stringData.split('\n').join(' ');
                } catch (e) {}
                console.log('requested ' + label);
                URLRequestUtils.delayed.push({
                    "label": label,
                    "resume": resume
                });
            }

            /*if (CustomClient._failedHosts[getHost()]) {
                // don't bother trying a URLLoader with the same host that previously failed due to a security error
                ExternalDownloader.download(_urlRequest, dataFormat, _asyncToken);
                return;
            }*/

            for (var name in requestHeaders)
                this.client.setRequestHeader(name, requestHeaders[name], false);

            this.client.responseType = "blob";

            var done = false;
            var customClient = this;
            this.client.onload = function (event) {
                Blob_to_b64(customClient.client.response, function (b64) {
                    callback.call(customClient, customClient.client.status, b64);
                    done = true;
                });
            };
            this.client.onerror = function (event) {
                if (!done)
                    callback.call(customClient, customClient.client.status, null);
                done = true;
            };
            this.client.onreadystatechange = function () {
                if (customClient.client.readyState == 4 && customClient.client.status != 200) {
                    setTimeout(
                        function () {
                            if (!done)
                                callback.call(customClient, customClient.client.status, null);
                            done = true;
                        },
                        1000
                    );
                }
            };




            if (weavecore.URLRequestUtils.debug)
                console.log(this, 'request', url);

            this.client.open(method, url, true);
            var data = null;
            if (method == "POST" && base64data) {
                data = weave.b64_to_ArrayBuffer(base64data);
                this.client.send(data);
            } else {
                this.client.send();
            }


        }

        this.promise.internal.then(function (response) {
            handleGetResult.call(this, response);
        }.bind(this), function (response) {
            handleGetError.call(response);
        }.bind(this))
    }

    function decodeResponse(response) {
        var dataView = new DataView(response);
        // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
        var decoder = new TextDecoder('utf-8');
        return decoder.decode(dataView);
    }

    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    function callback(status, base64data) {
        var result;
        if (base64data) {
            var bytes = b64_to_ArrayBuffer(base64data);
            result = decodeResponse(bytes);

        }
        if (status === 200) {
            this._resolve(result);
        } else {
            var faultCode = null;
            if (CustomClient.HTTP_STATUS_CODES[status])
                faultCode = status + " " + CustomClient.HTTP_STATUS_CODES[status];
            else if (status)
                faultCode = "" + status;
            else
                faultCode = "Error";
            this._reject(faultCode);
        }
    }

    function b64_to_ArrayBuffer(base64data) {
        var byteCharacters = atob(base64data);
        var myArray = new ArrayBuffer(byteCharacters.length);
        var longInt8View = new Uint8Array(myArray);
        for (var i = 0; i < byteCharacters.length; i++)
            longInt8View[i] = byteCharacters.charCodeAt(i);
        return myArray;
    };

    function Blob_to_b64(blob, callback) {
        var reader = new FileReader();
        reader.onloadend = function (event) {
            var dataurl = reader.result;
            var base64data = dataurl.split(',').pop();
            callback(base64data);
        };
        reader.onerror = function (event) {
            callback(null);
        };
        reader.readAsDataURL(blob);
    };



    function loadLater() {
        if (!this._isClosed) {
            this.open(this._method, this.url, true);
            this.send();
        }

    }

    function getHost() {
        var start = this.url.indexOf("/") + 2;
        var length = this.url.indexOf("/", start);
        var host = this.url.substr(0, length);
        return host;
    }

    var p = CustomClient.prototype;

    p.close = function () {
        WeaveAPI.ProgressIndicator.removeTask(this._customPromise);
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'cancel', this._url);
        this._isClosed = true;
        try {
            this.client.abort();
        } catch (e) {

        } // ignore close() errors
    }

    /**
     * This provides a convenient way for adding result/fault handlers.
     * @param responder
     */
    p.addResponder = function (responder) {
        this.promise.responders.push(responder);
    }

    /**
     * This provides a convenient way to remove a URLRequestToken as a responder.
     * @param responder
     */
    p.removeResponder = function (responder) {
        var responders = this.promise.responders;
        var index = responders.indexOf(responder);
        if (index >= 0) {
            // URLRequestToken found -- remove it
            responders.splice(index, 1);
            /*// see if there are any more URLRequestTokens
            for (var i = 0; i < responders.length; i++) {
                if (obj.isCustomResponder)
                    return;
            }*/

            // no more CustomAsyncResponders found, so cancel
            this.close();
        }
    }


    /**
     * When URLRequestUtils.delayResults is set to true, this function will resume
     * @return true
     */
    p.resume = function () {
        if (this._resumeFunc === null) {
            this._resumeFunc = resume; // this cancels the pending delay behavior
        } else if (this._resumeFunc !== resume) {
            this._resumeFunc(this._resumeParam);
        }
    }

    function handleGetResult(response) {
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'complete', this.url);
        if (weavecore.URLRequestUtils.delayResults && this._resumeFunc == null) {
            this._resumeFunc = handleGetResult;
            this._resumeParam = response;
            return;
        }

        // broadcast result to responders
        WeaveAPI.StageUtils.callLater(null, this.applyResult.bind(this), [response]);

    }

    /**
     * This function gets called when a URLLoader generated by getURL() dispatches an IOErrorEvent.
     * @param event The ErrorEvent from a URLLoader.
     */
    function handleGetError(fault) {
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'error', this.url);
        if (weavecore.URLRequestUtils.delayResults && this._resumeFunc == null) {
            this._resumeFunc = handleGetError;
            this._resumeParam = fault;
            return;
        }

        // broadcast fault to responders

        fault = fault ? fault : "Request cancelled";

        applyFault(fault);
        this._isClosed = true;
    }

    p.applyResult = function (data) {
        if (this.data !== data)
            this.data = data;
        this.promise.applyResult(data);
    }

    p.applyFault = function (fault) {
        this.promise.applyFault(fault);
    }



    weavecore.CustomClient = CustomClient;

}());

(function () {
    function CustomPromise(client, executor) {
        /*if (window.Promise) {
            try {
                window.Promise.call(this, executor);
            } catch (e) {
                console.error(e);
            }

        } else {
            console.warn("Promise Object Prototype not Found");
            return;
        }*/

        Object.defineProperty(this, 'internal', {
            value: new Promise(executor)
        });

        this._client = client;
        this._relevantContexts = [];

        Object.defineProperty(this, 'responders', {
            value: []
        });

        Object.defineProperty(this, 'client', {
            get: function () {
                return this._client
            }
        });

        this.addResponder({
            result: firstResponder.bind(this),
            fault: firstResponder.bind(this),
            token: null
        });

    }

    var p = CustomPromise.prototype;

    //responder {result:Function, fault:Function, token:Object}
    p.addResponder = function (responder) {
        this.responders.push(responder);
    }

    /**
     * Adds a context in which this AsyncToken is relevant.
     * If all contexts are disposed, this AsyncToken will not broadcast a ResultEvent or FaultEvent.
     */
    p.addRelevantContext = function (context) {
        var desc = "URL request";
        if (this.client)
            desc += ": " + this.client.url;
        WeaveAPI.ProgressIndicator.addTask(this, context, desc);
        this._relevantContexts.push(context);
    }

    p.applyResult = function (response) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].result(response, this.responders[i].token);
        }

    }

    p.applyFault = function (response) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].fault(response, this.responders[i].token);
        }
    }

    function contextDisposed(context, i, a) {
        return WeaveAPI.SessionManager.objectWasDisposed(context);
    }

    function firstResponder(response, token) {
        WeaveAPI.ProgressIndicator.removeTask(this);
        // if there are contexts and none are relevant, don't call responders
        if (this._relevantContexts.length && this._relevantContexts.every(contextDisposed))
            this._responders.length = 0;
    }

    weavecore.CustomPromise = CustomPromise;

}());
