import ILinkableObject from "./ILinkableObject";


export default class IProgressIndicator
{
	constructor()
	{
	}
	
	getTaskCount() {};
	addTask(taskToken, busyObject, description) {};
	hasTask(taskToken) {};
	updateTask(taskToken, progress) {};
	removeTask(taskToken) {};
	getNormalizedProgress() {};

	REFLECTION_INFO() {
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
					'getTaskCount': { type: 'int', declaredBy: 'weavejs.api.core.IProgressIndicator'},
					'addTask': { type: 'void', declaredBy: 'weavejs.api.core.IProgressIndicator'},
					'hasTask': { type: 'Boolean', declaredBy: 'weavejs.api.core.IProgressIndicator'},
					'updateTask': { type: 'void', declaredBy: 'weavejs.api.core.IProgressIndicator'},
					'removeTask': { type: 'void', declaredBy: 'weavejs.api.core.IProgressIndicator'},
					'getNormalizedProgress': { type: 'Number', declaredBy: 'weavejs.api.core.IProgressIndicator'}
				};
			}
		};
	};

}

IProgressIndicator.prototype.CLASS_INFO = { names: [{ name: 'IProgressIndicator', qName: 'weavejs.api.core.IProgressIndicator'}], interfaces: [ILinkableObject] };



