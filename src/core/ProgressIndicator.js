if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Number values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {



    Object.defineProperty(ProgressIndicator, 'debug', {
        value: false
    });

    function ProgressIndicator() {}

    var p = ProgressIndicator.prototype;

    /**
     * @private
     * @type {number}
     */
    p._taskCount = 0;


    /**
     * @private
     * @type {number}
     */
    p._maxTaskCount = 0;


    Object.defineProperties(p, {
        '_progress': {
            value: new Map()
        },
        '_description': {
            value: new Map()
        },
        '_stackTrace': {
            value: new Map()
        }
    });
    /**
     * For debugging, returns debugIds for active tasks.
     */
    p.debugTasks = function () {
        var result = [];
        for (var task of this._progress.keys()) {
            result.push(WeaveAPI.debugID(task));
        };

        return result;
    }

    p.getDescriptions = function () {
        var result = [];
        for (var task of this._progress.keys()) {
            var desc = this._description.get(task) || "Unnamed task";
            if (desc)
                result.push(WeaveAPI.debugId(task) + " (" + (100 * this._progress.get(task)) + "%) " + desc);

        };

        WeaveAPI.StandardLib.sort(result);
        return result;
    }


    /**
     * @inheritDoc
     */
    p.getTaskCount = function () {
        return this._taskCount;
    }

    /**
     * @inheritDoc
     */
    p.addTask = function (taskToken, busyObject, description) {
        busyObject = (busyObject === undefined) ? null : busyObject;
        description = (description === undefined) ? null : description;

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();

        if (taskToken instanceof weavecore.CustomPromise && this._progress.get(taskToken) === undefined)
            taskToken.addResponder({
                result: handleAsyncToken.bind(this),
                fault: handleAsyncToken.bind(this),
                token: taskToken
            });

        this._description.set(taskToken, description);

        // add task before WeaveAPI.SessionManager.assignBusyTask()
        this.updateTask(taskToken, NaN); // NaN is used as a special case when adding the task

        if (busyObject)
            WeaveAPI.SessionManager.assignBusyTask(taskToken, busyObject);

        cc.resumeCallbacks();
    }

    function handleAsyncToken(response, token) {
        this.removeTask(token);
    }

    /**
     * @inheritDoc
     */
    p.hasTask = function (taskToken) {
        return this._progress.get(taskToken) !== undefined;
    }

    /**
     * @inheritDoc
     */
    p.updateTask = function (taskToken, progress) {
        // if this token isn't in the Dictionary yet, increase count
        if (this._progress.get(taskToken) === undefined) {
            // expecting NaN from addTask()
            if (!isNaN(progress))
                console.error("updateTask() called, but task was not previously added with addTask()");
            if (ProgressIndicator.debug)
                this._stackTrace.set(taskToken, new Error("Stack trace").getStackTrace());

            // increase count when new task is added
            this._taskCount++;
            this._maxTaskCount++;
        }

        if (this._progress.get(taskToken) !== progress) {
            this._progress.set(taskToken, progress);
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        }
    }

    /**
     * @inheritDoc
     */
    p.removeTask = function (taskToken) {
        // if the token isn't in the dictionary, do nothing
        if (this._progress.get(taskToken) === undefined)
            return;

        var stackTrace = this._stackTrace.get(taskToken); // check this when debugging

        this._progress.delete(taskToken);
        this._description.delete(taskToken);
        this._stackTrace.delete(taskToken);
        this._taskCount--;
        // reset max count when count drops to 1
        if (this._taskCount == 1)
            this._maxTaskCount = this._taskCount;

        WeaveAPI.SessionManager.unassignBusyTask(taskToken);

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    /**
     * @inheritDoc
     */
    p.getNormalizedProgress = function () {
        // add up the percentages
        var sum = 0;
        for (var task of this._progress.keys()) {
            var stackTrace = this._stackTrace.get(task); // check this when debugging
            var progress = this._progress.get(task);
            if (isFinite(progress))
                sum += progress;
        };

        // make any pending requests that no longer exist count as 100% done
        sum += _maxTaskCount - _taskCount;
        // divide by the max count to get overall percentage
        return sum / _maxTaskCount;
    }

    weavecore.ProgressIndicator = ProgressIndicator;
    WeaveAPI.ProgressIndicator = new ProgressIndicator();

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'ProgressIndicator',
            qName: 'weavecore.ProgressIndicator'
        }],
        interfaces: [weavecore.IProgressIndicator]
    };


}());
