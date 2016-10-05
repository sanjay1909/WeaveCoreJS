
export default class ILinkableObject
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
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}

ILinkableObject.prototype.CLASS_INFO = { names: [{ name: 'ILinkableObject', qName: 'weavejs.api.core.ILinkableObject'}] };


