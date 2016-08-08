import CallbackEntry from "./CallbackEntry"
import GroupedCallbackEntry from "./GroupedCallbackEntry"
import Language from "../util/Language"
import Weave from "../Weave"
import WeaveAPI from "../WeaveAPI"

import ICallbackCollection from "../api/core/ICallbackCollection";
import IDisposableObject from "../api/core/IDisposableObject";

/**
 * This class manages a list of callback functions.
 * If specified, the preCallback function will be called immediately before running each
 * callback using the parameters passed to _runCallbacksImmediately(). This means if there
 * are five callbacks added, preCallback() gets called five times whenever
 * _runCallbacksImmediately() is called.  An example usage of this is to make sure a relevant
 * variable is set to the appropriate value while each callback is running.  The preCallback
 * function will not be called before grouped callbacks.
 * @param {Function} preCallback An optional function to call before each immediate callback.
 */
export default class CallbackCollection
{

	constructor(preCallback)
	{

		this._callbackEntries = [];
		this._triggerCounter = CallbackCollection.DEFAULT_TRIGGER_COUNT;
		this._disposeCallbackEntries = [];
		this._preCallback = preCallback;

		this._runCallbacksCompleted;
		this._wasDisposed = false;

		//EC6 doesn't call this with prototype mehtod with This
		this.addImmediateCallback = this.addImmediateCallback.bind(this);
		this.triggerCallbacks = this.triggerCallbacks.bind(this);
		this._runCallbacksImmediately = this._runCallbacksImmediately.bind(this);
		this.removeCallback = this.removeCallback.bind(this);
		this.delayCallbacks = this.delayCallbacks.bind(this);
		this.resumeCallbacks = this.resumeCallbacks.bind(this);
		this.addDisposeCallback = this.addDisposeCallback.bind(this);
		this.dispose = this.dispose.bind(this);
		this.runDisposeCallbacks = this.runDisposeCallbacks.bind(this);
		this.addGroupedCallback = this.addGroupedCallback.bind(this);
	}
	/*
	 * add function to callback entries
	 * Those functions are executed as next line execution when there is change in data
	 * @param {Object} relevantContext = mostly the the context where callback function is defined
	 * @param {Function} callback
	 * @param {boolean=} runCallbackNow
	 * @param {boolean=} alwaysCallLast
	 */
	addImmediateCallback(relevantContext, callback, runCallbackNow, alwaysCallLast)
	{
		// default value for params
		runCallbackNow = typeof runCallbackNow !== 'undefined' ? runCallbackNow : false;
		alwaysCallLast = typeof alwaysCallLast !== 'undefined' ? alwaysCallLast : false;
		
		if (callback == null)
			return;
		
		// remove callback to avoid duplication
		this.removeCallback(relevantContext, callback);

		var entry = new CallbackEntry(relevantContext, callback);
		if (alwaysCallLast)
			entry.schedule = 1;

		this._callbackEntries.push(entry);

		if (runCallbackNow) {
			entry.recursionCount++;
			callback.apply(relevantContext || callback['this']);
			entry.recursionCount--;
		}
	};


	/**
	 * @export
	 */
	triggerCallbacks()
	{
		if (WeaveAPI.debugAsyncStack)
			this._lastTriggerStackTrace = new Error(weavejs.core.CallbackCollection.STACK_TRACE_TRIGGER);
		if (this._delayCount > 0) {
			this._triggerCounter++;
			this._runCallbacksIsPending = true;
			return;
		}
		this._runCallbacksImmediately();
	};


	/**
	 * This function runs callbacks immediately, ignoring any delays.
	 * The preCallback function will be called with the specified preCallbackParams arguments.
	 */
	_runCallbacksImmediately (preCallbackParams)
	{
		preCallbackParams = Array.prototype.slice.call(arguments, 0);
		this._triggerCounter++;
		this._runCallbacksIsPending = false;
		this._runCallbacksCompleted = false;
		for (var  schedule = 0; schedule < 2; schedule++)
		{
			for (var  i = 0; i < this._callbackEntries.length; i++)
			{
				if (this._runCallbacksCompleted && this._preCallback == null)
					break;

				var  entry = this._callbackEntries[i];
				if (entry.schedule != schedule)
					continue;

				var  shouldRemoveEntry;
				if (entry.callback == null)
					shouldRemoveEntry = true;
				else if (Language.is(entry.context, CallbackCollection))
					shouldRemoveEntry = Language.as(entry.context,CallbackCollection)._wasDisposed;
				else
					shouldRemoveEntry = WeaveAPI.SessionManager.objectWasDisposed(entry.context);

				if (shouldRemoveEntry) {
					Weave.dispose(entry);
					var removed = this._callbackEntries.splice(i--, 1);
					if (WeaveAPI.debugAsyncStack)
						this._oldEntries = this._oldEntries ? this._oldEntries.concat(removed) : removed;
					continue;
				}
				if (entry.recursionCount == 0 || this._preCallback != null) {
					entry.recursionCount++;
					if (this._preCallback != null)
						this._preCallback.apply(this, preCallbackParams);
					entry.callback.apply(entry.context || entry.callback['this']);
					entry.recursionCount--;
				}
			}
		}
		this._runCallbacksCompleted = true;
	};


