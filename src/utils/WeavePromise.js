if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    /**
     * Use this when you need a Promise chain to depend on ILinkableObjects and resolve multiple times.
     *
     * Adds support for <code>depend(...linkableObjects)</code>
     * @param relevantContext This parameter may be null.  If the relevantContext object is disposed, the promise will be disabled.
     * @param resolver A function like function(resolve:Function, reject:Function):void which carries out the promise
     */
    function WeavePromise(relevantContext, resolver) {
        resolver = (resolver === undefined) ? null : resolver;

        if (relevantContext instanceof WeavePromise) {
            // this is a child promise
            this._rootPromise = relevantContext._rootPromise;
            this.relevantContext = relevantContext = this._rootPromise.relevantContext;
        } else {
            // this is a new root promise
            this._rootPromise = this;
            this.relevantContext = relevantContext;

            // if resolver is not specified, immediately set the result of the root promise equal to the relevantContext
            if (resolver === null)
                this.setResult(this.relevantContext);
        }

        if (relevantContext)
            WeaveAPI.SessionManager.registerDisposableChild(relevantContext, this);

        if (resolver != null) {
            setBusy.call(this, true);
            resolver(this.setResult, this.setError);
        }
    }


    WeavePromise._noop = function (value) {
        return value;
    }

    var p = WeavePromise.prototype;

    p._rootPromise;
    p.relevantContext;
    p._result;
    p._error;
    Object.defineProperty(p, '_handlers', {
        value: []
    });
    Object.defineProperty(p, '_dependencies', {
        value: []
    });

    p.setResult = function (result) {
        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        this._result = undefined;
        this._error = undefined;

        if (result instanceof weavecore.AsyncToken) {
            result.addResponder(new weavecore.AsyncResponder(
                function (result, token) {
                    this.setResult(result);
                }.bind(this),
                function (fault, token) {
                    this.setError(fault);
                }.bind(this)
            ));
        } else if (result instanceof WeavePromise) {
            result.then(this.setResult.bind(this), this.setError.bind(this));
        } else {
            this._result = result;
            callHandlers.call(this);
        }
    }

    p.getResult = function () {
        return this._result;
    }

    p.setError = function (error) {
        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        this._result = undefined;
        this._error = error;

        callHandlers.call(this);
    }

    p.getError = function () {
        return this._error;
    }

    function setBusy(busy) {
        if (busy) {
            var context = (this.relevantContext && (this.relevantContext instanceof weavecore.ILinkableObject || this.relevantContext.sessionable)) ? this.relevantContext : null;
            WeaveAPI.ProgressIndicator.addTask(this._rootPromise, context);
        } else {
            WeaveAPI.ProgressIndicator.removeTask(this._rootPromise);
        }
    }

    function callHandlers(newHandlersOnly) {
        newHandlersOnly = (newHandlersOnly === undefined) ? false : newHandlersOnly;
        if (this._dependencies.some(WeavePromise._dependencyIsBusy)) {
            if (this._handlers.length)
                setBusy.call(this, true);
            return;
        }

        // if there are no more handlers, remove the task
        if (this._handlers.length === 0)
            setBusy.call(this, false);

        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        for (var i = 0; i < this._handlers.length; i++) {
            var handler = this._handlers[i];
            if (newHandlersOnly && handler.wasCalled)
                continue;
            if (this._result !== undefined)
                handler.onResult(this._result);
            else if (this._error !== undefined)
                handler.onError(this._error);
        }
    }

    p.then = function (onFulfilled, onRejected) {
        onFulfilled = (onFulfilled === undefined) ? null : onFulfilled;
        onRejected = (onRejected === undefined) ? null : onRejected;
        if (onFulfilled === null)
            onFulfilled = WeavePromise._noop;
        if (onRejected === null)
            onRejected = WeavePromise._noop;

        var next = new WeavePromise(this);
        next._result = undefined;
        this._handlers.push(new weavecore.Handler(onFulfilled, onRejected, next));

        if (this._result !== undefined || this._error !== undefined) {
            // callLater will not call the function if the context was disposed
            WeaveAPI.StageUtils.callLater(this.relevantContext, callHandlers.bind(this), [true]);
            setBusy.call(this, true);
        }

        return next;
    }

    p.depend = function () {
        var linkableObjects = Array.prototype.slice.call(arguments);
        if (linkableObjects.length) {
            setBusy.call(this, true);
        }
        linkableObjects.forEach(function (dependency) {
            WeaveAPI.SessionManager.getCallbackCollection(dependency).addGroupedCallback(this.relevantContext, callHandlers.bind(this), true);
        }.bind(this));
        return this;
    }

    WeavePromise._dependencyIsBusy = function (dependency, i, a) {
        return WeaveAPI.SessionManager.linkableObjectIsBusy(dependency);
    }

    p.getAsyncToken = function () {
        var asyncToken = new weavecore.AsyncToken();
        this.then(
            function (result) {
                asyncToken.applyResult(result, asyncToken);
            },
            function (error) {
                var fault = "Error: Broken promise\n" + "Content: " + error;
                asyncToken.applyFault(fault, asyncToken);
            }
        );
        return asyncToken;
    }

    p.dispose = function () {
        this._handlers.length = 0;
        setBusy.call(this, false);
    }

    weavecore.WeavePromise = WeavePromise;
    p.CLASS_INFO = {
        names: [{
            name: 'WeavePromise',
            qName: 'weavecore.WeavePromise'
        }]
    };

}());

(function () {
    function Handler(onFulfilled, onRejected, next) {
        this.next = next;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }

    var p = Handler.prototype;

    p.next;
    p.onFulfilled;
    p.onRejected;
    /**
     * Used as a flag to indicate whether or not this handler has been called
     */
    p.wasCalled = false;

    p.onResult = function (result) {
        this.wasCalled = true;
        try {
            this.next.setResult(this.onFulfilled(result));
        } catch (e) {
            this.onError(e);
        }
    }

    p.onError = function (error) {
        this.wasCalled = true;
        try {
            this.next.setError(this.onRejected(error));
        } catch (e) {
            this.next.setError(e);
        }
    }

    weavecore.Handler = Handler;

    p.CLASS_INFO = {
        names: [{
            name: 'Handler',
            qName: 'weavecore.Handler'
        }]
    };


}());


(function () {
    function AsyncToken() {

    }

    var p = AsyncToken.prototype;

    Object.defineProperty(p, 'responders', {
        value: []
    });

    p.addResponder = function (responder) {
        this.responders.push(responder);
    }

    p.applyResult = function (result) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].result(result, this.responders[i].token);
        }
    }

    p.applyFault = function (fault) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].fault(fault, this.responders[i].token);
        }
    }

    weavecore.AsyncToken = AsyncToken;
    p.CLASS_INFO = {
        names: [{
            name: 'AsyncToken',
            qName: 'weavecore.AsyncToken'
        }]
    };

}());


(function () {
    function AsyncResponder(result, fault, token) {

        this.result = result;
        this.fault = fault;
        this.token = token;

    }
    var p = AsyncResponder.prototype;
    p.result;
    p.fault;
    p.token;
    weavecore.AsyncResponder = AsyncResponder;
    p.CLASS_INFO = {
        names: [{
            name: 'AsyncResponder',
            qName: 'weavecore.AsyncResponder'
        }]
    };

}());
