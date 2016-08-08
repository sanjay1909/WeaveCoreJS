export default class ILinkableObjectWithNewProperties
{
	constructor()
	{
	}


	REFLECTION_INFO ()
	{
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
					'deprecatedStateMapping': { type: 'Object', declaredBy: 'weavejs.api.core.ILinkableObjectWithNewProperties'}
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}

ILinkableObjectWithNewProperties.prototype.deprecatedStateMapping;
ILinkableObjectWithNewProperties.prototype.CLASS_INFO = { names: [{ name: 'ILinkableObjectWithNewProperties', qName: 'weavejs.api.core.ILinkableObjectWithNewProperties'}] };
