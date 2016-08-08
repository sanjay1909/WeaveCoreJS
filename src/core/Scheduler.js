import Weave from "../Weave";
import WeaveAPI from "../WeaveAPI";

import JS from "../util/JS";
import Dictionary2D from "../util/Dictionary2D";
import Language from "../util/Language";
import StandardLib from "../util/StandardLib";
import DebugTimer from "../util/DebugTimer";

import CallbackCollection from "../core/CallbackCollection";


import IScheduler from "../api/core/IScheduler";
import IDisposableObject from "../api/core/IDisposableObject";


export default class Scheduler
{
	constructor()
	{

		this._frameCallbacks = Weave.disposableChild(this, CallbackCollection);
		this._currentFrameStartTime = JS.now();
		this.frameTimes = [];
		this.map_task_stackTrace = new JS.WeakMap();
		this.map_task_elapsedTime = new JS.WeakMap();
		this.map_task_startTime = new JS.WeakMap();
		this._priorityCallLaterQueues = [[], [], [], []];
		this._activePriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1;
		this._priorityAllocatedTimes = [Number.MAX_VALUE, 300, 200, 100];
		this.map_task_time = new JS.WeakMap();
		this.d2d_context_task_token = new Dictionary2D(true, true, Object);
		
		this._nextAnimationFrame;
		this.averageFrameTime = 0;
		this._currentTaskStopTime = 0;
		this._priorityCallLaterQueues;
		this._previousFrameElapsedTime = 0;
		this._activePriorityElapsedTime = 0;
		this._deactivatedMaxComputationTimePerFrame = 1000;
		this.maxComputationTimePerFrame = 100;
		this.maxComputationTimePerFrame_noActivity = 250;

		Object.defineProperties(this,  {
			frameCallbacks: {
				get: function() {
					return this._frameCallbacks;
				}
			},
			previousFrameElapsedTime: {
				get: function() {
					return this._previousFrameElapsedTime;
				}
			},
			currentFrameElapsedTime: {
				get:  function() {
					return JS.now() - this._currentFrameStartTime;
				}
			}
		});

		this.HIDDEN;
		this.VISIBILITY_CHANGE;
		this.deactivated = true;
		this.useDeactivatedFrameRate = false;


		this._requestNextFrame = this._requestNextFrame.bind(this);
		this.dispose = this.dispose.bind(this);
		this.getMaxComputationTimePerFrame = this.getMaxComputationTimePerFrame.bind(this);
		this.setMaxComputationTimePerFrame = this.setMaxComputationTimePerFrame.bind(this);
		this.getTaskPriorityTimeAllocation = this.getTaskPriorityTimeAllocation.bind(this);
		this.setTaskPriorityTimeAllocation = this.setTaskPriorityTimeAllocation.bind(this);
		this.initVisibilityHandler = this.initVisibilityHandler.bind(this);
		this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
		this._handleCallLater = this._handleCallLater.bind(this);
		this.callLater = this.callLater.bind(this);
		this._callLaterPriority = this._callLaterPriority.bind(this);
		this.startTask = this.startTask.bind(this);
		this._iterateTask = this._iterateTask.bind(this);

		//todo : find the requirem
		this._frameCallbacks.addImmediateCallback(this, Language.closure(this._requestNextFrame, this, '_requestNextFrame'), true);
		this._frameCallbacks.addImmediateCallback(this, Language.closure(this._handleCallLater, this, '_handleCallLater'));

		this.initVisibilityHandler();
	}


	/**
	 * @private
	 */
	_requestNextFrame()
	{
		this._nextAnimationFrame = JS.requestAnimationFrame(Language.closure(this._frameCallbacks.triggerCallbacks, this._frameCallbacks, 'triggerCallbacks'));
	};


	/**
	 * @export
	 */
	dispose()
	{
		JS.cancelAnimationFrame(this._nextAnimationFrame);
	};

	/**
	 * This gets the maximum milliseconds spent per frame performing asynchronous tasks.
	 */
	getMaxComputationTimePerFrame()
	{
		return this.maxComputationTimePerFrame;
	};


	/**
	 * This sets the maximum milliseconds spent per frame performing asynchronous tasks.
	 */
	setMaxComputationTimePerFrame(value)
	{
		this.maxComputationTimePerFrame = value;
	};


