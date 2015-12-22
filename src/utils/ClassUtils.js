if (typeof window === 'undefined') {
    //this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
    this.goog = this.goog || {};
} else {
    //window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
    window.goog = window.goog || {};
}

(function () {

    function ClassUtils() {

    }




    Object.defineProperty(ClassUtils, 'classLookUp', {
        value: {} //className -> class
    });

    Object.defineProperty(ClassUtils, 'classNameLookUp', {
        value: new Map() //class -> className
    });

    Object.defineProperty(ClassUtils, 'classExtendsMap', {
        value: {}
    });

    Object.defineProperty(ClassUtils, 'classImplementMap', {
        value: {} //[className] [classImplement] = true
    });


    /**
     * Inherit the prototype methods from one constructor into another.
     *
     * @param {Function} childCtor Child class.
     * @param {Function} parentCtor Parent class.
     */
    goog.inherits = function (childCtor, parentCtor) {
        /** @constructor */
        function tempCtor() {};
        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        /** @override */
        childCtor.prototype.constructor = childCtor;

        /**
         * Calls superclass constructor/method.
         *
         *
         * @param {!Object} me Should always be "this".
         * @param {string} methodName The method name to call. Calling
         *     superclass constructor can be done with the special string
         *     'constructor'.
         * @param {...*} var_args The arguments to pass to superclass
         *     method/constructor.
         * @return {*} The return value of the superclass method/constructor.
         */
        childCtor.base = function (me, methodName, var_args) {
            // Copying using loop to avoid deop due to passing arguments object to
            // function. This is faster in many JS engines as of late 2014.
            var args = new Array(arguments.length - 2);
            for (var i = 2; i < arguments.length; i++) {
                args[i - 2] = arguments[i];
            }
            return parentCtor.prototype[methodName].apply(me, args);
        };
    };

    goog.base = function (me, opt_methodName, var_args) {
        var caller = arguments.callee.caller;

        /* if (goog.STRICT_MODE_COMPATIBLE || (goog.DEBUG && !caller)) {
           throw Error('arguments.caller not defined.  goog.base() cannot be used ' +
                       'with strict mode code. See ' +
                       'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
         }*/

        if (caller.superClass_) {
            // Copying using loop to avoid deop due to passing arguments object to
            // function. This is faster in many JS engines as of late 2014.
            var ctorArgs = new Array(arguments.length - 1);
            for (var i = 1; i < arguments.length; i++) {
                ctorArgs[i - 1] = arguments[i];
            }
            // This is a constructor. Call the superclass constructor.
            return caller.superClass_.constructor.apply(me, ctorArgs);
        }

        // Copying using loop to avoid deop due to passing arguments object to
        // function. This is faster in many JS engines as of late 2014.
        var args = new Array(arguments.length - 2);
        for (var i = 2; i < arguments.length; i++) {
            args[i - 2] = arguments[i];
        }
        var foundCaller = false;
        for (var ctor = me.constructor; ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
            if (ctor.prototype[opt_methodName] === caller) {
                foundCaller = true;
            } else if (foundCaller) {
                return ctor.prototype[opt_methodName].apply(me, args);
            }
        }

        // If we did not find the caller in the prototype chain, then one of two
        // things happened:
        // 1) The caller is an instance method.
        // 2) This method was not called by the right caller.
        if (me[opt_methodName] === caller) {
            return me.constructor.prototype[opt_methodName].apply(me, args);
        } else {
            throw Error(
                'ClassUtils.base called from a method of one name ' +
                'to a method of a different name');
        }
    };


    /**
     * caches closures and returns the one closure
     *
     * @export
     * @param {Function} fn The method on the instance.
     * @param {Object} object The instance.
     * @param {string} boundMethodName The name to use to cache the closure.
     * @return {Function} The closure.
     */
    goog.closure = function (fn, object, boundMethodName) {
        if (object.hasOwnProperty(boundMethodName)) {
            return object[boundMethodName];
        }
        var boundMethod = goog.bind(fn, object);
        Object.defineProperty(object, boundMethodName, {
            value: boundMethod
        });
        return boundMethod;
    };





    goog.bind = function (fn, selfObj, var_args) {
        // TODO(nicksantos): narrow the type signature.
        if (Function.prototype.bind &&
            // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
            // extension environment. This means that for Chrome extensions, they get
            // the implementation of Function.prototype.bind that calls goog.bind
            // instead of the native one. Even worse, we don't want to introduce a
            // circular dependency between goog.bind and Function.prototype.bind, so
            // we have to hack this to make sure it works correctly.
            Function.prototype.bind.toString().indexOf('native code') != -1) {
            goog.bind = goog.bindNative_;
        } else {
            goog.bind = goog.bindJs_;
        }
        return goog.bind.apply(null, arguments);
    };

    /**
     * A native implementation of goog.bind.
     * @param {Function} fn A function to partially apply.
     * @param {Object|undefined} selfObj Specifies the object which this should
     *     point to when the function is run.
     * @param {...*} var_args Additional arguments that are partially applied to the
     *     function.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     * @private
     * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
     *     deprecated because some people have declared a pure-JS version.
     *     Only the pure-JS version is truly deprecated.
     */
    goog.bindNative_ = function (fn, selfObj, var_args) {
        return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
    };


    /**
     * A pure-JS implementation of goog.bind.
     * @param {Function} fn A function to partially apply.
     * @param {Object|undefined} selfObj Specifies the object which this should
     *     point to when the function is run.
     * @param {...*} var_args Additional arguments that are partially applied to the
     *     function.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     * @private
     */
    goog.bindJs_ = function (fn, selfObj, var_args) {
        if (!fn) {
            throw new Error();
        }

        if (arguments.length > 2) {
            var boundArgs = Array.prototype.slice.call(arguments, 2);
            return function () {
                // Prepend the bound arguments to the current arguments.
                var newArgs = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(newArgs, boundArgs);
                return fn.apply(selfObj, newArgs);
            };

        } else {
            return function () {
                return fn.apply(selfObj, arguments);
            };
        }
    };


    /**
     * superGetter calls the getter on the given class' superclass.
     *
     * @export
     * @param {Object} clazz The class.
     * @param {Object} pthis The this pointer.
     * @param {string} prop The name of the getter.
     * @return {Object}
     */
    ClassUtils.superGetter = function (clazz, pthis, prop) {
        var superClass = clazz.superClass_;
        var superdesc = Object.getOwnPropertyDescriptor(superClass, prop);
        while (superdesc == null) {
            superClass = superClass.constructor.superClass_;
            superdesc = Object.getOwnPropertyDescriptor(superClass, prop);
        }
        return superdesc.get.call(pthis);
    };


    /**
     * superSetter calls the setter on the given class' superclass.
     *
     * @export
     * @param {Object} clazz The class.
     * @param {Object} pthis The this pointer.
     * @param {string} prop The name of the getter.
     * @param {Object} value The value.
     */
    ClassUtils.superSetter = function (clazz, pthis, prop, value) {
        var superClass = clazz.superClass_;
        var superdesc = Object.getOwnPropertyDescriptor(superClass, prop);
        while (superdesc == null) {
            superClass = superClass.constructor.superClass_;
            superdesc = Object.getOwnPropertyDescriptor(superClass, prop);
        }
        superdesc.set.apply(pthis, [value]);
    };

    ClassUtils.registerClass = function (className, klass) {
        if (!ClassUtils.classLookUp[className]) {
            ClassUtils.classLookUp[className] = klass;
        } else {
            if (ClassUtils.classLookUp[className] === klass) {
                throw new Error(className + ' is registered already with ' + ClassUtils.classLookUp[className].constructor.name);
            }
        }

        if (!ClassUtils.classNameLookUp.get(klass))
            ClassUtils.classNameLookUp.set(klass, className);
    }

    // A simple bind function that takes an Object `obj`
    // and a method `m` and returns a function that will
    // lookup the method `m` in `o` and call it with the
    // object `o` as the context.
    ClassUtils.bind = function (obj, method) {
        return function () {
            return method.apply(obj, Array.prototype.slice.call(arguments));
        };
    };




    ClassUtils.registerImplementation = function (className, implementingClassName) {
        if (!ClassUtils.classImplementMap[className]) {
            ClassUtils.classImplementMap[className] = {};
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        } else if (!ClassUtils.classImplementMap[className][implementingClassName]) {
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        }
    }

    /*ClassUtils.is = function (linkableObject, typeKlasss) {
        if (linkableObject instanceof typeKlasss) { // for class files which aren't manually registered yet
            return true;
        }
        var className = ClassUtils.classNameLookUp.get(linkableObject.constructor);
        if (!className) throw new Errorr('Sessioned Classes can alone use this function.' + typeKlasss.constructor.name + ' is not registered');
        var typeClassName = ClassUtils.classNameLookUp.get(typeKlasss);
        if (!typeClassName) throw new Errorr('Sessioned Classes can alone use this function.' + typeKlasss.constructor.name + ' is not registered');

        if (!ClassUtils.classImplementMap[className]) {
            return false;
        } else if (!ClassUtils.classImplementMap[className][typeClassName]) {
            return false;
        } else {
            return true;
        }
    }*/


    /**
     * Implementation of "classDef is Class"
     * @export
     * @param {Object} classDef
     * @return {boolean}
     */
    ClassUtils.isClass = function (classDef) {
        return typeof (classDef) === 'function' && classDef.prototype && classDef.prototype.constructor === classDef;
    };



    /**
     * is()
     *
     * @export
     * @param {?} leftOperand The lefthand operand of the
     *     binary as operator in AS3.
     * @param {?} rightOperand The righthand operand of the
     *     binary operator in AS3.
     * @return {boolean}
     */
    ClassUtils.is = function (leftOperand, rightOperand) {
        var checkInterfaces, superClass;

        if (leftOperand == null)
            return false;

        if (leftOperand && rightOperand == null) {
            return false;
        }

        checkInterfaces = function (left) {
            var i, interfaces;

            interfaces = left.CLASS_INFO.interfaces;
            for (i = interfaces.length - 1; i > -1; i--) {
                if (interfaces[i] === rightOperand) {
                    return true;
                }

                if (interfaces[i].prototype.CLASS_INFO.interfaces) {
                    var isit = checkInterfaces(new interfaces[i]());
                    if (isit) return true;
                }
            }

            return false;
        };

        if ((rightOperand === String && typeof leftOperand === 'string') ||
            (leftOperand instanceof(rightOperand))) {
            return true;
        }
        if (typeof leftOperand === 'string')
            return false; // right was not String otherwise exit above
        if (typeof leftOperand === 'number')
            return rightOperand === Number;
        if (rightOperand === Array && Array.isArray(leftOperand))
            return true;
        if (leftOperand.CLASS_INFO === undefined)
            return false; // could be a function but not an instance
        if (leftOperand.CLASS_INFO.interfaces) {
            if (checkInterfaces(leftOperand)) {
                return true;
            }
        }

        superClass = leftOperand.constructor.superClass_;
        if (superClass) {
            while (superClass && superClass.CLASS_INFO) {
                if (superClass.CLASS_INFO.interfaces) {
                    if (checkInterfaces(superClass)) {
                        return true;
                    }
                }
                superClass = superClass.constructor.superClass_;
            }
        }

        return false;
    };

    ClassUtils.getClassDefinition = function (className) {
        if (ClassUtils.classLookUp[className])
            return ClassUtils.classLookUp[className];
        else
            throw new Error(className + ' is not registered with weave yet');
    }

    ClassUtils.hasClassDefinition = function (className) {
        if (ClassUtils.classLookUp[className])
            return true;
        else
            return false;
    }

    ClassUtils.getClassName = function (classDefn) {
        //TO-DO: need to figure out why look up creates the object rather just using as key till then use NS and CLASSNAME
        var className = (classDefn.constructor && classDefn.constructor.NS) ? classDefn.constructor.NS + '.' + classDefn.constructor.CLASS_NAME : ClassUtils.classNameLookUp.get(classDefn);
        return className;

    }

    /**
     * @param classQName A qualified class name of a class in question.
     * @param extendsQName A qualified class name that the class specified by classQName may extend.
     * @return true if clasQName extends extendsQName, or if the two QNames are equal.
     */
    ClassUtils.classExtends = function (classQName, extendsQName) {
        if (classQName === extendsQName)
            return true;


        /* try {
             if (!ClassUtils.cacheClassInfo(classQName))
                 return false;
             return ClassUtils.classExtendsMap[classQName][extendsQName] !== undefined;
         } catch (e) {
             console.log(e.stack);
         }*/
        return ClassUtils.getClassDefinition(classQName).prototype instanceof ClassUtils.getClassDefinition(extendsQName)
    }


    /**
     * This function will populate the  classExtendsMap for the given qualified class name.
     * @param classQName A qualified class name.
     * @return true if the class info has been cached.
     */
    ClassUtils.cacheClassInfo = function (classQName) {
        if (ClassUtils.classExtendsMap[classQName] !== undefined)
            return true; // already cached

        var classDef = ClassUtils.getClassDefinition(classQName);
        if (classDef === null || classDef === undefined)
            return false;


        var eMap = new Object();
        var _extends = classDef.prototype;

        while (_extends) {
            if (ClassUtils.getClassName(_extends))
                eMap[ClassUtils.getClassName(_extends)] = true;
            _extends = _extends.prototype ? _extends.prototype : _extends.__proto__;
        }
        ClassUtils.classExtendsMap[classQName] = eMap;

        return true; // successfully cached
    }

    weavecore.ClassUtils = ClassUtils;
    //WeaveAPI.ClassUtils = new ClassUtils();

}());
