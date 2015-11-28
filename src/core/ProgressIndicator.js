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
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ProgressIndicator, 'NS', {
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
    Object.defineProperty(ProgressIndicator, 'CLASS_NAME', {
        value: 'ProgressIndicator'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ProgressIndicator, 'SESSIONABLE', {
        value: true
    });


    Object.defineProperty(ProgressIndicator, 'debug', {
        value: false
    });

    function ProgressIndicator() {

        weavecore.ILinkableObject.call(this);

        this._taskCount = 0;
        this._maxTaskCount = 0;
        Object.defineProperties(this, {
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

    }

    ProgressIndicator.prototype = new weavecore.ILinkableObject();
    ProgressIndicator.prototype.constructor = ProgressIndicator;

    var p = ProgressIndicator.prototype;

    /**
     * For debugging, returns debugIds for active tasks.
     */
    p.debugTasks = function () {
        var result = [];
        var keys = this._progress.keys();
        keys.forEach(function (task) {
            result.push(WeaveAPI.debugID(task));
        });

        return result;
    }

    p.getDescriptions = function () {
        var result = [];
        var keys = this._progress.keys();
        keys.forEach(function (task) {
            var desc = this._description.get(task) || "Unnamed task";
            if (desc)
                result.push(WeaveAPI.debugId(task) + " (" + (100 * this._progress.get(task)) + "%) " + desc);

        }, this);

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
        var keys = this._progress.keys();
        keys.forEach(function (task) {
            var stackTrace = this._stackTrace.get(task); // check this when debugging
            var progress = this._progress.get(task);
            if (isFinite(progress))
                sum += progress;
        }, this);

        // make any pending requests that no longer exist count as 100% done
        sum += _maxTaskCount - _taskCount;
        // divide by the max count to get overall percentage
        return sum / _maxTaskCount;
    }

    weavecore.ProgressIndicator = ProgressIndicator;
    weavecore.ClassUtils.registerClass('weavecore.ProgressIndicator', ProgressIndicator);
    WeaveAPI.ProgressIndicator = new ProgressIndicator();

}());
