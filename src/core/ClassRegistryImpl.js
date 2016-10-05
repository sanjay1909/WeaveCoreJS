import JS from "../util/JS";
import Language from "../util/Language";

import IClassRegistry from "../api/core/IClassRegistry"

export default class ClassRegistryImpl
{
	constructor()
	{
		this.map_interface_singletonInstance = new JS.Map();
		this.map_interface_singletonImplementation = new JS.Map();
		this.map_interface_implementations = new JS.Map();
		this.map_class_displayName = new JS.Map();
		this.map_name_class = new JS.Map();
		this.map_class_name = new JS.Map();
		this.defaultPackages = [];

		this.registerClass = this.registerClass.bind(this);
		this.getClassName = this.getClassName.bind(this);
		this.getDefinition = this.getDefinition.bind(this);
		this.evalChain = this.evalChain.bind(this);
		this.getClassInfo = this.getClassInfo.bind(this);
		this.registerSingletonImplementation = this.registerSingletonImplementation.bind(this);
		this.getSingletonImplementation = this.getSingletonImplementation.bind(this);
		this.getSingletonInstance = this.getSingletonInstance.bind(this);
		this.registerImplementation = this.registerImplementation.bind(this);
		this.getImplementations = this.getImplementations.bind(this);
		this.getDisplayName = this.getDisplayName.bind(this);
		this.compareDisplayNames = this.compareDisplayNames.bind(this);
		this.verifyImplementation = this.verifyImplementation.bind(this);
	}


	registerClass(definition, qualifiedName, interfaces, displayName)
	{
		interfaces = typeof interfaces !== 'undefined' ? interfaces : null;
		displayName = typeof displayName !== 'undefined' ? displayName : null;
		
		if (!this.map_name_class.has(qualifiedName))
			this.map_name_class.set(qualifiedName, definition);
		
		if (!this.map_class_name.has(definition))
			this.map_class_name.set(definition, qualifiedName);
		
		var shortName = qualifiedName.split('.').pop().split(':').pop();
		if (!this.map_name_class.has(shortName))
			this.map_name_class.set(shortName, definition);
		
		var info;
		var items;
		var item;
		
		if (Object(definition.prototype).hasOwnProperty(ClassRegistryImpl.CLASS_INFO))
			info = definition.prototype[ClassRegistryImpl.CLASS_INFO];
		else
			info = definition.prototype[ClassRegistryImpl.CLASS_INFO] = {};
		
		var found = false;
		items = info[ClassRegistryImpl.NAMES] || (info[ClassRegistryImpl.NAMES] = []);
		
		
		for (var i in items)
		{
			item = items[i];
			{
				if (item[ClassRegistryImpl.QNAME] == qualifiedName) {
					found = true;
					break;
				}
			}}

		if (!found) {
			item = {};
			item[ClassRegistryImpl.NAME] = shortName;
			item[ClassRegistryImpl.QNAME] = qualifiedName;
			items.push(item);
		}
		items = info[ClassRegistryImpl.INTERFACES] || (info[ClassRegistryImpl.INTERFACES] = []);
		for (var i in interfaces)
		{
			item = interfaces[i];
			{
				if (items.indexOf(item) < 0)
					items.push(item);
				this.registerImplementation(item, definition, displayName);
			}}

	};


	getClassName(definition) 
	{
		if (!definition)
			return null;
		
		if (!definition.prototype)
			definition = definition.constructor;
		
		if (definition.prototype && definition.prototype[ClassRegistryImpl.CLASS_INFO])
			return definition.prototype[ClassRegistryImpl.CLASS_INFO].names[0].qName;
		
		if (this.map_class_name.has(definition))
			return this.map_class_name.get(definition);
		
		return definition.name;
	};


	getDefinition(name)
	{
		var def = this.map_name_class.get(name);
		if (def || !name)
			return def;
		
		def = this.evalChain(name);
		
		if (!def) {
			var shortName = name.split('.').pop().split('::').pop();
			let defPackages = this.defaultPackages;
			for (var i in defPackages)
			{
				var pkg = defPackages[i];
				{
					var qName = pkg ? pkg + '.' + shortName : shortName;
					def = this.map_name_class.get(qName) || this.evalChain(qName);
					if (def)
						break;
				}}

		}
		if (def)
			this.map_name_class.set(name, def);
		return def;
	};

	evalChain(name) 
	{
		var chain = name.split('.');
		var def = JS.global;
		for (var i in chain)
		{
			var key = chain[i];
			{
				if (!def)
					break;
				try {
					def = def[key];
				} catch (e) {
					def = undefined;
				}
			}}

		return def;
	};

	getClassInfo(class_or_instance)
	{
		if (!class_or_instance)
			return null;
		
		if (!class_or_instance.prototype)
			class_or_instance = class_or_instance.constructor;
		
		var info = class_or_instance && class_or_instance.prototype && class_or_instance.prototype.FLEXJS_REFLECTION_INFO;
		if (Language.is(info, Function))
		{
			info = info();
			info.variables = info.variables();
			info.accessors = info.accessors();
			info.methods = info.methods();
		}
		return info;
	};


