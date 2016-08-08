
export default class IDisposableObject
{

	constructor()
	{

	}
	dispose() {};

	FLEXJS_REFLECTION_INFO() {
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
					'dispose': { type: 'void', declaredBy: 'weavejs.api.core.IDisposableObject'}
				};
			}
		};
	};

}

IDisposableObject.prototype.CLASS_INFO = { names: [{ name: 'IDisposableObject', qName: 'weavejs.api.core.IDisposableObject'}] };


