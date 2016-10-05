
export default class IScheduler
{
	constructor()
	{

	}

	callLater(relevantContext, method, parameters) {};
	startTask(relevantContext, iterativeTask, priority, finalCallback, description) {};

	REFLECTION_INFO() {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'frameCallbacks': { type: 'ICallbackCollection', declaredBy: 'weavejs.api.core.IScheduler'}
				};
			},
			methods: function () {
				return {
					'callLater': { type: 'void', declaredBy: 'weavejs.api.core.IScheduler'},
					'startTask': { type: 'void', declaredBy: 'weavejs.api.core.IScheduler'}
				};
			}
		};
	};
}
IScheduler.prototype.frameCallbacks;
IScheduler.prototype.CLASS_INFO = { names: [{ name: 'IScheduler', qName: 'weavejs.api.core.IScheduler'}] };