	/**
	 * This will get the time allocation for a specific task priority.
	 */
	getTaskPriorityTimeAllocation(priority)
	{
		return Language.uint(this._priorityAllocatedTimes[priority]);
	};


	/**
	 * This will set the time allocation for a specific task priority.
	 */
	setTaskPriorityTimeAllocation(priority, milliseconds)
	{
		this._priorityAllocatedTimes[priority] = Math.max(milliseconds, 5);
	};

	/**
	 * @private
	 */
	initVisibilityHandler()
	{
		if (typeof(JS.global.document.hidden) !== "undefined") {
			this.HIDDEN = "hidden";
			this.VISIBILITY_CHANGE = "visibilitychange";
		} else if (typeof(JS.global.document.mozHidden) !== "undefined") {
			this.HIDDEN = "mozHidden";
			this.VISIBILITY_CHANGE = "mozvisibilitychange";
		} else if (typeof(JS.global.document.msHidden) !== "undefined") {
			this.HIDDEN = "msHidden";
			this.VISIBILITY_CHANGE = "msvisibilitychange";
		} else if (typeof(JS.global.document.webkitHidden) !== "undefined") {
			this.HIDDEN = "webkitHidden";
			this.VISIBILITY_CHANGE = "webkitvisibilitychange";
		}
		if (typeof(JS.global.document.addEventListener) !== "undefined" && typeof(JS.global.document[this.HIDDEN]) !== "undefined")
			JS.global.document.addEventListener(this.VISIBILITY_CHANGE, Language.closure(this.handleVisibilityChange, this, 'handleVisibilityChange'), false);
	};


	handleVisibilityChange()
	{
		if (JS.global.document[this.HIDDEN])
			this.deactivated = true;
		else
			this.deactivated = false;
		this.useDeactivatedFrameRate = false;
		if (Scheduler.debug_visibility)
			JS.log('visibility change; hidden =', this.deactivated);
	};

