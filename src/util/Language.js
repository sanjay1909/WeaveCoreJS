import JS from "./JS"

export default class Language
{
	constructor()
	{

	}

	REFLECTION_INFO  () {
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
					'isClass': { type: 'Boolean', declaredBy: 'org.apache.flex.utils.Language'},
					'asClass': { type: 'Class', declaredBy: 'org.apache.flex.utils.Language'}
				};
			}
		};
	};

}

Language.prototype.CLASS_INFO = { names: [{ name: 'Language', qName: 'org.apache.flex.utils.Language'}] };

/**
 * as()
 *
 */
Language.as = function(leftOperand, rightOperand, coercion)
{
	coercion = typeof coercion !== 'undefined' ? coercion : null;
	var  error,  itIs,  message;
	coercion = (coercion !== undefined) ? coercion : false;
	itIs = Language.is(leftOperand, rightOperand);
	if (!itIs && coercion)
	{
		message = 'Type Coercion failed';
		if (TypeError)
		{
			error = new TypeError(message);
		}
		else
		{
			error = new Error(message);
		}
		throw error;
	}
	return itIs ? leftOperand : null;
};

/**
 * is()
 *
 */
Language.is = function(leftOperand, rightOperand) {
	var superClass;
	if (leftOperand == null || rightOperand == null)
		return false;
	if (leftOperand instanceof rightOperand)
		return true;
	if (rightOperand === Object)
		return true;
	if (typeof(leftOperand) === 'string')
		return rightOperand === String;
	if (typeof(leftOperand) === 'number')
		return rightOperand === Number;
	if (typeof(leftOperand) === 'boolean')
		return rightOperand === Boolean;

	if (rightOperand === Array)
		return Array.isArray(leftOperand);
	if (leftOperand.CLASS_INFO === undefined)
		return false;
	if (leftOperand.CLASS_INFO.interfaces) {
		if (Language.checkInterfaces(leftOperand, rightOperand)) {
			return true;
		}
	}
	superClass = leftOperand.constructor;
	// todo : this _ comes as its comes flex js code, find the right one
	superClass = superClass.superClass_;
	if (superClass) {
		while (superClass && superClass.CLASS_INFO) {
			if (superClass.CLASS_INFO.interfaces) {
				if (Language.checkInterfaces(superClass, rightOperand)) {
					return true;
				}
			}
			superClass = superClass.constructor;
			// todo : this _ comes as its comes flex js code, find the right one
			superClass = superClass.superClass_;
		}
	}
	return false;
};

/**
 * Helper function for is()
 */
Language.checkInterfaces = function(leftOperand, rightOperand)
{
	var interfaces;
	interfaces = leftOperand.CLASS_INFO.interfaces;
	for (let i = interfaces.length - 1; i > -1; i--)
	{
		if (interfaces[i] === rightOperand) {
			return true;
		}
		if (interfaces[i].prototype.CLASS_INFO.interfaces) {
			var  isit = Language.checkInterfaces(interfaces[i].prototype, rightOperand);
			if (isit)
				return true;
		}
	}
	return false;
};


/**
 * caches closures and returns the one closure
 */
Language.closure = function(fn, object, boundMethodName)
{
	if (object.hasOwnProperty(boundMethodName))
	{
		return object[boundMethodName];
	}
	// todo: check is there any consequence for replacing goog.bind with fn.bind directly
	var boundMethod = fn.bind(object);
	Object.defineProperty(object, boundMethodName, {value:boundMethod});
	return boundMethod;
};


Language.uint = function(value) {
	return value >>> 0;
};

Language._int = function(value) {
	return value >> 0;
};