	registerSingletonImplementation(theInterface, theImplementation)
	{
		if (!this.map_interface_singletonImplementation.get(theInterface))
		{
			this.verifyImplementation(theInterface, theImplementation);
			this.map_interface_singletonImplementation.set(theInterface, theImplementation);
		}
		return this.map_interface_singletonImplementation.get(theInterface) == theImplementation;
	};


	getSingletonImplementation(theInterface)
	{
		return this.map_interface_singletonImplementation.get(theInterface);
	};


	getSingletonInstance(theInterface)
	{
		if (!this.map_interface_singletonInstance.get(theInterface))
		{
			var classDef = this.getSingletonImplementation(theInterface);
			if (classDef)
				this.map_interface_singletonInstance.set(theInterface, new classDef());
		}
		return this.map_interface_singletonInstance.get(theInterface);
	};


	registerImplementation(theInterface, theImplementation, displayName)
	{
		displayName = typeof displayName !== 'undefined' ? displayName : null;
		this.verifyImplementation(theInterface, theImplementation);
		var array = this.map_interface_implementations.get(theInterface);
		if (!array)
			this.map_interface_implementations.set(theInterface, array = []);
		if (displayName || !this.map_class_displayName.get(theImplementation))
			this.map_class_displayName.set(theImplementation, displayName || this.getClassName(theImplementation).split(':').pop());
		if (array.indexOf(theImplementation) < 0) {
			array.push(theImplementation);
			array.sort(Language.closure(this.compareDisplayNames, this, 'compareDisplayNames'));
		}
	};


	getImplementations(theInterface)
	{
		var array = this.map_interface_implementations.get(theInterface);
		return array ? array.concat() : [];
	};


	getDisplayName (theImplementation)
	{
		var str = this.map_class_displayName.get(theImplementation);
		return str;
	};

	compareDisplayNames (impl1, impl2)
	{
		var name1 = this.map_class_displayName.get(impl1);
		var name2 = this.map_class_displayName.get(impl2);
		if (name1 < name2)
			return -1;
		if (name1 > name2)
			return 1;
		return 0;
	};

	verifyImplementation(theInterface, theImplementation)
	{
		if (!theInterface)
			throw new Error("interface cannot be " + theInterface);
		if (!theImplementation)
			throw new Error("implementation cannot be " + theImplementation);
		if (!Language.is(theImplementation.prototype, theInterface))
			throw new Error(this.getClassName(theImplementation) + ' does not implement ' + this.getClassName(theInterface));
	};


	/**
	 * Reflection
	 *
	 * @return {Object.<string, Function>}
	 */
	REFLECTION_INFO() {
		return {
			variables: function () {
				return {
					'map_interface_singletonInstance': { type: 'Object'},
					'map_interface_singletonImplementation': { type: 'Object'},
					'map_interface_implementations': { type: 'Object'},
					'map_class_displayName': { type: 'Object'},
					'map_name_class': { type: 'Object'},
					'map_class_name': { type: 'Object'},
					'defaultPackages': { type: 'Array'}
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'ClassRegistryImpl': { type: '', declaredBy: 'ClassRegistryImpl'},
					'registerClass': { type: 'void', declaredBy: 'ClassRegistryImpl'},
					'getClassName': { type: 'String', declaredBy: 'ClassRegistryImpl'},
					'getDefinition': { type: '*', declaredBy: 'ClassRegistryImpl'},
					'getClassInfo': { type: 'Object', declaredBy: 'ClassRegistryImpl'},
					'registerSingletonImplementation': { type: 'Boolean', declaredBy: 'ClassRegistryImpl'},
					'getSingletonImplementation': { type: 'Class', declaredBy: 'ClassRegistryImpl'},
					'getSingletonInstance': { type: '*', declaredBy: 'ClassRegistryImpl'},
					'registerImplementation': { type: 'void', declaredBy: 'ClassRegistryImpl'},
					'getImplementations': { type: 'Array', declaredBy: 'ClassRegistryImpl'},
					'getDisplayName': { type: 'String', declaredBy: 'ClassRegistryImpl'},
					'verifyImplementation': { type: 'void', declaredBy: 'ClassRegistryImpl'}
				};
			}
		};
	};

}

ClassRegistryImpl.prototype.CLASS_INFO = { names: [{ name: 'ClassRegistryImpl', qName: 'ClassRegistryImpl'}], interfaces: [IClassRegistry] };


ClassRegistryImpl.CLASS_INFO = "CLASS_INFO";
ClassRegistryImpl.NAMES = 'names';
ClassRegistryImpl.NAME = 'name';
ClassRegistryImpl.QNAME = 'qName';
ClassRegistryImpl.INTERFACES = 'interfaces';

/**
 * Partitions a list of classes based on which interfaces they implement.
 */
ClassRegistryImpl.partitionClassList = function(classes, interfaces)
{
	interfaces = Array.prototype.slice.call(arguments, 1);


	if (interfaces.length == 1 && Language.is(interfaces[0], Array))
		interfaces = interfaces[0];

	var localFn = function(impl, i, a) {
		if (Language.is(impl.prototype, interfaceClass)) {
			partition.push(impl);
			return false;
		}
		return true;
	};

	var partitions = [];
	for (var i in interfaces)
	{
		var interfaceClass = interfaces[i];
		{
			var partition = [];
			classes = classes.filter(localFn);
			partitions.push(partition);
		}}

	partitions.push(classes);
	return partitions;
};