	 removeCallback(relevantContext, callback) 
	 {
		GroupedCallbackEntry.removeGroupedCallback(this, relevantContext, callback);
		for (var  outerLoop = 0; outerLoop < 2; outerLoop++)
		{
			var entries = outerLoop == 0 ? this._callbackEntries : this._disposeCallbackEntries;
			for (var  index = 0; index < entries.length; index++)
			{
				var entry = entries[index];
				if (entry.callback === callback && entry.context === relevantContext) {
					Weave.dispose(entry);
				}
			}
		}
	};


	delayCallbacks()
	{
		this._delayCount++;
	};


	resumeCallbacks()
	{
		if (this._delayCount > 0)
			this._delayCount--;
		if (this._delayCount == 0) {
			if (this._runCallbacksIsPending)
				this.triggerCallbacks();
			if (this._wasDisposed)
				this.runDisposeCallbacks();
		}
	};

	addDisposeCallback (relevantContext, callback, allowDelay)
	{
		allowDelay = typeof allowDelay !== 'undefined' ? allowDelay : false;
		var entry;
		var entries = this._disposeCallbackEntries;
		for (var i in entries)
		{
			entry = entries[i];

			if (entry.callback === callback && entry.context === relevantContext)
				return;
		}

		entry = new CallbackEntry(relevantContext, callback);
		if (allowDelay)
			entry.schedule = 1;
		this._disposeCallbackEntries.push(entry);
	};


	dispose() {
		var entry;
		if (WeaveAPI.debugAsyncStack)
			this._oldEntries = this._oldEntries ? this._oldEntries.concat(this._callbackEntries) : this._callbackEntries.concat();

		var entries = this._callbackEntries;
		for (var i in entries)
		{
			entry = entries[i];

			Weave.dispose(entry);}

		this._callbackEntries.length = 0;
		this._wasDisposed = true;
		this.runDisposeCallbacks();
	};

	runDisposeCallbacks() {
		var entries = this._disposeCallbackEntries;
		for (var i in entries)
		{
			var entry = entries[i];
			{
				if (entry.schedule > 0 && this._delayCount > 0)
					continue;
				if (entry.callback != null && !WeaveAPI.SessionManager.objectWasDisposed(entry.context)) {
					entry.callback.apply(entry.context || entry.callback['this']);
					Weave.dispose(entry);
				}
			}}

	};


	addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy)
	{
		triggerCallbackNow = typeof triggerCallbackNow !== 'undefined' ? triggerCallbackNow : false;
		delayWhileBusy = typeof delayWhileBusy !== 'undefined' ? delayWhileBusy : true;

		GroupedCallbackEntry.addGroupedCallback(this, relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy);
	};


	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'triggerCounter': { type: 'uint', declaredBy: 'weavejs.core.CallbackCollection'},
					'callbacksAreDelayed': { type: 'Boolean', declaredBy: 'weavejs.core.CallbackCollection'},
					'wasDisposed': { type: 'Boolean', declaredBy: 'weavejs.core.CallbackCollection'}
				};
			},
			methods: function () {
				return {
					'CallbackCollection': { type: '', declaredBy: 'weavejs.core.CallbackCollection'},
					'addImmediateCallback': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'triggerCallbacks': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'removeCallback': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'delayCallbacks': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'resumeCallbacks': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'addDisposeCallback': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'dispose': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'},
					'addGroupedCallback': { type: 'void', declaredBy: 'weavejs.core.CallbackCollection'}
				};
			}
		};
	};
}

CallbackCollection.prototype.CLASS_INFO = { names: [{ name: 'CallbackCollection', qName: 'weavejs.core.CallbackCollection'}], interfaces: [ICallbackCollection, IDisposableObject] };


Object.defineProperty(CallbackCollection, 'DEFAULT_TRIGGER_COUNT', {
	value: 1
});

