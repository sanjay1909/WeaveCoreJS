import JS from "./JS"
import Language from "./Language"

export default class Dictionary2D
{
	constructor(weakPrimaryKeys, weakSecondaryKeys, defaultType)
	{


		weakPrimaryKeys = typeof weakPrimaryKeys !== 'undefined' ? weakPrimaryKeys : false;
		weakSecondaryKeys = typeof weakSecondaryKeys !== 'undefined' ? weakSecondaryKeys : false;
		defaultType = typeof defaultType !== 'undefined' ? defaultType : null;

		this.map = weakPrimaryKeys ? new JS.WeakMap() : new JS.Map();
		this.weak1 = weakPrimaryKeys;
		this.weak2 = weakSecondaryKeys;
		this.defaultType = defaultType;

		this._key2ToRemove;
		this.forEach_fn;
		this.forEach_this;
		this.forEach_key1;
		this.forEach_map2;
		
		this.get = this.get.bind(this);
		this.set = this.set.bind(this);
		this.primaryKeys = this.primaryKeys.bind(this);
		this.secondaryKeys = this.secondaryKeys.bind(this);
		this.removeAllPrimary = this.removeAllPrimary.bind(this);
		this.removeAllSecondary = this.removeAllSecondary.bind(this);
		this.removeAllSecondary_each = this.removeAllSecondary_each.bind(this);
		this.remove = this.remove.bind(this);
		this.forEach = this.forEach.bind(this);
		this.forEach1 = this.forEach1.bind(this);
		this.forEach2 = this.forEach2.bind(this);
		
	};

	get(key1, key2)
	{
		var  value = undefined;
		var map2 = this.map.get(key1);
		if (map2)
			value = map2.get(key2);
		if (value === undefined && this.defaultType) {
			value = new this.defaultType();
			this.set(key1, key2, value);
		}
		return value;
	};

	set(key1, key2, value)
	{
		var map2 = this.map.get(key1);
		if (map2 == null) {
			map2 = this.weak2 ? new JS.WeakMap() : new JS.Map();
			this.map.set(key1, map2);
		}
		map2.set(key2, value);
	};

	primaryKeys() {
		if (this.weak1)
			Dictionary2D.throwWeakIterationError();
		return JS.mapKeys(this.map);
	};

	secondaryKeys(key1) {
		if (this.weak2)
			Dictionary2D.throwWeakIterationError();
		return JS.mapKeys(this.map.get(key1));
	};

	/**
	 * This removes all values associated with the given primary key.
	 */
	removeAllPrimary(key1) {
		this.map['delete'](key1);
	};

	/**
	 * This removes all values associated with the given secondary key
	 */
	removeAllSecondary (key2) {
		if (this.weak1)
			Dictionary2D.throwWeakIterationError();
		this._key2ToRemove = key2;
		this.map.forEach(Language.closure(this.removeAllSecondary_each, this, 'removeAllSecondary_each'), this);
	};

	removeAllSecondary_each(map2, key1) {
		map2['delete'](this._key2ToRemove);
	};

	remove(key1, key2) {
		var /** @type {*} */ value = undefined;
		var /** @type {*} */ map2 = this.map.get(key1);
		if (map2) {
			value = map2.get(key2);
			map2['delete'](key2);
			if (this.weak2 || map2.size)
				return value;
			this.map['delete'](key1);
		}
		return value;
	};

	throwWeakIterationError () {
		throw new Error("WeakMap cannot be iterated over");
	};

	forEach(key1_key2_value, thisArg) {
		if (this.weak1 || this.weak2)
			Dictionary2D.throwWeakIterationError();
		this.forEach_fn = key1_key2_value;
		this.forEach_this = thisArg;
		this.map.forEach(Language.closure(this.forEach1, this, 'forEach1'), this);
		this.forEach_fn = null;
		this.forEach_this = null;
		this.forEach_key1 = null;
		this.forEach_map2 = null;
	};

	forEach1(map2, key1) {
		if (this.forEach_fn == null)
			return;
		this.forEach_key1 = key1;
		this.forEach_map2 = map2;
		map2.forEach(Language.closure(this.forEach2, this, 'forEach2'), this);
	};

	forEach2(value, key2) {
		if (this.forEach_fn != null && this.forEach_fn.call(this.forEach_this, this.forEach_key1, key2, value))
			this.forEach_fn = null;
	};


	REFLECTION_INFO() {
		return {
			variables: function () {
				return {
					'map': { type: 'Object'}
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'Dictionary2D': { type: '', declaredBy: 'weavejs.util.Dictionary2D'},
					'get': { type: '*', declaredBy: 'weavejs.util.Dictionary2D'},
					'set': { type: 'void', declaredBy: 'weavejs.util.Dictionary2D'},
					'primaryKeys': { type: 'Array', declaredBy: 'weavejs.util.Dictionary2D'},
					'secondaryKeys': { type: 'Array', declaredBy: 'weavejs.util.Dictionary2D'},
					'removeAllPrimary': { type: 'void', declaredBy: 'weavejs.util.Dictionary2D'},
					'removeAllSecondary': { type: 'void', declaredBy: 'weavejs.util.Dictionary2D'},
					'remove': { type: '*', declaredBy: 'weavejs.util.Dictionary2D'},
					'forEach': { type: 'void', declaredBy: 'weavejs.util.Dictionary2D'}
				};
			}
		};
	};

}

Dictionary2D.prototype.CLASS_INFO = { names: [{ name: 'Dictionary2D', qName: 'weavejs.util.Dictionary2D'}] };



