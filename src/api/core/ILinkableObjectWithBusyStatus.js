export default class ILinkableObjectWithBusyStatus
{
	constructor()
	{
	}

	isBusy() {};

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
					'isBusy': { type: 'Boolean', declaredBy: 'weavejs.api.core.ILinkableObjectWithBusyStatus'}
				};
			}
		};
	};
}

ILinkableObjectWithBusyStatus.prototype.CLASS_INFO = { names: [{ name: 'ILinkableObjectWithBusyStatus', qName: 'weavejs.api.core.ILinkableObjectWithBusyStatus'}] };