	/**
	 * This function gets called during ENTER_FRAME and RENDER events.
	 */
	_handleCallLater ()
	{
		if (this.deactivated)
		{
			var  wasted = JS.now() - this._currentFrameStartTime;
			if (Scheduler.debug_fps)
				JS.log('wasted', wasted);
			this.useDeactivatedFrameRate = wasted > 100;
		}
		var prevStartTime = this._currentFrameStartTime;
		this._currentFrameStartTime = JS.now();
		this._previousFrameElapsedTime = this._currentFrameStartTime - prevStartTime;
		if (this.maxComputationTimePerFrame == 0)
			this.maxComputationTimePerFrame = 100;

		var  maxComputationTime;
		if (this.useDeactivatedFrameRate)
			maxComputationTime = this._deactivatedMaxComputationTimePerFrame;
		else
			maxComputationTime = this.maxComputationTimePerFrame;

		Scheduler.resetDebugTime();
		if (Scheduler.debug_fps)
		{
			this.frameTimes.push(this.previousFrameElapsedTime);
			if (StandardLib.sum(this.frameTimes) >= 1000)
			{
				this.averageFrameTime = StandardLib.mean(this.frameTimes);
				var fps = StandardLib.roundSignificant(1000 / this.averageFrameTime, 2);
				JS.log(fps, 'fps; max computation time', maxComputationTime);
				this.frameTimes.length = 0;
			}
		}

		if (this._previousFrameElapsedTime > 3000)
			JS.log('Previous frame took', this._previousFrameElapsedTime, 'ms');

		var args;
		var context;
		var args2;
		var stackTrace;
		var now;
		var allStop = this._currentFrameStartTime + maxComputationTime;
		this._currentTaskStopTime = allStop;
		var queue = Language.as(this._priorityCallLaterQueues[WeaveAPI.TASK_PRIORITY_IMMEDIATE], Array);
		var countdown;
		for (countdown = queue.length; countdown > 0; countdown--)
		{
			if (Scheduler.debug_callLater)
				DebugTimer.begin();
			now = JS.now();
			if (now > allStop) {
				if (Scheduler.debug_callLater)
					DebugTimer.cancel();
				return;
			}

			args = queue.shift();
			stackTrace = this.map_task_stackTrace.get(args);
			context = args[0];
			if (!WeaveAPI.SessionManager.objectWasDisposed(context))
			{
				args2 = Language.as(args[2], Array);
				if (args2 != null && args2.length > 0)
					Language.as(args[1], Function).apply(context, args2);
				else
					Language.as(args[1], Function).apply(context);
			}

			if (Scheduler.debug_callLater)
				DebugTimer.end(stackTrace);
		}
		var minPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1;
		var lastPriority = this._activePriority == minPriority ? this._priorityCallLaterQueues.length - 1 : this._activePriority - 1;
		var pStart = JS.now();
		var pAlloc = Language._int(this._priorityAllocatedTimes[this._activePriority]);
		if (this.useDeactivatedFrameRate)
			pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
		var pStop = Math.min(allStop, pStart + pAlloc - this._activePriorityElapsedTime);
		queue = Language.as(this._priorityCallLaterQueues[this._activePriority], Array);
		countdown = queue.length;
		while (true) {
			if (Scheduler.debug_callLater)
				DebugTimer.begin();
			now = JS.now();
			if (countdown == 0 || now > pStop) {
				this._activePriorityElapsedTime += now - pStart;
				if (now > allStop || this._activePriority == lastPriority) {
					if (Scheduler.debug_callLater)
						DebugTimer.cancel();
					if (Scheduler.debug_fps)
						JS.log('spent', this.currentFrameElapsedTime, 'ms');
					return;
				}
				var  remaining = 0;
				for (var  i = minPriority; i < this._priorityCallLaterQueues.length; i++)
					remaining += Language.as(this._priorityCallLaterQueues[i], Array).length;
				if (remaining == 0) {
					if (Scheduler.debug_callLater)
						DebugTimer.cancel();
					break;
				}
				this._activePriority++;
				this._activePriorityElapsedTime = 0;
				if (this._activePriority == this._priorityCallLaterQueues.length)
					this._activePriority = minPriority;
				pStart = now;
				pAlloc = Language._int(this._priorityAllocatedTimes[this._activePriority]);
				if (this.useDeactivatedFrameRate)
					pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
				pStop = Math.min(allStop, pStart + pAlloc);
				queue = Language.as(this._priorityCallLaterQueues[this._activePriority], Array);
				countdown = queue.length;
				if (Scheduler.debug_callLater)
					DebugTimer.cancel();
				continue;
			}
			countdown--;
			this._currentTaskStopTime = pStop;
			args = Language.as(queue.shift(), Array);
			stackTrace = this.map_task_stackTrace.get(args);
			context = args[0];

			if (!WeaveAPI.SessionManager.objectWasDisposed(context))
			{
				args2 = Language.as(args[2], Array);
				if (args2 != null && args2.length > 0)
					Language.as(args[1], Function).apply(context, args2);
				else
					Language.as(args[1], Function).apply(context);
			}
			if (Scheduler.debug_callLater)
				DebugTimer.end(stackTrace);
		}
	};

	callLater(relevantContext, method, parameters)
	{
		parameters = typeof parameters !== 'undefined' ? parameters : null;
		this._callLaterPriority(WeaveAPI.TASK_PRIORITY_IMMEDIATE, relevantContext, method, parameters);
	};


	_callLaterPriority(priority, relevantContext, method, parameters)
	{
		parameters = typeof parameters !== 'undefined' ? parameters : null;
		if (method == null) {
			JS.error('StageUtils.callLater(): received null "method" parameter');
			return;
		}
		var args = [relevantContext, method, parameters];
		this._priorityCallLaterQueues[priority].push(args);
		if (WeaveAPI.debugAsyncStack)
			this.map_task_stackTrace.set(args, new Error("This is the stack trace from when callLater() was called."));
	};

