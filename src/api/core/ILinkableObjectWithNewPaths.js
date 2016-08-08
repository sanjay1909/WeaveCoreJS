export default class ILinkableObjectWithNewPaths
{
	constructor()
	{
	}

	deprecatedPathRewrite(relativePath) {};

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
					'deprecatedPathRewrite': { type: 'Array', declaredBy: 'weavejs.api.core.ILinkableObjectWithNewPaths'}
				};
			}
		};
	};
}

ILinkableObjectWithNewPaths.prototype.CLASS_INFO = { names: [{ name: 'ILinkableObjectWithNewPaths', qName: 'weavejs.api.core.ILinkableObjectWithNewPaths'}] };
