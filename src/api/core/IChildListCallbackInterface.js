import ICallbackCollection from "./ICallbackCollection";

export default class IChildListCallbackInterface
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
					'lastObjectAdded': { type: 'ILinkableObject', declaredBy: 'IChildListCallbackInterface'},
					'lastNameAdded': { type: 'String', declaredBy: 'IChildListCallbackInterface'},
					'lastObjectRemoved': { type: 'ILinkableObject', declaredBy: 'IChildListCallbackInterface'},
					'lastNameRemoved': { type: 'String', declaredBy: 'IChildListCallbackInterface'}
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}

IChildListCallbackInterface.prototype.lastObjectAdded;
IChildListCallbackInterface.prototype.lastNameAdded;
IChildListCallbackInterface.prototype.lastObjectRemoved;
IChildListCallbackInterface.prototype.lastNameRemoved;


IChildListCallbackInterface.prototype.CLASS_INFO = { names: [{ name: 'IChildListCallbackInterface', qName: 'IChildListCallbackInterface'}], interfaces: [ICallbackCollection] };

