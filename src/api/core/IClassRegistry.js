export default class IClassRegistry
{
	constructor()
	{

	}

	registerClass(definition, qualifiedName, interfaces, displayName) {};
	getClassName(definition) {};
	getDefinition(name) {};
	getClassInfo(class_or_instance) {};
	registerSingletonImplementation(theInterface, theImplementation) {};
	getSingletonImplementation(theInterface) {};
	getSingletonInstance(theInterface) {};
	registerImplementation(theInterface, theImplementation, displayName) {};
	getImplementations(theInterface) {};
	getDisplayName(theImplementation) {};

	REFLECTION_INFO () {
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
					'registerClass': { type: 'void', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getClassName': { type: 'String', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getDefinition': { type: '*', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getClassInfo': { type: 'Object', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'registerSingletonImplementation': { type: 'Boolean', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getSingletonImplementation': { type: 'Class', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getSingletonInstance': { type: '*', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'registerImplementation': { type: 'void', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getImplementations': { type: 'Array', declaredBy: 'weavejs.api.core.IClassRegistry'},
					'getDisplayName': { type: 'String', declaredBy: 'weavejs.api.core.IClassRegistry'}
				};
			}
		};
	};
}

IClassRegistry.prototype.CLASS_INFO = { names: [{ name: 'IClassRegistry', qName: 'weavejs.api.core.IClassRegistry'}] };




