
import ILinkableObject from "./ILinkableObject"

export default class ICallbackCollection{
	constructor()
	{
	}

	addImmediateCallback(relevantContext, callback, runCallbackNow, alwaysCallLast) {};
	addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy) {};
	addDisposeCallback(relevantContext, callback, allowDelay) {};
	removeCallback(relevantContext, callback) {};
	triggerCallbacks() {};
	delayCallbacks() {};
	resumeCallbacks() {};

	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'triggerCounter': { type: 'uint', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'callbacksAreDelayed': { type: 'Boolean', declaredBy: 'weavejs.api.core.ICallbackCollection'}
				};
			},
			methods: function () {
				return {
					'addImmediateCallback': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'addGroupedCallback': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'addDisposeCallback': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'removeCallback': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'triggerCallbacks': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'delayCallbacks': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'},
					'resumeCallbacks': { type: 'void', declaredBy: 'weavejs.api.core.ICallbackCollection'}
				};
			}
		};
	};
}

ICallbackCollection.prototype.triggerCounter;
ICallbackCollection.prototype.CLASS_INFO = { names: [{ name: 'ICallbackCollection', qName: 'weavejs.api.core.ICallbackCollection'}], interfaces: [ILinkableObject] };