	startTask(relevantContext, iterativeTask, priority, finalCallback, description)
	{
		finalCallback = typeof finalCallback !== 'undefined' ? finalCallback : null;
		description = typeof description !== 'undefined' ? description : null;

		var taskToken = this.d2d_context_task_token.get(relevantContext || JS.global, iterativeTask);
		if (WeaveAPI.ProgressIndicator.hasTask(taskToken))
			return;
		if (Scheduler.debug_async_time) {
			if (this.map_task_time.get(iterativeTask)) {
				var value = this.map_task_time.get(iterativeTask);
				this.map_task_time['delete'](iterativeTask);
				JS.log('interrupted', JS.now() - this.map_task_time.get(iterativeTask)[0], priority, this.map_task_time.get(iterativeTask)[1], value);
			}
			this.map_task_time.set(iterativeTask, [JS.now(), new Error('Stack trace')]);
		}
		if (priority >= this._priorityCallLaterQueues.length) {
			JS.error("Invalid priority value: " + priority);
			priority = WeaveAPI.TASK_PRIORITY_NORMAL;
		}
		if (WeaveAPI.debugAsyncStack)
			this.map_task_stackTrace.set(iterativeTask, [weavejs.util.DebugUtils.debugId(iterativeTask), new Error("Stack trace")]);

		if (Scheduler.debug_async_stack_elapsed)
		{
			this.map_task_startTime.set(iterativeTask, JS.now());
			this.map_task_elapsedTime.set(iterativeTask, 0);
		}
		WeaveAPI.ProgressIndicator.addTask(taskToken, relevantContext, description);
		var useTimeParameter = iterativeTask.length > 0;
		this._callLaterPriority(priority, null, Language.closure(this._iterateTask, this, '_iterateTask'), [relevantContext, iterativeTask, priority, finalCallback, useTimeParameter]);
	};

	_iterateTask(context, task, priority, finalCallback, useTimeParameter)
	{
		var taskToken = this.d2d_context_task_token.get(context || JS.global, task);
		if (WeaveAPI.SessionManager.objectWasDisposed(context))
		{
			if (Scheduler.debug_async_time && this.map_task_time.get(task)) {
				var value = this.map_task_time.get(task);
				this.map_task_time['delete'](task);
				JS.log('disposed', JS.now() - this.map_task_time.get(task)[0], priority, this.map_task_time.get(task)[1], value);
			}
			WeaveAPI.ProgressIndicator.removeTask(taskToken);
			return;
		}
		var debug_time = WeaveAPI.debugAsyncStack ? JS.now() : -1;
		var stackTrace = WeaveAPI.debugAsyncStack ? this.map_task_stackTrace.get(task) : null;
		var progress = undefined;
		var time;
		while ((time = JS.now()) <= this._currentTaskStopTime)
		{
			if (useTimeParameter)
				progress = Language.as(task.call(context, this._currentTaskStopTime), Number);
			else
				progress = Language.as(task.call(context), Number);
			if (progress === null || isNaN(progress) || progress < 0 || progress > 1)
			{
				JS.error("Received unexpected result from iterative task (" + progress + ").  Expecting a number between 0 and 1.  Task cancelled.");
				if (WeaveAPI.debugAsyncStack) {
					JS.log(stackTrace);
					if (useTimeParameter)
						progress = Language.as(task.call(context, this._currentTaskStopTime), Number);
					else
						progress = Language.as(task.call(context), Number);
				}
				progress = 1;
			}
			if (WeaveAPI.debugAsyncStack && this.currentFrameElapsedTime > 3000)
			{
				JS.log(JS.now() - time, stackTrace);
				if (useTimeParameter)
					progress = Language.as(task.call(context, this._currentTaskStopTime), Number);
				else
					progress = Language.as(task.call(context), Number);
			}
			if (progress == 1) {
				if (Scheduler.debug_async_time && this.map_task_time.get(task))
				{
					var value2 = this.map_task_time.get(task);
					this.map_task_time['delete'](task);
					JS.log('completed', JS.now() - this.map_task_time.get(task)[0], priority, this.map_task_time.get(task)[1], value2);
				}
				WeaveAPI.ProgressIndicator.removeTask(taskToken);
				if (finalCallback != null)
					finalCallback.call(context);
				return;
			}
			if (useTimeParameter)
				break;
			if (Scheduler.debug_delayTasks)
				break;
		}
		if (Scheduler.debug_async_stack_elapsed) {
			var  start = Language._int(this.map_task_startTime.get(task));
			var  elapsed = Language._int(this.map_task_elapsedTime.get(task)) + (time - debug_time);
			this.map_task_elapsedTime.set(task, elapsed);
			JS.log(elapsed, '/', (time - start), '=', StandardLib.roundSignificant(elapsed / (time - start), 2), stackTrace);
		}
		if (progress !== undefined)
			WeaveAPI.ProgressIndicator.updateTask(taskToken, progress);
		this._callLaterPriority(priority, null, Language.closure(this._iterateTask, this, '_iterateTask'), JS.toArray(arguments));
	};

