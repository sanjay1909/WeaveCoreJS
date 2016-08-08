import JS from "../util/JS";
import DebugUtils from "../util/DebugUtils";
import WeavePromise from "../util/WeavePromise";
import IProgressIndicator from "../api/core/IProgressIndicator";

import Weave from "../Weave";
import WeaveAPI from "../WeaveAPI";



export default class ProgressIndicator
{
	constructor()
	{

		this.map_task_progress = new JS.Map();
		this.map_task_description = new JS.Map();
		this.map_task_stackTrace = new JS.Map();

		this._taskCount = 0;
		this._maxTaskCount = 1;

		this.debugTasks = this.debugTasks.bind(this);
		this.getDescriptions = this.getDescriptions.bind(this);
		this.getTaskCount = this.getTaskCount.bind(this);
		this.addTask = this.addTask.bind(this);
		this.hasTask = this.hasTask.bind(this);
		this.updateTask = this.updateTask.bind(this);
		this.removeTask = this.removeTask.bind(this);
		this.getNormalizedProgress = this.getNormalizedProgress.bind(this);
	}

	/**
	 * For debugging, returns debugIds for active tasks.
	 */
	debugTasks()
	{
		var result = [];
		var tasks = JS.mapKeys(this.map_task_progress);
		for (var i in tasks)
		{
			var task = tasks[i];

			result.push(DebugUtils.debugId(task));}

		return result;
	};


	getDescriptions()
	{
		var result = [];
		var tasks = JS.mapKeys(this.map_task_progress);
		for (var i in tasks)
		{
			var task = tasks[i];
			{
				var  desc = this.map_task_description.get(task) || "Unnamed task";
				if (desc)
					result.push([task, this.map_task_progress.get(task), desc]);
			}
		}

		return result;
	};


	getTaskCount()
	{
		return this._taskCount;
	};


	addTask(taskToken, busyObject, description)
	{
		busyObject = typeof busyObject !== 'undefined' ? busyObject : null;
		description = typeof description !== 'undefined' ? description : null;
		var  cc = Weave.getCallbacks(this);
		cc.delayCallbacks();
		var isNewTask = !this.map_task_progress.has(taskToken);
		this.map_task_description.set(taskToken, description);
		this.updateTask(taskToken, NaN);
		if (isNewTask && WeavePromise.isThenable(taskToken)) {
			var remove = this.removeTask.bind(this, taskToken);
			taskToken.then(remove, remove);
		}
		if (busyObject)
			WeaveAPI.SessionManager.assignBusyTask(taskToken, busyObject);
		cc.resumeCallbacks();
	};


	hasTask(taskToken)
	{
		return this.map_task_progress.has(taskToken);
	};


	updateTask(taskToken, progress)
	{
		if (!this.map_task_progress.has(taskToken))
		{
			if (!isNaN(progress))
				throw new Error("updateTask() called, but task was not previously added with addTask()");
			if (WeaveAPI.debugAsyncStack)
				this.map_task_stackTrace.set(taskToken, new Error("Stack trace"));
			this._taskCount++;
			this._maxTaskCount++;
		}
		if (this.map_task_progress.get(taskToken) !== progress) {
			this.map_task_progress.set(taskToken, progress);
			Weave.getCallbacks(this).triggerCallbacks();
		}
	};


	removeTask(taskToken)
	{
		if (!this.map_task_progress.has(taskToken))
			return;
		var stackTrace = this.map_task_stackTrace.get(taskToken);
		this.map_task_progress['delete'](taskToken);
		this.map_task_description['delete'](taskToken);
		this.map_task_stackTrace['delete'](taskToken);
		this._taskCount--;
		if (this._taskCount == 1)
			this._maxTaskCount = this._taskCount;
		WeaveAPI.SessionManager.unassignBusyTask(taskToken);
		Weave.getCallbacks(this).triggerCallbacks();
	};


	getNormalizedProgress()
	{
		var sum = 0;
		var tasks = JS.mapKeys(this.map_task_progress);

		for (var i in tasks)
		{
			var task = tasks[i];
			{
				var stackTrace = this.map_task_stackTrace.get(task);
				var progress = this.map_task_progress.get(task);
				if (isFinite(progress))
					sum += progress;
			}
		}

		sum += this._maxTaskCount - this._taskCount;
		if (sum)
			return sum / this._maxTaskCount;
		return this._taskCount ? 0 : 1;
	};


	test()
	{
		var tasks = JS.mapKeys(this.map_task_progress);
		for (var i in tasks)
		{
			var task = tasks[i];
			{
				var stackTrace = this.map_task_stackTrace.get(task);
				var description = this.map_task_description.get(task);
				JS.log(DebugUtils.debugId(task), description, stackTrace);
			}
		}

	};


	 REFLECTION_INFO ()
	 {
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
					'debugTasks': { type: 'Array', declaredBy: 'weavejs.core.ProgressIndicator'},
					'getDescriptions': { type: 'Array', declaredBy: 'weavejs.core.ProgressIndicator'},
					'getTaskCount': { type: 'int', declaredBy: 'weavejs.core.ProgressIndicator'},
					'addTask': { type: 'void', declaredBy: 'weavejs.core.ProgressIndicator'},
					'hasTask': { type: 'Boolean', declaredBy: 'weavejs.core.ProgressIndicator'},
					'updateTask': { type: 'void', declaredBy: 'weavejs.core.ProgressIndicator'},
					'removeTask': { type: 'void', declaredBy: 'weavejs.core.ProgressIndicator'},
					'getNormalizedProgress': { type: 'Number', declaredBy: 'weavejs.core.ProgressIndicator'},
					'test': { type: 'void', declaredBy: 'weavejs.core.ProgressIndicator'}
				};
			}
		};
	};
}

ProgressIndicator.prototype.CLASS_INFO = { names: [{ name: 'ProgressIndicator', qName: 'weavejs.core.ProgressIndicator'}], interfaces: [IProgressIndicator] };


