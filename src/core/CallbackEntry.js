import WeaveAPI from "../WeaveAPI"
import IDisposableObject from "../api/core/IDisposableObject"

export default class CallbackEntry
{
	/**
	 * context The "this" argument for the callback function. When the context is disposed, this callback entry will be disposed.
	 */
	constructor(context, callback) 
	{
		
		
		this.recursionCount = 0;
		this.schedule = 0;
		this.addCallback_stackTrace = null;
		this.removeCallback_stackTrace = null;
		
		this.context = context;
		this.callback = callback;
		
		if (context)
			WeaveAPI.SessionManager.registerDisposableChild(context, this);
		
		if (WeaveAPI.debugAsyncStack)
			this.addCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_ADD);

		this.dispose = this.dispose.bind(this);
	};

	/**
	 * Call this when the callback entry is no longer needed.
	 */
	dispose()
	{
		if (WeaveAPI.debugAsyncStack && this.callback != null)
			this.removeCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_REMOVE);
		this.context = null;
		this.callback = null;
	};

	/**
	 * Reflection
	 *
	 * @return {Object.<string, Function>}
	 */
	FLEXJS_REFLECTION_INFO()
	{
		return {
			variables: function () {
				return {
					'context': { type: 'Object'},
					'callback': { type: 'Function'},
					'recursionCount': { type: 'uint'},
					'schedule': { type: 'int'},
					'addCallback_stackTrace': { type: 'Error'},
					'removeCallback_stackTrace': { type: 'Error'}
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'CallbackEntry': { type: '', declaredBy: 'weavejs.core.CallbackEntry'},
					'dispose': { type: 'void', declaredBy: 'weavejs.core.CallbackEntry'}
				};
			}
		};
	};
}
CallbackEntry.prototype.CLASS_INFO = { names: [{ name: 'CallbackEntry', qName: 'weavejs.core.CallbackEntry'}], interfaces: [IDisposableObject] };



CallbackEntry.STACK_TRACE_ADD = "This is the stack trace from when the callback was added.";
CallbackEntry.STACK_TRACE_REMOVE = "This is the stack trace from when the callback was removed.";