	REFLECTION_INFO() {
		return {
			variables: function () {
				return {
					'averageFrameTime': { type: 'int'},
					'maxComputationTimePerFrame': { type: 'uint'}
				};
			},
			accessors: function () {
				return {
					'frameCallbacks': { type: 'ICallbackCollection', declaredBy: 'Scheduler'},
					'previousFrameElapsedTime': { type: 'int', declaredBy: 'Scheduler'},
					'currentFrameElapsedTime': { type: 'int', declaredBy: 'Scheduler'}
				};
			},
			methods: function () {
				return {
					'Scheduler': { type: '', declaredBy: 'Scheduler'},
					'dispose': { type: 'void', declaredBy: 'Scheduler'},
					'getMaxComputationTimePerFrame': { type: 'uint', declaredBy: 'Scheduler'},
					'setMaxComputationTimePerFrame': { type: 'void', declaredBy: 'Scheduler'},
					'getTaskPriorityTimeAllocation': { type: 'uint', declaredBy: 'Scheduler'},
					'setTaskPriorityTimeAllocation': { type: 'void', declaredBy: 'Scheduler'},
					'callLater': { type: 'void', declaredBy: 'Scheduler'},
					'startTask': { type: 'void', declaredBy: 'Scheduler'}
				};
			}
		};
	};





}
Scheduler.prototype.CLASS_INFO = { names: [{ name: 'Scheduler', qName: 'Scheduler'}], interfaces: [IScheduler, IDisposableObject] };


Scheduler.debug_fps = false;
Scheduler.debug_async_time = false;
Scheduler.debug_async_stack_elapsed = false;
Scheduler.debug_delayTasks = false;
Scheduler.debug_callLater = false;
Scheduler.debug_visibility = false;

Scheduler._time;
Scheduler._times = [];
Scheduler.debugTime = function(str)
{
	var now = JS.now();
	var dur = (now - Scheduler._time);
	if (dur > 100)
	{
		Scheduler._times.push(dur + ' ' + str);
	}
	else
	{
		var  dots = '...';
		var n = Scheduler._times.length;
		if (n && Scheduler._times[n - 1] != dots)
			Scheduler._times.push(dots);
	}
	Scheduler._time = now;
	return dur;
};

Scheduler.resetDebugTime = function() {
	Scheduler._times.length = 0;
	Scheduler._time = JS.now();
};

/**
 * This will generate an iterative task function that is the combination of a list of tasks to be completed in order.
 */
Scheduler.generateCompoundIterativeTask = function(iterativeTasks)
{
	iterativeTasks = Array.prototype.slice.call(arguments, 0);
	var  __localFn0__ = function(stopTime) {
		if (stopTime < 0) {
			iTask = 0;
			return 0;
		}
		if (iTask >= iterativeTasks.length)
			return 1;
		var  i = iTask;
		var iterate = Language.as(iterativeTasks[iTask], Function);
		var  progress;
		if (iterate.length) {
			progress = iterate.call(this, stopTime);
		} else {
			while (iTask == i && (progress = iterate.call(this)) < 1 && JS.now() < stopTime) {
			}
		}
		if (iTask != i)
			return 0;
		var  totalProgress = (iTask + progress) / iterativeTasks.length;
		if (progress == 1)
			iTask++;
		return totalProgress;
	};
	var  iTask = 0;
	return __localFn0__;
};

// todo : is this an internal class ? check?
Scheduler.WindowFrameHandler = function(window, scheduler)
{

};

Scheduler.WindowFrameHandler.prototype.window;
Scheduler.WindowFrameHandler.prototype.scheduler;
Scheduler.WindowFrameHandler.prototype.CLASS_INFO = { names: [{ name: 'WindowFrameHandler', qName: 'Scheduler.WindowFrameHandler'}] };
Scheduler.WindowFrameHandler.prototype.REFLECTION_INFO = function () {
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
				'WindowFrameHandler': { type: '', declaredBy: 'Scheduler.WindowFrameHandler'}
			};
		}
	};
};
