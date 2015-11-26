if (typeof window === 'undefined') {
    //this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    //window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
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
    })

    Object.defineProperty(ClassUtils, 'classImplementMap', {
        value: {} //[className] [classImplement] = true
    })



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



    ClassUtils.registerImplementation = function (className, implementingClassName) {
        if (!ClassUtils.classImplementMap[className]) {
            ClassUtils.classImplementMap[className] = {};
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        } else if (!ClassUtils.classImplementMap[className][implementingClassName]) {
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        }
    }

    ClassUtils.is = function (linkableObject, typeKlasss) {
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
    }

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

Array.CASEINSENSITIVE = 1;
Array.DESCENDING = 2;
Array.UNIQUESORT = 4;
Array.RETURNINDEXEDARRAY = 8;
Array.NUMERIC = 16;

(function () {
    var dup_fn = function (field, field_options) {
        var filtered = (field_options & Array.NUMERIC) ? this.map(function (item) {
            return item[field].toFloat();
        }) : (field_options & Array.CASEINSENSITIVE) ? this.map(function (item) {
            return item[field].toLowerCase();
        }) : this.map(function (item) {
            return item[field];
        });
        return filtered.length !== [].combine(filtered).length;
    };

    var sort_fn = function (item_a, item_b, fields, options) {
        return (function sort_by(fields, options) {
            var ret, a, b, sub_fields,
                opts = options[0];

            if (fields[0].constructor === Number)
                sub_fields = [fields[0]];
            else
                sub_fields = fields[0].match(/[^.]+/g);

            (function get_values(s_fields, s_a, s_b) {

                var field = s_fields[0];
                console.log(s_a, s_fields, field);
                if (s_fields.length > 1) {
                    get_values(s_fields.slice(1), s_a[field], s_b[field]);
                } else {
                    console.log(s_a[field]);
                    a = s_a[field].toString();
                    b = s_b[field].toString();
                }
            })(sub_fields, item_a, item_b);

            if (opts & Array.NUMERIC) {
                ret = (Number(a) - Number(b));
            } else {
                if (opts & Array.CASEINSENSITIVE) {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                }

                ret = (a > b) ? 1 : (a < b) ? -1 : 0;
            }

            if ((ret === 0) && (fields.length > 1)) {
                ret = sort_by(fields.slice(1), options.slice(1));
            } else if (opts & Array.DESCENDING) {
                ret *= -1;
            }

            return ret;
        })(fields, options);
    };

    Array.prototype.sortOn = function (fields, options) {


        fields = (fields === undefined) ? [] : fields;
        options = (options === undefined) ? [] : options;
        if (options.length !== fields.length) options = [];

        if ((options[0] & Array.UNIQUESORT) && (fields.some(function (field, i) {
                return dup_fn(field, options[i]);
            }))) return 0;

        var curry_sort = function (item_a, item_b) {
            return sort_fn(item_a, item_b, fields, options);
        };

        if (options[0] & Array.RETURNINDEXEDARRAY) {
            var tmp = [].concat(this);
            tmp.sort(curry_sort);
            var result = [];
            var l = this.length;
            for (var i = 0; i < l; i++) {
                var index = tmp.indexOf(this[i]);
                result.push(index);
            }
            return result;
        } else
            return this.sort(curry_sort);
    }

})();

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {

    /**
     * This class is a wrapper for a weak reference to an object.
     * See the documentation for the Dictionary class for more info about weak references.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function WeakReference(value) {
        value = (value === undefined) ? null : value;
        /**
         * The reference is stored as a key in this Dictionary, which uses the weakKeys option.
         */
        this.dictionary = new Map();
        //this._keyObj = {};

        /**
         * A weak reference to an object.
         */
        Object.defineProperty(this, 'value', {
            get: function () {
                var keys = this.dictionary.keys();
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i]
                    return key;
                }

                return null;
            },
            set: function (newValue) {
                var keys = this.dictionary.keys();
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i]
                    if (key === newValue)
                        return;
                    this.dictionary.delete(key);
                }

                if (newValue !== null) {
                    this.dictionary.set(newValue, null);
                }
            }

        });

        this.value = value;

    }

    weavecore.WeakReference = WeakReference

}());

/*
 * Event
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 * Copyright (c) 2010 gskinner.com, inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A collection of Classes that are shared across all the CreateJS libraries.  The classes are included in the minified
 * files of each library and are available on the createsjs namespace directly.
 *
 * <h4>Example</h4>
 *
 *      myObject.addEventListener("change", createjs.proxy(myMethod, scope));
 *
 * @module CreateJS
 * @main CreateJS
 */

// namespace:
if (typeof window === 'undefined') {
    this.createjs = this.createjs || {};
} else {
    window.createjs = window.createjs || {};
}

(function () {
    "use strict";

    // constructor:
    /**
     * Contains properties and methods shared by all events for use with
     * {{#crossLink "EventDispatcher"}}{{/crossLink}}.
     *
     * Note that Event objects are often reused, so you should never
     * rely on an event object's state outside of the call stack it was received in.
     * @class Event
     * @param {String} type The event type.
     * @param {Boolean} bubbles Indicates whether the event will bubble through the display list.
     * @param {Boolean} cancelable Indicates whether the default behaviour of this event can be cancelled.
     * @constructor
     **/
    function Event(type, bubbles, cancelable) {


        // public properties:
        /**
         * The type of event.
         * @property type
         * @type String
         **/
        this.type = type;

        /**
         * The object that generated an event.
         * @property target
         * @type Object
         * @default null
         * @readonly
         */
        this.target = null;

        /**
         * The current target that a bubbling event is being dispatched from. For non-bubbling events, this will
         * always be the same as target. For example, if childObj.parent = parentObj, and a bubbling event
         * is generated from childObj, then a listener on parentObj would receive the event with
         * target=childObj (the original target) and currentTarget=parentObj (where the listener was added).
         * @property currentTarget
         * @type Object
         * @default null
         * @readonly
         */
        this.currentTarget = null;

        /**
         * For bubbling events, this indicates the current event phase:<OL>
         * 	<LI> capture phase: starting from the top parent to the target</LI>
         * 	<LI> at target phase: currently being dispatched from the target</LI>
         * 	<LI> bubbling phase: from the target to the top parent</LI>
         * </OL>
         * @property eventPhase
         * @type Number
         * @default 0
         * @readonly
         */
        this.eventPhase = 0;

        /**
         * Indicates whether the event will bubble through the display list.
         * @property bubbles
         * @type Boolean
         * @default false
         * @readonly
         */
        this.bubbles = !!bubbles;

        /**
         * Indicates whether the default behaviour of this event can be cancelled via
         * {{#crossLink "Event/preventDefault"}}{{/crossLink}}. This is set via the Event constructor.
         * @property cancelable
         * @type Boolean
         * @default false
         * @readonly
         */
        this.cancelable = !!cancelable;

        /**
         * The epoch time at which this event was created.
         * @property timeStamp
         * @type Number
         * @default 0
         * @readonly
         */
        this.timeStamp = (new Date()).getTime();

        /**
         * Indicates if {{#crossLink "Event/preventDefault"}}{{/crossLink}} has been called
         * on this event.
         * @property defaultPrevented
         * @type Boolean
         * @default false
         * @readonly
         */
        this.defaultPrevented = false;

        /**
         * Indicates if {{#crossLink "Event/stopPropagation"}}{{/crossLink}} or
         * {{#crossLink "Event/stopImmediatePropagation"}}{{/crossLink}} has been called on this event.
         * @property propagationStopped
         * @type Boolean
         * @default false
         * @readonly
         */
        this.propagationStopped = false;

        /**
         * Indicates if {{#crossLink "Event/stopImmediatePropagation"}}{{/crossLink}} has been called
         * on this event.
         * @property immediatePropagationStopped
         * @type Boolean
         * @default false
         * @readonly
         */
        this.immediatePropagationStopped = false;

        /**
         * Indicates if {{#crossLink "Event/remove"}}{{/crossLink}} has been called on this event.
         * @property removed
         * @type Boolean
         * @default false
         * @readonly
         */
        this.removed = false;
    }
    var p = Event.prototype;

    /**
     * <strong>REMOVED</strong>. Removed in favor of using `MySuperClass_constructor`.
     * See {{#crossLink "Utility Methods/extend"}}{{/crossLink}} and {{#crossLink "Utility Methods/promote"}}{{/crossLink}}
     * for details.
     *
     * There is an inheritance tutorial distributed with EaselJS in /tutorials/Inheritance.
     *
     * @method initialize
     * @protected
     * @deprecated
     */
    // p.initialize = function() {}; // searchable for devs wondering where it is.

    // public methods:
    /**
     * Sets {{#crossLink "Event/defaultPrevented"}}{{/crossLink}} to true.
     * Mirrors the DOM event standard.
     * @method preventDefault
     **/
    p.preventDefault = function () {
        this.defaultPrevented = this.cancelable && true;
    };

    /**
     * Sets {{#crossLink "Event/propagationStopped"}}{{/crossLink}} to true.
     * Mirrors the DOM event standard.
     * @method stopPropagation
     **/
    p.stopPropagation = function () {
        this.propagationStopped = true;
    };

    /**
     * Sets {{#crossLink "Event/propagationStopped"}}{{/crossLink}} and
     * {{#crossLink "Event/immediatePropagationStopped"}}{{/crossLink}} to true.
     * Mirrors the DOM event standard.
     * @method stopImmediatePropagation
     **/
    p.stopImmediatePropagation = function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };

    /**
     * Causes the active listener to be removed via removeEventListener();
     *
     * 		myBtn.addEventListener("click", function(evt) {
     * 			// do stuff...
     * 			evt.remove(); // removes this listener.
     * 		});
     *
     * @method remove
     **/
    p.remove = function () {
        this.removed = true;
    };

    /**
     * Returns a clone of the Event instance.
     * @method clone
     * @return {Event} a clone of the Event instance.
     **/
    p.clone = function () {
        return new Event(this.type, this.bubbles, this.cancelable);
    };

    /**
     * Provides a chainable shortcut method for setting a number of properties on the instance.
     *
     * @method set
     * @param {Object} props A generic object containing properties to copy to the instance.
     * @return {Event} Returns the instance the method is called on (useful for chaining calls.)
     * @chainable
     */
    p.set = function (props) {
        for (var n in props) {
            this[n] = props[n];
        }
        return this;
    };

    /**
     * Returns a string representation of this object.
     * @method toString
     * @return {String} a string representation of the instance.
     **/
    p.toString = function () {
        return "[Event (type=" + this.type + ")]";
    };

    createjs.Event = Event;
}());

/*
 * EventDispatcher
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 * Copyright (c) 2010 gskinner.com, inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @module CreateJS
 */

// namespace:
if (typeof window === 'undefined') {
    this.createjs = this.createjs || {};
} else {
    window.createjs = window.createjs || {};
}

(function () {
    "use strict";


    // constructor:
    /**
     * EventDispatcher provides methods for managing queues of event listeners and dispatching events.
     *
     * You can either extend EventDispatcher or mix its methods into an existing prototype or instance by using the
     * EventDispatcher {{#crossLink "EventDispatcher/initialize"}}{{/crossLink}} method.
     *
     * Together with the CreateJS Event class, EventDispatcher provides an extended event model that is based on the
     * DOM Level 2 event model, including addEventListener, removeEventListener, and dispatchEvent. It supports
     * bubbling / capture, preventDefault, stopPropagation, stopImmediatePropagation, and handleEvent.
     *
     * EventDispatcher also exposes a {{#crossLink "EventDispatcher/on"}}{{/crossLink}} method, which makes it easier
     * to create scoped listeners, listeners that only run once, and listeners with associated arbitrary data. The
     * {{#crossLink "EventDispatcher/off"}}{{/crossLink}} method is merely an alias to
     * {{#crossLink "EventDispatcher/removeEventListener"}}{{/crossLink}}.
     *
     * Another addition to the DOM Level 2 model is the {{#crossLink "EventDispatcher/removeAllEventListeners"}}{{/crossLink}}
     * method, which can be used to listeners for all events, or listeners for a specific event. The Event object also
     * includes a {{#crossLink "Event/remove"}}{{/crossLink}} method which removes the active listener.
     *
     * <h4>Example</h4>
     * Add EventDispatcher capabilities to the "MyClass" class.
     *
     *      EventDispatcher.initialize(MyClass.prototype);
     *
     * Add an event (see {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}).
     *
     *      instance.addEventListener("eventName", handlerMethod);
     *      function handlerMethod(event) {
     *          console.log(event.target + " Was Clicked");
     *      }
     *
     * <b>Maintaining proper scope</b><br />
     * Scope (ie. "this") can be be a challenge with events. Using the {{#crossLink "EventDispatcher/on"}}{{/crossLink}}
     * method to subscribe to events simplifies this.
     *
     *      instance.addEventListener("click", function(event) {
     *          console.log(instance == this); // false, scope is ambiguous.
     *      });
     *
     *      instance.on("click", function(event) {
     *          console.log(instance == this); // true, "on" uses dispatcher scope by default.
     *      });
     *
     * If you want to use addEventListener instead, you may want to use function.bind() or a similar proxy to manage scope.
     *
     *
     * @class EventDispatcher
     * @constructor
     **/
    function EventDispatcher() {


        // private properties:
        /**
         * @protected
         * @property _listeners
         * @type Object
         **/
        this._listeners = null;

        /**
         * @protected
         * @property _captureListeners
         * @type Object
         **/
        this._captureListeners = null;
    }
    var p = EventDispatcher.prototype;

    /**
     * <strong>REMOVED</strong>. Removed in favor of using `MySuperClass_constructor`.
     * See {{#crossLink "Utility Methods/extend"}}{{/crossLink}} and {{#crossLink "Utility Methods/promote"}}{{/crossLink}}
     * for details.
     *
     * There is an inheritance tutorial distributed with EaselJS in /tutorials/Inheritance.
     *
     * @method initialize
     * @protected
     * @deprecated
     */
    // p.initialize = function() {}; // searchable for devs wondering where it is.


    // static public methods:
    /**
     * Static initializer to mix EventDispatcher methods into a target object or prototype.
     *
     * 		EventDispatcher.initialize(MyClass.prototype); // add to the prototype of the class
     * 		EventDispatcher.initialize(myObject); // add to a specific instance
     *
     * @method initialize
     * @static
     * @param {Object} target The target object to inject EventDispatcher methods into. This can be an instance or a
     * prototype.
     **/
    EventDispatcher.initialize = function (target) {
        target.addEventListener = p.addEventListener;
        target.on = p.on;
        target.removeEventListener = target.off = p.removeEventListener;
        target.removeAllEventListeners = p.removeAllEventListeners;
        target.hasEventListener = p.hasEventListener;
        target.dispatchEvent = p.dispatchEvent;
        target._dispatchEvent = p._dispatchEvent;
        target.willTrigger = p.willTrigger;
    };


    // public methods:
    /**
     * Adds the specified event listener. Note that adding multiple listeners to the same function will result in
     * multiple callbacks getting fired.
     *
     * <h4>Example</h4>
     *
     *      displayObject.addEventListener("click", handleClick);
     *      function handleClick(event) {
     *         // Click happened.
     *      }
     *
     * @method addEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @return {Function | Object} Returns the listener for chaining or assignment.
     **/
    p.addEventListener = function (type, listener, useCapture) {
        var listeners;
        if (useCapture) {
            listeners = this._captureListeners = this._captureListeners || {};
        } else {
            listeners = this._listeners = this._listeners || {};
        }
        var arr = listeners[type];
        if (arr) {
            this.removeEventListener(type, listener, useCapture);
        }
        arr = listeners[type]; // remove may have deleted the array
        if (!arr) {
            listeners[type] = [listener];
        } else {
            arr.push(listener);
        }
        return listener;
    };

    /**
     * A shortcut method for using addEventListener that makes it easier to specify an execution scope, have a listener
     * only run once, associate arbitrary data with the listener, and remove the listener.
     *
     * This method works by creating an anonymous wrapper function and subscribing it with addEventListener.
     * The created anonymous function is returned for use with .removeEventListener (or .off).
     *
     * <h4>Example</h4>
     *
     * 		var listener = myBtn.on("click", handleClick, null, false, {count:3});
     * 		function handleClick(evt, data) {
     * 			data.count -= 1;
     * 			console.log(this == myBtn); // true - scope defaults to the dispatcher
     * 			if (data.count == 0) {
     * 				alert("clicked 3 times!");
     * 				myBtn.off("click", listener);
     * 				// alternately: evt.remove();
     * 			}
     * 		}
     *
     * @method on
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param {Object} [scope] The scope to execute the listener in. Defaults to the dispatcher/currentTarget for function listeners, and to the listener itself for object listeners (ie. using handleEvent).
     * @param {Boolean} [once=false] If true, the listener will remove itself after the first time it is triggered.
     * @param {*} [data] Arbitrary data that will be included as the second parameter when the listener is called.
     * @param {Boolean} [useCapture=false] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @return {Function} Returns the anonymous function that was created and assigned as the listener. This is needed to remove the listener later using .removeEventListener.
     **/
    p.on = function (type, listener, scope, once, data, useCapture) {
        if (listener.handleEvent) {
            scope = scope || listener;
            listener = listener.handleEvent;
        }
        scope = scope || this;
        return this.addEventListener(type, function (evt) {
            listener.call(scope, evt, data);
            once && evt.remove();
        }, useCapture);
    };

    /**
     * Removes the specified event listener.
     *
     * <b>Important Note:</b> that you must pass the exact function reference used when the event was added. If a proxy
     * function, or function closure is used as the callback, the proxy/closure reference must be used - a new proxy or
     * closure will not work.
     *
     * <h4>Example</h4>
     *
     *      displayObject.removeEventListener("click", handleClick);
     *
     * @method removeEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener The listener function or object.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     **/
    p.removeEventListener = function (type, listener, useCapture) {
        var listeners = useCapture ? this._captureListeners : this._listeners;
        if (!listeners) {
            return;
        }
        var arr = listeners[type];
        if (!arr) {
            return;
        }
        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] == listener) {
                if (l == 1) {
                    delete(listeners[type]);
                } // allows for faster checks.
                else {
                    arr.splice(i, 1);
                }
                break;
            }
        }
    };

    /**
     * A shortcut to the removeEventListener method, with the same parameters and return value. This is a companion to the
     * .on method.
     *
     * @method off
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener The listener function or object.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     **/
    p.off = p.removeEventListener;

    /**
     * Removes all listeners for the specified type, or all listeners of all types.
     *
     * <h4>Example</h4>
     *
     *      // Remove all listeners
     *      displayObject.removeAllEventListeners();
     *
     *      // Remove all click listeners
     *      displayObject.removeAllEventListeners("click");
     *
     * @method removeAllEventListeners
     * @param {String} [type] The string type of the event. If omitted, all listeners for all types will be removed.
     **/
    p.removeAllEventListeners = function (type) {
        if (!type) {
            this._listeners = this._captureListeners = null;
        } else {
            if (this._listeners) {
                delete(this._listeners[type]);
            }
            if (this._captureListeners) {
                delete(this._captureListeners[type]);
            }
        }
    };

    /**
     * Dispatches the specified event to all listeners.
     *
     * <h4>Example</h4>
     *
     *      // Use a string event
     *      this.dispatchEvent("complete");
     *
     *      // Use an Event instance
     *      var event = new createjs.Event("progress");
     *      this.dispatchEvent(event);
     *
     * @method dispatchEvent
     * @param {Object | String | Event} eventObj An object with a "type" property, or a string type.
     * While a generic object will work, it is recommended to use a CreateJS Event instance. If a string is used,
     * dispatchEvent will construct an Event instance with the specified type.
     * @return {Boolean} Returns the value of eventObj.defaultPrevented.
     **/
    p.dispatchEvent = function (eventObj) {
        if (typeof eventObj == "string") {
            // won't bubble, so skip everything if there's no listeners:
            var listeners = this._listeners;
            if (!listeners || !listeners[eventObj]) {
                return false;
            }
            eventObj = new createjs.Event(eventObj);
        } else if (eventObj.target && eventObj.clone) {
            // redispatching an active event object, so clone it:
            eventObj = eventObj.clone();
        }
        try {
            eventObj.target = this;
        } catch (e) {} // try/catch allows redispatching of native events

        if (!eventObj.bubbles || !this.parent) {
            this._dispatchEvent(eventObj, 2);
        } else {
            var top = this,
                list = [top];
            while (top.parent) {
                list.push(top = top.parent);
            }
            var i, l = list.length;

            // capture & atTarget
            for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                list[i]._dispatchEvent(eventObj, 1 + (i == 0));
            }
            // bubbling
            for (i = 1; i < l && !eventObj.propagationStopped; i++) {
                list[i]._dispatchEvent(eventObj, 3);
            }
        }
        return eventObj.defaultPrevented;
    };

    /**
     * Indicates whether there is at least one listener for the specified event type.
     * @method hasEventListener
     * @param {String} type The string type of the event.
     * @return {Boolean} Returns true if there is at least one listener for the specified event.
     **/
    p.hasEventListener = function (type) {
        var listeners = this._listeners,
            captureListeners = this._captureListeners;
        return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
    };

    /**
     * Indicates whether there is at least one listener for the specified event type on this object or any of its
     * ancestors (parent, parent's parent, etc). A return value of true indicates that if a bubbling event of the
     * specified type is dispatched from this object, it will trigger at least one listener.
     *
     * This is similar to {{#crossLink "EventDispatcher/hasEventListener"}}{{/crossLink}}, but it searches the entire
     * event flow for a listener, not just this object.
     * @method willTrigger
     * @param {String} type The string type of the event.
     * @return {Boolean} Returns `true` if there is at least one listener for the specified event.
     **/
    p.willTrigger = function (type) {
        var o = this;
        while (o) {
            if (o.hasEventListener(type)) {
                return true;
            }
            o = o.parent;
        }
        return false;
    };

    /**
     * @method toString
     * @return {String} a string representation of the instance.
     **/
    p.toString = function () {
        return "[EventDispatcher]";
    };


    // private methods:
    /**
     * @method _dispatchEvent
     * @param {Object | String | Event} eventObj
     * @param {Object} eventPhase
     * @protected
     **/
    p._dispatchEvent = function (eventObj, eventPhase) {
        var l, listeners = (eventPhase == 1) ? this._captureListeners : this._listeners;
        if (eventObj && listeners) {
            var arr = listeners[eventObj.type];
            if (!arr || !(l = arr.length)) {
                return;
            }
            try {
                eventObj.currentTarget = this;
            } catch (e) {}
            try {
                eventObj.eventPhase = eventPhase;
            } catch (e) {}
            eventObj.removed = false;

            arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
            for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                var o = arr[i];
                if (o.handleEvent) {
                    o.handleEvent(eventObj);
                } else {
                    o(eventObj);
                }
                if (eventObj.removed) {
                    this.off(eventObj.type, o, eventPhase == 1);
                    eventObj.removed = false;
                }
            }
        }
    };


    createjs.EventDispatcher = EventDispatcher;
}());

/*
 * Ticker
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 * Copyright (c) 2010 gskinner.com, inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @module CreateJS
 */

// namespace:
if (typeof window === 'undefined') {
    this.createjs = this.createjs || {};
} else {
    window.createjs = window.createjs || {};
}

(function () {
    "use strict";


    // constructor:
    /**
     * The Ticker provides a centralized tick or heartbeat broadcast at a set interval. Listeners can subscribe to the tick
     * event to be notified when a set time interval has elapsed.
     *
     * Note that the interval that the tick event is called is a target interval, and may be broadcast at a slower interval
     * when under high CPU load. The Ticker class uses a static interface (ex. `Ticker.framerate = 30;`) and
     * can not be instantiated.
     *
     * <h4>Example</h4>
     *
     *      createjs.Ticker.addEventListener("tick", handleTick);
     *      function handleTick(event) {
     *          // Actions carried out each tick (aka frame)
     *          if (!event.paused) {
     *              // Actions carried out when the Ticker is not paused.
     *          }
     *      }
     *
     * @class Ticker
     * @uses EventDispatcher
     * @static
     **/
    function Ticker() {
        throw "Ticker cannot be instantiated.";
    }


    // constants:
    /**
     * In this mode, Ticker uses the requestAnimationFrame API, but attempts to synch the ticks to target framerate. It
     * uses a simple heuristic that compares the time of the RAF return to the target time for the current frame and
     * dispatches the tick when the time is within a certain threshold.
     *
     * This mode has a higher variance for time between frames than TIMEOUT, but does not require that content be time
     * based as with RAF while gaining the benefits of that API (screen synch, background throttling).
     *
     * Variance is usually lowest for framerates that are a divisor of the RAF frequency. This is usually 60, so
     * framerates of 10, 12, 15, 20, and 30 work well.
     *
     * Falls back on TIMEOUT if the requestAnimationFrame API is not supported.
     * @property RAF_SYNCHED
     * @static
     * @type {String}
     * @default "synched"
     * @readonly
     **/
    Ticker.RAF_SYNCHED = "synched";

    /**
     * In this mode, Ticker passes through the requestAnimationFrame heartbeat, ignoring the target framerate completely.
     * Because requestAnimationFrame frequency is not deterministic, any content using this mode should be time based.
     * You can leverage {{#crossLink "Ticker/getTime"}}{{/crossLink}} and the tick event object's "delta" properties
     * to make this easier.
     *
     * Falls back on TIMEOUT if the requestAnimationFrame API is not supported.
     * @property RAF
     * @static
     * @type {String}
     * @default "raf"
     * @readonly
     **/
    Ticker.RAF = "raf";

    /**
     * In this mode, Ticker uses the setTimeout API. This provides predictable, adaptive frame timing, but does not
     * provide the benefits of requestAnimationFrame (screen synch, background throttling).
     * @property TIMEOUT
     * @static
     * @type {String}
     * @default "timer"
     * @readonly
     **/
    Ticker.TIMEOUT = "timeout";


    // static events:
    /**
     * Dispatched each tick. The event will be dispatched to each listener even when the Ticker has been paused using
     * {{#crossLink "Ticker/setPaused"}}{{/crossLink}}.
     *
     * <h4>Example</h4>
     *
     *      createjs.Ticker.addEventListener("tick", handleTick);
     *      function handleTick(event) {
     *          console.log("Paused:", event.paused, event.delta);
     *      }
     *
     * @event tick
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     * @param {Boolean} paused Indicates whether the ticker is currently paused.
     * @param {Number} delta The time elapsed in ms since the last tick.
     * @param {Number} time The total time in ms since Ticker was initialized.
     * @param {Number} runTime The total time in ms that Ticker was not paused since it was initialized. For example,
     * 	you could determine the amount of time that the Ticker has been paused since initialization with time-runTime.
     * @since 0.6.0
     */


    // public static properties:
    /**
     * Deprecated in favour of {{#crossLink "Ticker/timingMode"}}{{/crossLink}}, and will be removed in a future version. If true, timingMode will
     * use {{#crossLink "Ticker/RAF_SYNCHED"}}{{/crossLink}} by default.
     * @deprecated Deprecated in favour of {{#crossLink "Ticker/timingMode"}}{{/crossLink}}.
     * @property useRAF
     * @static
     * @type {Boolean}
     * @default false
     **/
    Ticker.useRAF = false;

    /**
     * Specifies the timing api (setTimeout or requestAnimationFrame) and mode to use. See
     * {{#crossLink "Ticker/TIMEOUT"}}{{/crossLink}}, {{#crossLink "Ticker/RAF"}}{{/crossLink}}, and
     * {{#crossLink "Ticker/RAF_SYNCHED"}}{{/crossLink}} for mode details.
     * @property timingMode
     * @static
     * @type {String}
     * @default Ticker.TIMEOUT
     **/
    Ticker.timingMode = null;

    /**
     * Specifies a maximum value for the delta property in the tick event object. This is useful when building time
     * based animations and systems to prevent issues caused by large time gaps caused by background tabs, system sleep,
     * alert dialogs, or other blocking routines. Double the expected frame duration is often an effective value
     * (ex. maxDelta=50 when running at 40fps).
     *
     * This does not impact any other values (ex. time, runTime, etc), so you may experience issues if you enable maxDelta
     * when using both delta and other values.
     *
     * If 0, there is no maximum.
     * @property maxDelta
     * @static
     * @type {number}
     * @default 0
     */
    Ticker.maxDelta = 0;

    /**
     * When the ticker is paused, all listeners will still receive a tick event, but the <code>paused</code> property of the event will be false.
     * Also, while paused the `runTime` will not increase. See {{#crossLink "Ticker/tick:event"}}{{/crossLink}},
     * {{#crossLink "Ticker/getTime"}}{{/crossLink}}, and {{#crossLink "Ticker/getEventTime"}}{{/crossLink}} for more info.
     *
     * <h4>Example</h4>
     *
     *      createjs.Ticker.addEventListener("tick", handleTick);
     *      createjs.Ticker.paused = true;
     *      function handleTick(event) {
     *          console.log(event.paused,
     *          	createjs.Ticker.getTime(false),
     *          	createjs.Ticker.getTime(true));
     *      }
     *
     * @property paused
     * @static
     * @type {Boolean}
     * @default false
     **/
    Ticker.paused = false;


    // mix-ins:
    // EventDispatcher methods:
    Ticker.removeEventListener = null;
    Ticker.removeAllEventListeners = null;
    Ticker.dispatchEvent = null;
    Ticker.hasEventListener = null;
    Ticker._listeners = null;
    createjs.EventDispatcher.initialize(Ticker); // inject EventDispatcher methods.
    Ticker._addEventListener = Ticker.addEventListener;
    Ticker.addEventListener = function () {
        !Ticker._inited && Ticker.init();
        return Ticker._addEventListener.apply(Ticker, arguments);
    };


    // private static properties:
    /**
     * @property _inited
     * @static
     * @type {Boolean}
     * @protected
     **/
    Ticker._inited = false;

    /**
     * @property _startTime
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._startTime = 0;

    /**
     * @property _pausedTime
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._pausedTime = 0;

    /**
     * The number of ticks that have passed
     * @property _ticks
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._ticks = 0;

    /**
     * The number of ticks that have passed while Ticker has been paused
     * @property _pausedTicks
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._pausedTicks = 0;

    /**
     * @property _interval
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._interval = 50;

    /**
     * @property _lastTime
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._lastTime = 0;

    /**
     * @property _times
     * @static
     * @type {Array}
     * @protected
     **/
    Ticker._times = null;

    /**
     * @property _tickTimes
     * @static
     * @type {Array}
     * @protected
     **/
    Ticker._tickTimes = null;

    /**
     * Stores the timeout or requestAnimationFrame id.
     * @property _timerId
     * @static
     * @type {Number}
     * @protected
     **/
    Ticker._timerId = null;

    /**
     * True if currently using requestAnimationFrame, false if using setTimeout. This may be different than timingMode
     * if that property changed and a tick hasn't fired.
     * @property _raf
     * @static
     * @type {Boolean}
     * @protected
     **/
    Ticker._raf = true;


    // static getter / setters:
    /**
     * Use the {{#crossLink "Ticker/interval:property"}}{{/crossLink}} property instead.
     * @method setInterval
     * @static
     * @param {Number} interval
     * @deprecated
     **/
    Ticker.setInterval = function (interval) {
        Ticker._interval = interval;
        if (!Ticker._inited) {
            return;
        }
        Ticker._setupTick();
    };

    /**
     * Use the {{#crossLink "Ticker/framerate:property"}}{{/crossLink}} property instead.
     * @method getInterval
     * @static
     * @return {Number}
     * @deprecated
     **/
    Ticker.getInterval = function () {
        return Ticker._interval;
    };

    /**
     * Use the {{#crossLink "Ticker/framerate:property"}}{{/crossLink}} property instead.
     * @method setFPS
     * @static
     * @param {Number} value
     * @deprecated
     **/
    Ticker.setFPS = function (value) {
        Ticker.setInterval(1000 / value);
    };

    /**
     * Use the {{#crossLink "Ticker/interval:property"}}{{/crossLink}} property instead.
     * @method getFPS
     * @static
     * @return {Number}
     * @deprecated
     **/
    Ticker.getFPS = function () {
        return 1000 / Ticker._interval;
    };

    /**
     * Indicates the target time (in milliseconds) between ticks. Default is 50 (20 FPS).
     * Note that actual time between ticks may be more than specified depending on CPU load.
     * This property is ignored if the ticker is using the `RAF` timing mode.
     * @property interval
     * @static
     * @type {Number}
     **/

    /**
     * Indicates the target frame rate in frames per second (FPS). Effectively just a shortcut to `interval`, where
     * `framerate == 1000/interval`.
     * @property framerate
     * @static
     * @type {Number}
     **/
    try {
        Object.defineProperties(Ticker, {
            interval: {
                get: Ticker.getInterval,
                set: Ticker.setInterval
            },
            framerate: {
                get: Ticker.getFPS,
                set: Ticker.setFPS
            }
        });
    } catch (e) {
        console.log(e);
    }


    // public static methods:
    /**
     * Starts the tick. This is called automatically when the first listener is added.
     * @method init
     * @static
     **/
    Ticker.init = function () {
        if (Ticker._inited) {
            return;
        }
        Ticker._inited = true;
        Ticker._times = [];
        Ticker._tickTimes = [];
        Ticker._startTime = Ticker._getTime();
        Ticker._times.push(Ticker._lastTime = 0);
        Ticker.interval = Ticker._interval;
    };

    /**
     * Stops the Ticker and removes all listeners. Use init() to restart the Ticker.
     * @method reset
     * @static
     **/
    Ticker.reset = function () {
        if (Ticker._raf) {
            var f = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame;
            f && f(Ticker._timerId);
        } else {
            clearTimeout(Ticker._timerId);
        }
        Ticker.removeAllEventListeners("tick");
        Ticker._timerId = Ticker._times = Ticker._tickTimes = null;
        Ticker._startTime = Ticker._lastTime = Ticker._ticks = 0;
        Ticker._inited = false;
    };

    /**
     * Returns the average time spent within a tick. This can vary significantly from the value provided by getMeasuredFPS
     * because it only measures the time spent within the tick execution stack.
     *
     * Example 1: With a target FPS of 20, getMeasuredFPS() returns 20fps, which indicates an average of 50ms between
     * the end of one tick and the end of the next. However, getMeasuredTickTime() returns 15ms. This indicates that
     * there may be up to 35ms of "idle" time between the end of one tick and the start of the next.
     *
     * Example 2: With a target FPS of 30, getFPS() returns 10fps, which indicates an average of 100ms between the end of
     * one tick and the end of the next. However, getMeasuredTickTime() returns 20ms. This would indicate that something
     * other than the tick is using ~80ms (another script, DOM rendering, etc).
     * @method getMeasuredTickTime
     * @static
     * @param {Number} [ticks] The number of previous ticks over which to measure the average time spent in a tick.
     * Defaults to the number of ticks per second. To get only the last tick's time, pass in 1.
     * @return {Number} The average time spent in a tick in milliseconds.
     **/
    Ticker.getMeasuredTickTime = function (ticks) {
        var ttl = 0,
            times = Ticker._tickTimes;
        if (!times || times.length < 1) {
            return -1;
        }

        // by default, calculate average for the past ~1 second:
        ticks = Math.min(times.length, ticks || (Ticker.getFPS() | 0));
        for (var i = 0; i < ticks; i++) {
            ttl += times[i];
        }
        return ttl / ticks;
    };

    /**
     * Returns the actual frames / ticks per second.
     * @method getMeasuredFPS
     * @static
     * @param {Number} [ticks] The number of previous ticks over which to measure the actual frames / ticks per second.
     * Defaults to the number of ticks per second.
     * @return {Number} The actual frames / ticks per second. Depending on performance, this may differ
     * from the target frames per second.
     **/
    Ticker.getMeasuredFPS = function (ticks) {
        var times = Ticker._times;
        if (!times || times.length < 2) {
            return -1;
        }

        // by default, calculate fps for the past ~1 second:
        ticks = Math.min(times.length - 1, ticks || (Ticker.getFPS() | 0));
        return 1000 / ((times[0] - times[ticks]) / ticks);
    };

    /**
     * Use the {{#crossLink "Ticker/paused:property"}}{{/crossLink}} property instead.
     * @method setPaused
     * @static
     * @param {Boolean} value
     * @deprecated
     **/
    Ticker.setPaused = function (value) {
        // TODO: deprecated.
        Ticker.paused = value;
    };

    /**
     * Use the {{#crossLink "Ticker/paused:property"}}{{/crossLink}} property instead.
     * @method getPaused
     * @static
     * @return {Boolean}
     * @deprecated
     **/
    Ticker.getPaused = function () {
        // TODO: deprecated.
        return Ticker.paused;
    };

    /**
     * Returns the number of milliseconds that have elapsed since Ticker was initialized via {{#crossLink "Ticker/init"}}.
     * Returns -1 if Ticker has not been initialized. For example, you could use
     * this in a time synchronized animation to determine the exact amount of time that has elapsed.
     * @method getTime
     * @static
     * @param {Boolean} [runTime=false] If true only time elapsed while Ticker was not paused will be returned.
     * If false, the value returned will be total time elapsed since the first tick event listener was added.
     * @return {Number} Number of milliseconds that have elapsed since Ticker was initialized or -1.
     **/
    Ticker.getTime = function (runTime) {
        return Ticker._startTime ? Ticker._getTime() - (runTime ? Ticker._pausedTime : 0) : -1;
    };

    /**
     * Similar to getTime(), but returns the time on the most recent tick event object.
     * @method getEventTime
     * @static
     * @param runTime {Boolean} [runTime=false] If true, the runTime property will be returned instead of time.
     * @returns {number} The time or runTime property from the most recent tick event or -1.
     */
    Ticker.getEventTime = function (runTime) {
        return Ticker._startTime ? (Ticker._lastTime || Ticker._startTime) - (runTime ? Ticker._pausedTime : 0) : -1;
    };

    /**
     * Returns the number of ticks that have been broadcast by Ticker.
     * @method getTicks
     * @static
     * @param {Boolean} pauseable Indicates whether to include ticks that would have been broadcast
     * while Ticker was paused. If true only tick events broadcast while Ticker is not paused will be returned.
     * If false, tick events that would have been broadcast while Ticker was paused will be included in the return
     * value. The default value is false.
     * @return {Number} of ticks that have been broadcast.
     **/
    Ticker.getTicks = function (pauseable) {
        return Ticker._ticks - (pauseable ? Ticker._pausedTicks : 0);
    };


    // private static methods:
    /**
     * @method _handleSynch
     * @static
     * @protected
     **/
    Ticker._handleSynch = function () {
        Ticker._timerId = null;
        Ticker._setupTick();

        // run if enough time has elapsed, with a little bit of flexibility to be early:
        if (Ticker._getTime() - Ticker._lastTime >= (Ticker._interval - 1) * 0.97) {
            Ticker._tick();
        }
    };

    /**
     * @method _handleRAF
     * @static
     * @protected
     **/
    Ticker._handleRAF = function () {
        Ticker._timerId = null;
        Ticker._setupTick();
        Ticker._tick();
    };

    /**
     * @method _handleTimeout
     * @static
     * @protected
     **/
    Ticker._handleTimeout = function () {
        Ticker._timerId = null;
        Ticker._setupTick();
        Ticker._tick();
    };

    /**
     * @method _setupTick
     * @static
     * @protected
     **/
    Ticker._setupTick = function () {
        if (Ticker._timerId != null) {
            return;
        } // avoid duplicates

        var mode = Ticker.timingMode || (Ticker.useRAF && Ticker.RAF_SYNCHED);
        if (mode == Ticker.RAF_SYNCHED || mode == Ticker.RAF) {
            var f = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
            if (f) {
                Ticker._timerId = f(mode == Ticker.RAF ? Ticker._handleRAF : Ticker._handleSynch);
                Ticker._raf = true;
                return;
            }
        }
        Ticker._raf = false;
        Ticker._timerId = setTimeout(Ticker._handleTimeout, Ticker._interval);
    };

    /**
     * @method _tick
     * @static
     * @protected
     **/
    Ticker._tick = function () {
        var paused = Ticker.paused;
        var time = Ticker._getTime();
        var elapsedTime = time - Ticker._lastTime;
        Ticker._lastTime = time;
        Ticker._ticks++;

        if (paused) {
            Ticker._pausedTicks++;
            Ticker._pausedTime += elapsedTime;
        }

        if (Ticker.hasEventListener("tick")) {
            var event = new createjs.Event("tick");
            var maxDelta = Ticker.maxDelta;
            event.delta = (maxDelta && elapsedTime > maxDelta) ? maxDelta : elapsedTime;
            event.paused = paused;
            event.time = time;
            event.runTime = time - Ticker._pausedTime;
            Ticker.dispatchEvent(event);
        }

        Ticker._tickTimes.unshift(Ticker._getTime() - time);
        while (Ticker._tickTimes.length > 100) {
            Ticker._tickTimes.pop();
        }

        Ticker._times.unshift(time);
        while (Ticker._times.length > 100) {
            Ticker._times.pop();
        }
    };

    /**
     * @method _getTime
     * @static
     * @protected
     **/
    var now = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
    Ticker._getTime = function () {
        return ((now && now.call(performance)) || (new Date().getTime())) - Ticker._startTime;
    };


    createjs.Ticker = Ticker;
}());

/*
    Weave (Web-based Analysis and Visualization Environment)
    Copyright (C) 2008-2011 University of Massachusetts Lowell
    This file is a part of Weave.
    Weave is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License, Version 3,
    as published by the Free Software Foundation.
    Weave is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


/**
 * This provides a set of useful static functions.
 * All the functions defined in this class are pure functions,
 * meaning they always return the same result with the same arguments, and they have no side-effects.
 *
 * @author adufilie
 * @author sanbalag
 */
(function () {
    "use strict";

    //constructor
    function StandardLib() {
        throw "StandardLib cannot be instantiated.";
    }

    /**
     * This compares two dynamic objects or primitive values and is much faster than ObjectUtil.compare().
     * Does not check for circular refrences.
     * @param a First dynamic object or primitive value.
     * @param b Second dynamic object or primitive value.
     * @return A value of zero if the two objects are equal, nonzero if not equal.
     */
    StandardLib.compare = function (a, b, objectCompare) {
        objectCompare = (objectCompare === undefined ? null : objectCompare);
        var c;
        var ObjectUtil = weavecore.ObjectUtil;
        if (a === b)
            return 0;
        if (a === null || a === undefined)
            return 1;
        if (b === null || b === undefined)
            return -1;
        var typeA = typeof (a);
        var typeB = typeof (b);
        if (typeA !== typeB)
            return weavecore.ObjectUtil.stringCompare(typeA, typeB);
        if (typeA === 'boolean')
            return weavecore.ObjectUtil.numericCompare(Number(a), Number(b));
        if (typeA === 'number')
            return weavecore.ObjectUtil.numericCompare(a, b);
        if (typeA === 'string')
            return weavecore.ObjectUtil.stringCompare(a, b);

        if (typeA !== 'object')
            return 1;

        if (a instanceof Date && b instanceof Date)
            return weavecore.ObjectUtil.dateCompare(a, b);

        if (a.constructor === Array && b.constructor === Array) {
            var an = a.length;
            var bn = b.length;
            if (an < bn)
                return -1;
            if (an > bn)
                return 1;
            for (var i = 0; i < an; i++) {
                c = StandardLib.compare(a[i], b[i]);
                if (c !== 0)
                    return c;
            }
            return 0;
        }

        if (objectCompare !== null) {
            var result = objectCompare(a, b);
            if (isFinite(result))
                return result;
        }

        var qna = a.constructor.name;
        var qnb = b.constructor.name;

        if (qna != qnb)
            return weavecore.ObjectUtil.stringCompare(qna, qnb);

        var p;

        // test if objects are dynamic
        try {
            a[''];
            b[''];
        } catch (e) {
            return 1; // not dynamic objects
        }

        // if there are properties in a not found in b, return -1
        for (p in a) {
            if (!b.hasOwnProperty(p))
                return -1;
        }
        for (p in b) {
            // if there are properties in b not found in a, return 1
            if (!a.hasOwnProperty(p))
                return 1;

            c = StandardLib.compare(a[p], b[p]);
            if (c !== 0)
                return c;
        }

        return 0;
    };

    /**
     * This function will cast a value of any type to a Number,
     * interpreting the empty string ("") and null as NaN.
     * @param value A value to cast to a Number.
     * @return The value cast to a Number, or NaN if the casting failed.
     */
    StandardLib.asNumber = function (value) {
        if (value === null || value === undefined)
            return NaN; // return NaN because Number(null) == 0

        if (value.constructor === Number || value instanceof Date)
            return value;

        try {
            value = String(value);
            if (value === '')
                return NaN; // return NaN because Number('') == 0
            return Number(value);
        } catch (e) {}

        return NaN;
    }

    /**
     * This function attempts to derive a boolean value from different types of objects.
     * @param value An object to parse as a Boolean.
     */
    StandardLib.asBoolean = function (value) {
        if (value.constructor === Boolean)
            return value;
        if (value.constructor === String)
            return weavecore.ObjectUtil.stringCompare(value, "true", true) === 0;
        if (isNaN(value))
            return false;
        if (value.constructor === Number)
            return value != 0;
        return value;
    }

    /**
     * Converts a value to a non-null String
     * @param value A value to cast to a String.
     * @return The value cast to a String.
     */
    StandardLib.asString = function (value) {
        if (value === null || value === undefined)
            return '';
        try {
            return value;
        } catch (e) {}
        return '';
    }


    /**
     * Tests if a value is anything other than undefined, null, or NaN.
     */
    StandardLib.isDefined = function (value) {
        return value !== undefined && value !== null && !(value.constructor === Number && isNaN(value));
    }

    /**
     * Tests if a value is undefined, null, or NaN.
     */
    StandardLib.isUndefined = function (value) {
        return value === undefined || value === null || (value.constructor === Number && isNaN(value));
    }


    /**
     * Checks if all items in an Array are instances of a given type.
     * @param a An Array of items to test
     * @param type A type to check for
     * @return true if each item in the Array is an object of the given type.
     */
    StandardLib.arrayIsType = function (arr, type) {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (!(item instanceof type || item.constructor === type))
                return false;
        }

        return true;
    }

    /**
     * Pads a string on the left.
     */
    StandardLib.lpad = function (str, length, padString) {
        padString = (padString === undefined) ? ' ' : padString;
        if (str.length >= length)
            return str;
        while (str.length + padString.length < length)
            padString += padString;
        return padString.substr(0, length - str.length) + str;
    }

    /**
     * Pads a string on the right.
     */
    StandardLib.rpad = function (str, length, padString) {
        padString = (padString === undefined) ? ' ' : padString;
        if (str.length >= length)
            return str;
        while (str.length + padString.length < length)
            padString += padString;
        return str + padString.substr(0, length - str.length);
    }


    /**
     * This function will use a default NumberFormatter object to format a Number to a String.
     * @param number The number to format.
     * @param precision A precision value to pass to the default NumberFormatter.
     * @return The result of format(number) using the specified precision value.
     * @see mx.formatters.NumberFormatter#format
     */
    StandardLib.formatNumber = function (number, precision) {
            precision = (precision === undefined) ? NaN : precision;
            if (isFinite(precision)) {
                precision = parseInt(precision);
            } else {
                number = StandardLib.roundSignificant(number);
                if (Math.abs(number) < 1)
                    return String(number); // this fixes the bug where "0.1" gets converted to ".1" (we don't want the "0" to be lost)
                precision = -1;
            }

            //StandardLib._numberFormatter.format(number)
            return number.toPrecision(precision);
        }
        /**
         * This is the default NumberFormatter to use inside the formatNumber() function.
         */
    StandardLib._numberFormatter = new Intl.NumberFormat();

    /**
     * This rounds a Number to a given number of significant digits.
     * @param value A value to round.
     * @param significantDigits The desired number of significant digits in the result.
     * @return The number, rounded to the specified number of significant digits.
     */
    StandardLib.roundSignificant = function (value, significantDigits) {
        significantDigits = (significantDigits === undefined) ? 14 : significantDigits;
        // it doesn't make sense to round infinity or NaN
        if (!isFinite(value))
            return value;

        var sign = (value < 0) ? -1 : 1;
        var absValue = Math.abs(value);
        var pow10;

        // if absValue is less than 1, all digits after the decimal point are significant
        if (absValue < 1) {
            pow10 = Math.pow(10, significantDigits);
            //trace("absValue<1: Math.round(",absValue,"*",pow10,")",Math.round(absValue * pow10));
            return sign * Math.round(absValue * pow10) / pow10;
        }

        var log10 = Math.ceil(Math.log(absValue) / Math.LN10);

        // Both these calculations are equivalent mathematically, but if we use
        // the wrong one we get bad rounding results like "123.456000000001".
        if (log10 < significantDigits) {
            // find the power of 10 that you need to MULTIPLY absValue by
            // so Math.round() will round off the digits we don't want
            pow10 = Math.pow(10, significantDigits - log10);
            return sign * Math.round(absValue * pow10) / pow10;
        } else {
            // find the power of 10 that you need to DIVIDE absValue by
            // so Math.round() will round off the digits we don't want
            pow10 = Math.pow(10, log10 - significantDigits);
            //trace("log10>significantDigits: Math.round(",absValue,"/",pow10,")",Math.round(absValue / pow10));
            return sign * Math.round(absValue / pow10) * pow10;
        }
    }

    /**
     * This uses AsyncSort.sortImmediately() to sort an Array (or Vector) in place.
     * @param array An Array (or Vector) to sort.
     * @param compare A function that accepts two items and returns -1, 0, or 1.
     * @see weave.utils.AsyncSort#sortImmediately()
     * @see Array#sort()
     */
    StandardLib.sort = function (array, compare) {
        compare = (compare === undefined) ? null : compare;
        weavecore.AsyncSort.sortImmediately(array, compare);
    }

    Object.defineProperty(StandardLib, '_sortBuffer', {
        value: []
    });

    function numericSort(a, b, sortDirection) {
        return a - b;
    }

    function nonASCIISort(a, b, sortDirection) {
        return a.localeCompare(b);
    }

    function dateSort(date1, date2, sortDirection) {
        // This is a comparison function that will result in dates being sorted in
        // ASCENDING order.
        if (date1 > date2) return 1;
        if (date1 < date2) return -1;
        return 0;
    };





    /**
     * Sorts an Array (or Vector) of items in place using properties, lookup tables, or replacer functions.
     * @param array An Array (or Vector) to sort.
     * @param params Specifies how to get values used to sort items in the array.
     *               This can either be an Array of params or a single param, each of which can be one of the following:<br>
     *               Array or Vector: values are looked up based on index (Such an Array must be nested in a params array rather than given alone as a single param)<br>
     *               Object or Dictionary: values are looked up using items in the array as keys<br>
     *               Property name: values are taken from items in the array using a property name<br>
     *               Replacer function: array items are passed through this function to get values<br>
     * @param sortDirections Specifies sort direction(s) (1 or -1) corresponding to the params.
     * @param inPlace Set this to true to modify the original Array (or Vector) in place or false to return a new, sorted copy.
     * @param returnSortedIndexArray Set this to true to return a new Array of sorted indices.
     * @return Either the original Array (or Vector) or a new one.
     *
     */
    StandardLib.sortOn = function (array, params, sortDirections, inPlace, returnSortedIndexArray) {
        inPlace = (inPlace === undefined) ? true : inPlace;
        returnSortedIndexArray = (returnSortedIndexArray === undefined) ? false : returnSortedIndexArray;

        if (array.length === 0)
            return inPlace ? array : [];

        var values;
        var param;
        var sortDirection;
        var i;

        // expand _sortBuffer as necessary
        for (i = StandardLib._sortBuffer.length; i < array.length; i++)
            StandardLib._sortBuffer[i] = [];

        // If there is only one param, wrap it in an array.
        // Array.sortOn() is preferred over Array.sort() in this case
        // since an undefined value will crash Array.sort(Array.NUMERIC).
        if (params === array || !(params.constructor === Array)) {
            params = [params];
            if (sortDirections)
                sortDirections = [sortDirections];
        }

        var fields = new Array();
        fields.length = params.length;
        var fieldOptions = new Array();
        fieldOptions.length = params.length;
        for (var p = 0; p < params.length; p++) {
            param = params[p];
            sortDirection = sortDirections && sortDirections[p] < 0 ? Array.DESCENDING : 0;

            i = array.length;
            if (param.constructor === Array)
                while (i--)
                    StandardLib._sortBuffer[i][p] = param[i];
            else if (param.constructor === Function)
                while (i--)
                    StandardLib._sortBuffer[i][p] = param(array[i]);
            else if (typeof param === 'object')
                while (i--)
                    StandardLib._sortBuffer[i][p] = param[array[i]];
            else
                while (i--)
                    StandardLib._sortBuffer[i][p] = array[i][param];

            fields[p] = p;
            fieldOptions[p] = Array.RETURNINDEXEDARRAY | StandardLib.guessSortMode(StandardLib._sortBuffer, p) | sortDirection;
        }

        values = StandardLib._sortBuffer.slice(0, array.length);
        values = values.sortOn(fields, fieldOptions);

        if (returnSortedIndexArray)
            return values;

        var array2 = new Array();
        array2.length = array.length
        i = array.length;
        while (i--)
            array2[i] = array[values[i]];

        if (!inPlace)
            return array2;

        i = array.length;
        while (i--)
            array[i] = array2[i];
        return array;
    }

    /**
     * Guesses the appropriate Array.sort() mode based on the first non-undefined item property from an Array.
     * @return Either Array.NUMERIC or 0.
     */
    StandardLib.guessSortMode = function (array, itemProp) {
        var props = Object.keys(array);
        for (var i = 0; i < props.length; i++) {
            var item = array[props[i]];
            var value = item[itemProp];
            if (value !== undefined)
                return value.constructor === Number || value.constructor === Date ? Array.NUMERIC : 0;
        }
        return 0;
    }

    //testRoundSignificant();
    StandardLib.testRoundSignificant = function () {
        for (var pow = -5; pow <= 5; pow++) {
            var n = 1234.5678 * Math.pow(10, pow);
            for (var d = 0; d <= 9; d++)
                console.log('roundSignificant(', n, ',', d, ') =', StandardLib.roundSignificant(n, d));
        }
    }

    /**
     * @see https://github.com/bestiejs/punycode.js
     */
    StandardLib.ucs2encode = function (value) {
        var output = '';
        if (value > 0xFFFF) {
            value -= 0x10000;
            output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
            value = 0xDC00 | value & 0x3FF;
        }
        return output + String.fromCharCode(value);
    }

    StandardLib.argRef = new RegExp("^(0|[1-9][0-9]*)\}");

    /**
     * Substitutes "{n}" tokens within the specified string with the respective arguments passed in.
     * Same syntax as StringUtil.substitute() without the side-effects of using String.replace() with a regex.
     * @see String#replace()
     * @see mx.utils.StringUtil#substitute()
     */
    StandardLib.substitute = function (format) {
        var args = Array.prototype.slice.call(arguments);
        format = args.shift();
        if (args.length === 1 && args[0])
            args = args[0];

        var split = format.split('{')
        var output = split[0];
        for (var i = 1; i < split.length; i++) {
            var str = split[i];
            if (StandardLib.argRef.test(str)) {
                var j = str.indexOf("}");
                output += args[str.substring(0, j)];
                output += str.substring(j + 1);
            } else
                output += "{" + str;
        }
        return output;
    }


    /**
     * This function performs find and replace operations on a String.
     * @param string A String to perform replacements on.
     * @param findStr A String to find.
     * @param replaceStr A String to replace occurrances of the 'findStr' String with.
     * @param moreFindAndReplace A list of additional find,replace parameters to use.
     * @return The String with all the specified replacements performed.
     */
    StandardLib.replace = function (string, findStr, replaceStr, moreFindAndReplace) {
        var args = Array.prototype.slice.call(arguments);
        string = args.shift();
        findStr = args.shift();
        replaceStr = args.shift();
        moreFindAndReplace = args;
        string = string.split(findStr).join(replaceStr);
        while (moreFindAndReplace.length > 1) {
            findStr = moreFindAndReplace.shift();
            replaceStr = moreFindAndReplace.shift();
            string = string.split(findStr).join(replaceStr);
        }
        return string;
    }

    /**
     * Takes a script where all lines have been indented with tabs,
     * removes the common indentation from all lines and optionally
     * replaces extra leading tabs with a number of spaces.
     * @param script A script.
     * @param spacesPerTab If zero or greater, this is the number of spaces to be used in place of each tab character used as indentation.
     * @return The modified script.
     */

    StandardLib.unIndent = function (script, spacesPerTab) {
        if (script === null)
            return null;
        spacesPerTab = (spacesPerTab === undefined) ? -1 : spacesPerTab;
        // switch all line endings to \n
        script = StandardLib.replace(script, '\r\n', '\n', '\r', '\n');
        // remove trailing whitespace (not leading whitespace)
        script = ('.' + script).trim().substr(1);
        // separate into lines
        var lines = script.split('\n');
        // remove blank lines from the beginning
        while (lines.length && !lines[0].trim())
            lines.shift();
        // stop if there's nothing left
        if (!lines.length)
            return '';
        // find the common indentation
        var commonIndent = Number.MAX_VALUE;
        var line;
        for (var i = 0; i < lines.length; i++) {
            line = lines[i];
            // ignore blank lines
            if (!line.trim())
                continue;
            // count leading tabs
            var lineIndent = 0;
            while (line.charAt(lineIndent) === '\t')
                lineIndent++;
            // remember the minimum number of leading tabs
            commonIndent = Math.min(commonIndent, lineIndent);
        }

        // remove the common indentation from each line
        for (var j = 0; j < lines.length; j++) {
            line = lines[j];
            // prepare to remove common indentation
            var t = 0;
            while (t < commonIndent && line.charAt(t) === '\t')
                t++;
            // optionally, prepare to replace extra tabs with spaces
            var spaces = '';
            if (spacesPerTab >= 0) {
                while (line.charAt(t) === '\t') {
                    spaces += StandardLib.lpad('', spacesPerTab, '        ');
                    t++;
                }
            }
            // commit changes
            lines[j] = spaces + line.substr(t);
        }
        return lines.join('\n');
    }

    /**
     * Code from Graphics Gems Volume 1
     */
    StandardLib.getNiceNumber = function (x, round) {
        var exponent;
        var fractionalPart;
        var niceFractionalPart;

        // special case for nice number of 0, since Math.log(0) is -Infinity
        if (x === 0)
            return 0;

        exponent = Math.floor(Math.log(x) / Math.LN10);
        fractionalPart = x / Math.pow(10.0, exponent);

        if (round) {
            if (fractionalPart < 1.5) {
                niceFractionalPart = 1.0;
            } else if (fractionalPart < 3.0) {
                niceFractionalPart = 2.0;
            } else if (fractionalPart < 7.0) {
                niceFractionalPart = 5.0;
            } else {
                niceFractionalPart = 10.0;
            }
        } else {
            if (fractionalPart <= 1.0) {
                niceFractionalPart = 1.0;
            } else if (fractionalPart <= 2.0) {
                niceFractionalPart = 2.0;
            } else if (fractionalPart < 5.0) {
                niceFractionalPart = 5.0;
            } else {
                niceFractionalPart = 10.0;
            }
        }

        return niceFractionalPart * Math.pow(10.0, exponent);
    }


    /**
     * Code from Graphics Gems Volume 1
     * Note: This may return less than the requested number of values
     */
    StandardLib.getNiceNumbersInRange = function (min, max, numberOfValuesInRange) {
        // special case
        if (min === max)
            return [min];

        var nfrac;
        var d;
        var graphmin;
        var graphmax;
        var range;
        var x;
        var i = 0;

        var values = [];

        // Bug fix: getNiceNumbersInRange(0, 500, 6) returned [0,200,400] when it could be [0,100,200,300,400,500]
        // Was: range = getNiceNumber(max - min, false);
        range = max - min;

        d = StandardLib.getNiceNumber(range / (numberOfValuesInRange - 1), true);
        graphmin = Math.floor(min / d) * d;
        graphmax = Math.ceil(max / d) * d;

        nfrac = Math.max(-Math.floor(Math.log(d) / Math.LN10), 0);

        for (x = graphmin; x < graphmax + 0.5 * d; x += d) {
            values[i++] = StandardLib.roundSignificant(x); // this fixes values like x = 0.6000000000000001 that may occur from x += d
        }

        return values;
    }


    /**
     * This function constrains a number between min and max values.
     * @param value A value to constrain between a min and max.
     * @param min The minimum value.
     * @param max The maximum value.
     * @return If value &lt; min, returns min.  If value &gt; max, returns max.  Otherwise, returns value.
     */
    StandardLib.constrain = function (value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    }



    weavecore.StandardLib = StandardLib;
}());

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This provides a set of useful static functions for Object Comparison.
 * All Static functions are Ported from  Apache Flex mx.utils.ObjectUtil - ActionScript Code
 * @author sanjay1909
 */
(function () {
    "use strict";

    //constructor
    function ObjectUtil() {
        throw "ObjectUtil cannot be instantiated.";
    }

    /**
     *  Compares two numeric values.
     *  @param a First number.
     *  @param b Second number.
     *  @return 0 is both numbers are NaN.
     *  1 if only <code>a</code> is a NaN.
     *  -1 if only <code>b</code> is a NaN.
     *  -1 if <code>a</code> is less than <code>b</code>.
     *  1 if <code>a</code> is greater than <code>b</code>.
     */
    ObjectUtil.numericCompare = function (a, b) {
        if (isNaN(a) && isNaN(b))
            return 0;

        if (isNaN(a))
            return 1;

        if (isNaN(b))
            return -1;

        if (a < b)
            return -1;

        if (a > b)
            return 1;

        return 0;
    };

    /**
     *  Compares two String values.
     *  @param a First String value.
     *  @param b Second String value.
     *  @param caseInsensitive Specifies to perform a case insensitive compare,
     *  <code>true</code>, or not, <code>false</code>.
     *
     *  @return 0 is both Strings are null.
     *  1 if only <code>a</code> is null.
     *  -1 if only <code>b</code> is null.
     *  -1 if <code>a</code> precedes <code>b</code>.
     *  1 if <code>b</code> precedes <code>a</code>.
     */
    ObjectUtil.stringCompare = function (a, b, caseInsensitive) {
        if ((a === null || a === undefined) && (b === null || b === undefined))
            return 0;

        if (a === null || a === undefined)
            return 1;

        if (b === null || b === undefined)
            return -1;

        // Convert to lowercase if we are case insensitive.
        if (caseInsensitive) {
            a = a.toLocaleLowerCase();
            b = b.toLocaleLowerCase();
        }

        var result = a.localeCompare(b);

        if (result < -1)
            result = -1;
        else if (result > 1)
            result = 1;

        return result;
    };

    /**
     *  Compares the two Date objects and returns an integer value
     *  indicating if the first Date object is before, equal to,
     *  or after the second item.
     *  @param a Date object.
     *  @param b Date object.
     *  @return 0 if <code>a</code> and <code>b</code> are equal
     *  (or both are <code>null</code>);
     *  -1 if <code>a</code> is before <code>b</code>
     *  (or <code>b</code> is <code>null</code>);
     *  1 if <code>a</code> is after <code>b</code>
     *  (or <code>a</code> is <code>null</code>);
     *  0 is both dates getTime's are NaN;
     *  1 if only <code>a</code> getTime is a NaN;
     *  -1 if only <code>b</code> getTime is a NaN.
     */
    ObjectUtil.dateCompare = function (a, b) {
        if ((a === null || a === undefined) && (b === null || b === undefined))
            return 0;

        if (a === null || undefined)
            return 1;

        if (b === null || undefined)
            return -1;

        var na = a.getTime();
        var nb = b.getTime();

        if (na < nb)
            return -1;

        if (na > nb)
            return 1;

        if (isNaN(na) && isNaN(nb))
            return 0;

        if (isNaN(na))
            return 1;

        if (isNaN(nb))
            return -1;

        return 0;
    };

    ObjectUtil.byteArrayCompare = function (a, b) {
        var result = 0;

        if (a === b)
            return result;

        if (a.length !== b.length) {
            if (a.length < b.length)
                result = -1;
            else
                result = 1;
        } else {
            for (var i = 0; i < a.length; i++) {
                result = ObjectUtil.numericCompare(a[i], b[i]);
                if (result != 0) {
                    i = a.length;
                }
            }
        }
        return result;
    }



    ObjectUtil.compare = function (a, b, depth) {
        depth = (depth === undefined) ? -1 : depth;
        return ObjectUtil.internalCompare(a, b, 0, depth, new Map())

    }

    ObjectUtil.internalCompare = function (a, b, currentDepth, desiredDepth, refs) {
        if (a === null && b === null)
            return 0;

        if (a === null)
            return 1;

        if (b === null)
            return -1;



        var typeOfA = typeof (a);
        var typeOfB = typeof (b);

        var result = 0;

        if (typeOfA === typeOfB) {
            switch (typeOfA) {
            case "boolean":
                {
                    result = ObjectUtil.numericCompare(Number(a), Number(b));
                    break;
                }

            case "number":
                {
                    result = ObjectUtil.numericCompare(a, b);
                    break;
                }

            case "string":
                {
                    result = ObjectUtil.stringCompare(a, b);
                    break;
                }

            case "object":
                {
                    var newDepth = desiredDepth > 0 ? desiredDepth - 1 : desiredDepth;

                    // refs help us avoid circular reference infinite recursion.
                    var aRef = ObjectUtil._getRef(a, refs);
                    var bRef = ObjectUtil._getRef(b, refs);

                    if (aRef === bRef)
                        return 0;
                    // the cool thing about our dictionary is that if
                    // we've seen objects and determined that they are inequal, then
                    // we would've already exited out of this compare() call.  So the
                    // only info in the dictionary are sets of equal items

                    // let's first define them as equal
                    // this stops an "infinite loop" problem where A.i = B and B.i = A
                    // if we later find that an object (one of the subobjects) is in fact unequal,
                    // then we will return false and quit out of everything.  These refs are thrown away
                    // so it doesn't matter if it's correct.
                    refs.set(bRef, aRef);

                    if (desiredDepth != -1 && (currentDepth > desiredDepth)) {
                        // once we try to go beyond the desired depth we should
                        // toString() our way out
                        result = ObjectUtil.stringCompare(a.toString(), b.toString());
                    } else if ((a.constructor === Array) && (b.constructor === Array)) {
                        result = ObjectUtil.arrayCompare(a, b, currentDepth, desiredDepth, refs);
                    } else if ((a.constructor === Date) && (b.constructor === Date)) {
                        result = ObjectUtil.dateCompare(a, b);
                    } else if ((a.constructor === ArrayBuffer) && (b.constructor === ArrayBuffer)) {
                        result = ObjectUtil.byteArrayCompare(a, b);
                    } else if (a.constructor.name === b.constructor.name) {
                        var aProps = Object.getOwnPropertyNames(a);
                        // now that we know we have the same properties, let's compare the values
                        var propName;
                        var aProp;
                        var bProp;
                        for (var i = 0; i < aProps.length; i++) {
                            propName = aProps[i];
                            aProp = a[propName];
                            bProp = b[propName];
                            result = internalCompare(aProp, bProp, currentDepth + 1, newDepth, refs);
                            if (result !== 0) {
                                return result;
                            }
                        }
                    } else {
                        // We must be inequal, so return 1
                        return 1;
                    }
                    break;
                }
            }
        } else // be consistent with the order we return here
        {
            return ObjectUtil.stringCompare(typeOfA, typeOfB);
        }
        return result;

    }


    /**
     * @private
     * This is the "find" for our union-find algorithm when doing object searches.
     * The dictionary keeps track of sets of equal objects
     */
    ObjectUtil._getRef = function (o, refs) {
        var oRef = refs[o];
        while (oRef && oRef !== refs.get(oRef)) {
            oRef = refs.get(oRef);
        }
        if (!oRef)
            oRef = o;
        if (oRef !== refs[o])
            refs.set(o, oRef);

        return oRef
    }

    weavecore.ObjectUtil = ObjectUtil;

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {

    // constructor:
    /**
     * This is an empty interface used to identify a compiled object type.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function ICompiledObject() {

    }

    weavecore.ICompiledObject = ICompiledObject;

}());

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    /**
     * This serves as a wrapper for a constant value to remember that it was compiled.
     * This is used in the Compiler class to avoid parsing tokens multiple times.
     * To avoid function call overhead, no public functions are defined in this class.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function CompiledConstant(name, value) {

        this.name = name;
        this.value = value;

    }

    CompiledConstant.prototype = new weavecore.ICompiledObject();
    CompiledConstant.prototype.constructor = CompiledConstant;

    weavecore.CompiledConstant = CompiledConstant;

}());

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    /**
     * This serves as a structure for storing the information required to make a function call.
     * This is used in the Compiler class to avoid parsing tokens multiple times.
     * To avoid function call overhead, no public functions are not defined in this class.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function CompiledFunctionCall(compiledMethod, compiledParams) {
        /**
         * This is a compiled object that evaluates to a method.
         */
        this.compiledMethod = compiledMethod;
        /**
         * This is an Array of CompiledObjects that must be evaluated before calling the method.
         */
        this.compiledParams = compiledParams;



        if (!compiledMethod)
            throw new Error("compiledMethod cannot be null");

        if (compiledParams) {
            compiledParams.forEach(function (param) {
                if (param === null)
                    throw new Error("compiledParams cannot contain nulls");
            });
        }




        /**
         * This is used to keep track of which compiled parameter is currently being evaluated.
         */
        this.evalIndex;
        /**
         * When the function is called as a property of an object, this will store a pointer to the object
         * so that it can be used as the 'this' parameter in Function.apply().
         */
        this.evaluatedHost;
        /**
         * When the function is called as a property of an object, this will store the property name in case the host is a Proxy object.
         */
        this.evaluatedMethodName;
        /**
         * This is used to store the result of evaluating the compiledMethod before evaluating the parameters.
         */
        this.evaluatedMethod;
        /**
         * This is an Array of constants to use as parameters to the method.
         * This Array is used to store the results of evaluating the compiledParams Array before calling the method.
         */
        this.evaluatedParams;
        /**
         * An optional set of original tokens to use in place of this CompiledFunctionCall when decompiling.
         */
        this.originalTokens;

        this.evaluateConstants();
    }

    CompiledFunctionCall._clone = function (obj, i, a) {
        i = (i === undefined) ? -1 : i;
        a = (a === undefined) ? null : a;
        var cfc = obj;
        if (cfc)
            return new weavecore.CompiledFunctionCall(CompiledFunctionCall._clone(cfc.compiledMethod), cfc.compiledParams && cfc.compiledParams.map(_clone));
        return obj;
    }

    CompiledFunctionCall.prototype = new weavecore.ICompiledObject();
    CompiledFunctionCall.prototype.constructor = CompiledFunctionCall;

    var p = CompiledFunctionCall.prototype;

    p.evaluateConstants = function () {
        // if name is constant, evaluate it once now
        if (this.compiledMethod instanceof weavecore.CompiledConstant)
            this.evaluatedMethod = (this.compiledMethod).value;
        else
            this.evaluatedMethod = null;

        if (this.compiledParams) {
            if (!this.evaluatedParams) {
                this.evaluatedParams = [];
                this.evaluatedParams.length = this.compiledParams.length;
            } else
                this.evaluatedParams.length = this.compiledParams.length;

            // move constant values from the compiledParams array to the evaluatedParams array.
            for (var i = 0; i < this.compiledParams.length; i++)
                if (this.compiledParams[i] instanceof weavecore.CompiledConstant)
                    this.evaluatedParams[i] = (this.compiledParams[i]).value;
        } else {
            this.evaluatedParams = null;
        }
    }

    /**
     * Makes a deep copy of this and any nested CompiledFunctionCall objects suitable for recursive function execution.
     */
    p.clone = function () {
        return CompiledFunctionCall._clone(this);
    }

    weavecore.CompiledFunctionCall = CompiledFunctionCall;

}());

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
    this.trace = function (msg) {
        console.log(msg);
    }
} else {
    window.weavecore = window.weavecore || {};
    window.trace = function (msg) {
        console.log(msg);
    }
}




/**
 * This class can compile simple JS expressions into functions.
 *
 * @author adufilie
 * @author sanbalag
 */
(function (domain) {


    Object.defineProperty(Compiler, 'ENCODE_LOOKUP', {
        value: {
            '\b': 'b',
            '\f': 'f',
            '\n': 'n',
            '\r': 'r',
            '\t': 't',
            '\\': '\\'
        }
    });
    Object.defineProperty(Compiler, 'DECODE_LOOKUP', {
        value: {
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        }
    });


    /**
     * Add keys to this dictionary for class alias names or deprecated library replacements using dot notation (".") rather than "::" package notation.
     */
    Object.defineProperty(Compiler, 'classAliases', {
        value: {}
    });



    Object.defineProperty(Compiler, 'OPERATOR_ESCAPE', {
        value: '\\'
    });

    Object.defineProperty(Compiler, 'FUNCTION', {
        value: 'function'
    });
    Object.defineProperty(Compiler, 'FUNCTION_PARAM_NAMES', {
        value: 'names'
    });
    Object.defineProperty(Compiler, 'FUNCTION_PARAM_VALUES', {
        value: 'values'
    });
    Object.defineProperty(Compiler, 'FUNCTION_CODE', {
        value: 'code'
    });



    //private constants

    /**
     * (statement name) -> (true if requires parentheses)
     */
    Compiler.statements = null;

    Compiler.OPERATOR_NEW = 'new';

    /**
     * This is a String containing all the characters that are treated .
     */
    Object.defineProperty(Compiler, 'WHITESPACE', {
        value: '\r\n \t\f'
    });



    /**
     * This is the prefix used for the function notation of infix operators.
     * For example, the function notation for ( x + y ) is ( \+(x,y) ).
     */
    Object.defineProperty(Compiler, 'OPERATOR_ESCAPE', {
        value: '\\'
    });


    Object.defineProperty(Compiler, 'INDEX_METHOD', {
        value: -1
    });
    Object.defineProperty(Compiler, 'INDEX_CONDITION', {
        value: 0
    });
    Object.defineProperty(Compiler, 'INDEX_TRUE', {
        value: 1
    });
    Object.defineProperty(Compiler, 'INDEX_FALSE', {
        value: 2
    });

    Object.defineProperty(Compiler, 'INDEX_FOR_LIST', {
        value: 0
    });
    Object.defineProperty(Compiler, 'INDEX_FOR_ITEM', {
        value: 1
    });


    Object.defineProperty(Compiler, 'ST_IF', {
        value: 'if'
    });
    Object.defineProperty(Compiler, 'ST_ELSE', {
        value: 'else'
    });
    Object.defineProperty(Compiler, 'ST_FOR', {
        value: 'for'
    });
    Object.defineProperty(Compiler, 'ST_EACH', {
        value: 'each'
    });

    Object.defineProperty(Compiler, 'ST_DO', {
        value: 'do'
    });
    Object.defineProperty(Compiler, 'ST_WHILE', {
        value: 'while'
    });
    Object.defineProperty(Compiler, 'ST_CASE', {
        value: 'case'
    });
    Object.defineProperty(Compiler, 'ST_DEFAULT', {
        value: 'default'
    });


    Object.defineProperty(Compiler, 'ST_TRY', {
        value: 'try'
    });
    Object.defineProperty(Compiler, 'ST_CATCH', {
        value: 'catch'
    });
    Object.defineProperty(Compiler, 'ST_FINALLY', {
        value: 'finally'
    });

    Object.defineProperty(Compiler, 'ST_BREAK', {
        value: 'break'
    });
    Object.defineProperty(Compiler, 'ST_CONTINUE', {
        value: 'continue'
    });
    Object.defineProperty(Compiler, 'ST_VAR', {
        value: 'var'
    });

    Object.defineProperty(Compiler, 'ST_RETURN', {
        value: 'return'
    });
    Object.defineProperty(Compiler, 'ST_THROW', {
        value: 'throw'
    });
    Object.defineProperty(Compiler, 'ST_IMPORT', {
        value: 'import'
    });


    /**
     * Used during compiling only.
     */
    Object.defineProperty(Compiler, '_jumpStatements', {
        value: [Compiler.ST_BREAK, Compiler.ST_CONTINUE, Compiler.ST_RETURN, Compiler.ST_THROW]
    });


    /**
     * Only used during evaluation and decompiling.
     */
    Object.defineProperty(Compiler, 'ST_FOR_DO', {
        value: 'for do'
    });


    /**
     * Only used during evaluation and decompiling.
     */
    Object.defineProperty(Compiler, 'ST_FOR_IN', {
        value: 'for in'
    });


    /**
     * Used  single token for simplicity.
     */
    Object.defineProperty(Compiler, 'ST_FOR_EACH', {
        value: 'for each'
    });


    /**
     * must be enclosed in () with expressions separated by ;
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_PARAMS', {
        value: 'PARAMS'
    });


    /**
     * MUST be a {} code block.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_BLOCK', {
        value: 'BLOCK'
    });


    /**
     * may contain either a single statement or a {} code block.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_STMT', {
        value: 'STMT'
    });


    /**
     * may only contain one expression, optionally enclosed in (), no statements.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_EXPR', {
        value: 'EXPR'
    });


    /**
     * variable names and/or assignments separated by commas
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_VARS', {
        value: 'VARS'
    });

    /**
     * longer patterns appear earlier so they will match before shorter patterns when checked in order
     */
    Object.defineProperty(Compiler, '_validStatementPatterns', {
        value: [
			[Compiler.ST_IF, Compiler.PN_PARAMS, Compiler.PN_STMT, Compiler.ST_ELSE, Compiler.PN_STMT],
			[Compiler.ST_IF, Compiler.PN_PARAMS, Compiler.PN_STMT],
			[Compiler.ST_FOR_EACH, Compiler.PN_PARAMS, Compiler.PN_STMT],
			[Compiler.ST_FOR, Compiler.PN_PARAMS, Compiler.PN_STMT],
			[Compiler.ST_DO, Compiler.PN_STMT, Compiler.ST_WHILE, Compiler.PN_PARAMS],
			[Compiler.ST_WHILE, Compiler.PN_PARAMS, Compiler.PN_STMT],
			[Compiler.ST_TRY, Compiler.PN_BLOCK, Compiler.ST_CATCH, Compiler.PN_PARAMS, Compiler.PN_BLOCK, Compiler.ST_FINALLY, Compiler.PN_BLOCK],
			[Compiler.ST_TRY, Compiler.PN_BLOCK, Compiler.ST_FINALLY, Compiler.PN_BLOCK],
			[Compiler.ST_TRY, Compiler.PN_BLOCK, Compiler.ST_CATCH, Compiler.PN_PARAMS, Compiler.PN_BLOCK],
			[Compiler.ST_BREAK],
			[Compiler.ST_CONTINUE],
			[Compiler.ST_RETURN, Compiler.PN_EXPR],
			[Compiler.ST_RETURN],
			[Compiler.ST_THROW, Compiler.PN_EXPR],
			[Compiler.ST_VAR, Compiler.PN_VARS],
			[Compiler.ST_IMPORT, Compiler.PN_EXPR]
		]
    });



    /**
     * This is used to match number tokens.
     */
    Object.defineProperty(Compiler, 'numberRegex', {
        value: new RegExp(/^(0x[0-9A-Fa-f]+|[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/)
    });

    Object.defineProperty(Compiler, 'unicodeRegex', {
        value: new RegExp(/^(\{[0-9A-Fa-f]+\}|[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])/)
    });

    Object.defineProperty(Compiler, '_statementsWithoutParams', {
        value: [
			Compiler.ST_ELSE, Compiler.ST_DO, Compiler.ST_BREAK, Compiler.ST_CONTINUE, Compiler.ST_CASE, Compiler.ST_DEFAULT,
			Compiler.ST_TRY, Compiler.ST_FINALLY, Compiler.ST_RETURN, Compiler.ST_THROW, Compiler.ST_VAR, Compiler.ST_IMPORT
		]
    });

    Object.defineProperty(Compiler, '_statementsWithParams', {
        value: [
			Compiler.ST_IF, Compiler.ST_FOR, Compiler.ST_EACH, Compiler.ST_FOR_EACH, Compiler.ST_WHILE, Compiler.ST_SWITCH, Compiler.ST_CATCH
		]
    });

    /**
     * The list of packages to check when looking up class definitions.
     */
    Object.defineProperty(Compiler, 'defaultPackages', {
        value: []
    });


    Compiler._staticInstance = null;


    //constructor
    function Compiler(includeDefaultLibraries) {
        //private
        Object.defineProperty(this, 'JUMP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'LOOP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'BRANCH_LOOKUP', {
            value: new Map() // // Function -> Boolean, for short-circuiting
        });
        Object.defineProperty(this, 'ASSIGN_OP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'PURE_OP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'MAX_OPERATOR_LENGTH', {
            value: 4
        });


        /**
         * This is a list of objects and/or classes containing functions and constants supported by the compiler.
         */
        Object.defineProperty(this, 'libraries', {
            value: []
        });


        /**
         * This object maps the name of a predefined constant to its value.
         */

        this.constants = null;
        /**
         * This object maps the name of a global symbol to its value.
         */

        this.globals = null;
        /**
         * This object maps an operator like "*" to a Function or a valie of true if there is no function.
         */

        this.operators = null;
        /**
         * A pure operator is one that always gives the same result when invoked with the same parameters.
         * This object maps a pure operator like "+" to its corresponding function.
         */

        this.pureOperators = null;
        /**
         * This object maps an assignment operator like "=" to its corresponding function.
         * This object is used  quick lookup to see if an operator is an assignment operator.
         */

        this.assignmentOperators = null;
        /**
         * This is a two-dimensional Array of operator symbols arranged in the order they should be evaluated.
         * Each nested Array is a group of operators that should be evaluated in the same pass.
         */

        this.orderedOperators = null;
        /**
         * This is an Array of all the unary operator symbols.
         */

        this.unaryOperatorSymbols = null;

        /**
         * This is used to temporarily store the host of the property that was accessed by the last call to the '.' operator.
         */
        this._propertyHost = null;
        /**
         * This is used to temporarily store the property name that was accessed by the last call to the '.' operator.
         */
        this._propertyName = null;
        /**
         * Set this to true to enable trace statements for debugging.
         */
        this.debug = false;

        initialize.call(this);
        if (includeDefaultLibraries)
            includeLibraries(Math, weavecore.StandardLib);
        //includeLibraries(Math, StringUtil, weavecore.StandardLib, Dictionary);
    }

    /**
     * Attempts to compile an expression as a constant, then returns the constant value.
     * @param constantExpression
     * @return The value of the expression.
     * @throws Error if the expression cannot be evaluated as a constant.
     */
    Compiler.parseConstant = function (constantExpression) {
        if (!Compiler._staticInstance)
            Compiler._staticInstance = new Compiler(false);
        var compiled = Compiler._staticInstance.finalize.call(Compiler._staticInstance, Compiler._staticInstance.compileTokens(Compiler._staticInstance.getTokens.call(Compiler._staticInstance, constantExpression), false), true);
        if (compiled instanceof weavecore.CompiledConstant) {
            return (compiled).value;
        } else {
            throw new Error("Expression does not evaluate to a constant");
        }
    }


    /**
     * This function surrounds a String with quotes and escapes special characters using ActionScript string literal format.
     * @param string A String that may contain special characters.
     * @param useDoubleQuotes If this is true, double-quote will be used.  If false, single-quote will be used.
     * @return The given String formatted for ActionScript.
     */
    Compiler.encodeString = function (string, quote) {
        quote = (quote === undefined) ? '"' : quote;
        if (string === null)
            return 'null';
        var result = [];
        result.length = string.length
        for (var i = 0; i < string.length; i++) {
            var chr = string.charAt(i);
            var esc = (chr === quote) ? quote : Compiler.ENCODE_LOOKUP[chr];
            result[i] = esc ? '\\' + esc : chr;
        }
        return quote + result.join('') + quote;
    }

    Compiler.isClass = function (object) {
        return object.prototype && object.name && object.name.length > 0 && object.prototype.constructor.name === object.name;
    }

    /**
     * Casts an object to a specified type.
     * If given an unclassed Object, the properties will be copied over to a new instance of the type.
     * @param object An object to cast.
     * @param type The desired type.
     * @return An instance of the desired type.
     * @throws Error If unable to cast the object to the desired type.
     */
    Compiler.cast = function (object, type) {
        if (object instanceof type || object === null || object.constructor.name !== 'Object')
            return type(object);
        var newObj = new type();
        for (var key in object)
            if (newObj.hasOwnProperty(key))
                newObj[key] = object[key];
        return newObj;
    }

    /**
     * Generates a deterministic JSON-like representation of an object, meaning object keys appear in sorted order.
     * @param value The object to stringify.
     * @param replacer A function like function(key, value)
     * @param indent Either a Number or a String to specify indentation of nested values
     * @param json_values_only If this is set to true, only JSON-compatible values will be used (NaN/Infinity/undefined -> null)
     */
    Compiler.stringify = function (value, replacer, indent, json_values_only) {
        replacer = (replacer === undefined) ? null : replacer;
        indent = (indent === undefined) ? null : indent;
        json_values_only = (json_values_only === undefined) ? false : json_values_only;
        indent = indent ? indent : '';
        indent = (indent.constructor === Number) ? weavecore.StandardLib.lpad('', indent, ' ') : String(indent);
        return Compiler._stringify("", value, replacer, indent ? '\n' : '', indent, json_values_only);
    }

    Compiler._stringify = function (key, value, replacer, lineBreak, indent, json_values_only) {
        if (replacer !== null)
            value = replacer(key, value);

        var output;
        var item;
        var key;

        if (value.constructor === String)
            return Compiler.encodeString(value);

        // non-string primitives
        if (value === null || typeof value !== 'object') {
            if (json_values_only && (value === undefined || !isFinite(value)))
                value = null;
            return String(value) || String(null);
        }

        // loop over keys in Array or Object
        var lineBreakIndent = lineBreak + indent;
        var valueIsArrayOrVector = value.constructor === Array;
        output = [];
        if (valueIsArrayOrVector) {
            for (var i = 0; i < value.length; i++)
                output.push(Compiler._stringify(String(i), value[i], replacer, lineBreakIndent, indent, json_values_only));
        } else if (value.constructor.name === 'Object') {
            for (key in value)
                output.push(Compiler.encodeString(key) + ": " + Compiler._stringify(key, value[key], replacer, lineBreakIndent, indent, json_values_only));
            // sort keys
            weavecore.StandardLib.sort(output);
        }
        /*else {
               for each(var list in DescribeType.getInfo(value, DescribeType.ACCESSOR_FLAGS | DescribeType.VARIABLE_FLAGS)['traits'])
               for each(item in list)
               if (item.access != 'writeonly' && !item.uri) // ignore properties with namespaces
                   output.push(Compiler.encodeString(item.name) + ": " + _stringify(item.name, value[item.name], replacer, lineBreakIndent, indent, json_values_only));
               // sort keys
               StandardLib.sort(output);
           }*/

        if (output.length === 0)
            return valueIsArrayOrVector ? "[]" : "{}";

        return (valueIsArrayOrVector ? "[" : "{") + lineBreakIndent + output.join(indent ? ',' + lineBreakIndent : ', ') + lineBreak + (valueIsArrayOrVector ? "]" : "}");
    }

    /**
     * First checks deprecatedClassReplacements, then getDefinitionByName().
     * @param name The name used to look up a definition.
     * @return The corresponding object.
     * @throws Error If there is no definition corresponding to the name.
     */
    Compiler.getDefinition = function (name) {
        // return cached definition if present
        var def = Compiler.classAliases[name];
        if (def)
            return def;
        def = weavecore.ClassUtils.hasClassDefinition(name) ? weavecore.ClassUtils.getClassDefinition(name) : null;
        if (def)
            return def;

        if (domain[name]) {
            return domain[name];
        }


        // if it's not a fully qualified name, check the default packages

        for (var i = -1; i < Compiler.defaultPackages.length; i++) {
            var pkg = i < 0 ? "" : Compiler.defaultPackages[i];
            var qname = i < 0 ? name : (Compiler.defaultPackages[i] + "." + name);
            if (domain[pkg] && domain[pkg][name]) {
                // cache definition for next time
                def = weavecore.ClassUtils.hasClassDefinition(qname) ? weavecore.ClassUtils.getClassDefinition(qname) : null
                def = def ? def : eval(qname);
                if (def) {
                    classAliases[name] = def;
                    classAliases[altName] = def;
                }
                return def;
            }
        }


    }

    var p = Compiler.prototype;


    /**
     * This function will include additional libraries to be supported by the compiler when compiling functions.
     * @param classesOrObjects An Array of Class definitions or objects containing functions to be supported by the compiler.
     */
    p.includeLibraries = function () {
        var classesOrObjects = Array.prototype.slice.call(this, arguments);
        for (var i = 0; i < classesOrObjects.length; i++) {
            var library = classesOrObjects[i];
            // only add this library to the list if it is not already added.
            if (library != null && this.libraries.indexOf(library) < 0) {
                var className = null;
                if (library.constructor === String) {
                    className = library;
                    library = Compiler.getDefinition.call(this, className);
                    if (this.libraries.indexOf(library) >= 0)
                        continue;
                } else if (Compiler.isClass(library)) {
                    className = library.constructor.name;
                }
                if (className) {
                    // save the class name as a symbol
                    //className = className.substr(Math.max(className.lastIndexOf('.'), className.lastIndexOf(':')) + 1);
                    this.globals[className] = library;
                }
                /*if (library is Function) // special case for global function like flash.utils.getDefinitionByName
                	continue;*/

                this.libraries.push(library);
            }
        }

    }

    /**
     * This function compiles an expression into a Function that evaluates using variables from a symbolTable.
     * @param expression An expression to compile.
     * @param symbolTable This is a lookup table containing custom variables and functions that can be used in the expression. Multiple lookup tables can be specified in an Array. The values in the lookup tables may be changed outside the function after compiling.
     * @param errorHandler A function that takes an Error and optionally returns true if execution should continue, behaving  the current instruction returned undefined.
     * @param useThisScope If this is set to true, properties of 'this' can be accessed  they were local variables.
     * @param paramNames This specifies local variable names to be associated with the arguments passed in  to the compiled function.
     * @param paramDefaults This specifies default values corresponding to the parameter names.  This must be the same length  paramNames array.
     * @return A Function generated from the expression String.
     * @throws Error If the expression is invalid.
     */
    p.compileToFunction = function (expression, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults) {
        errorHandler = (errorHandler === undefined) ? null : errorHandler;
        useThisScope = (useThisScope === undefined) ? false : useThisScope;
        paramNames = (paramNames === undefined) ? null : paramNames;
        paramDefaults = (paramDefaults === undefined) ? null : paramDefaults;

        var tokens = getTokens.call(this, expression);
        //trace("source:", expression, "tokens:" + tokens.join(' '));
        var compiledObject = finalize.call(this, compileTokens.call(this, tokens, true));
        return this.compileObjectToFunction(compiledObject, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults);
    }

    /**
     * Tests if an expression is a single, valid symbol name.
     */
    p.isValidSymbolName = function (expression) {
        try {
            var tokens = getTokens.call(this, expression);
            if (tokens.length !== 1 || expression !== tokens[0])
                return false;
            var str = tokens[0];
            if (this.operators.hasOwnProperty(str.charAt(0)))
                return false;
            return !Compiler.numberRegex.exec(str);
        } catch (e) {
            console.warn(e);
        }
        return false;
    }

    function getTokens(expression) {
        var tokens = [];
        if (!expression)
            return tokens;
        var n = expression.length;
        // get a flat list of tokens
        var i = 0;
        while (i < n) {
            var token = getToken.call(this, expression, i);
            var substr = token.substr(0, 2);
            // skip whitespace and comments
            if (substr != '//' && substr != '/*' && Compiler.WHITESPACE.indexOf(token.charAt(0)) === -1)
                tokens.push(token);
            i += token.length;
        }
        return tokens;
    }

    /**
     * This function is for internal use only.
     * @param expression An expression to parse.
     * @param index The starting index of the token.
     * @return The token beginning at the specified index.
     * @throws Error If a block comment or quoted String is not terminated properly.
     */
    function getToken(expression, index) {
        var endIndex;
        var n = expression.length;
        var c = expression.charAt(index);

        // handle comments
        if (c === '/') {
            var c2 = expression.charAt(index + 1);

            if (c2 === '/') // line comment
                return expression.substr(index).split('\r')[0].split('\n')[0];

            if (c2 === '*') /* block comment */ {
                var endBlockComment = expression.indexOf("*/", index + 2);
                if (endBlockComment < 0)
                    throw new Error('Missing end sequence of block comment ("*/"): ' + expression.substr(index));
                return expression.substring(index, endBlockComment + 2);
            }
        }

        // handle quoted string
        if (c === '"' || c === "'" || c === '`') {
            var quote = c;
            // index points to the opening quote
            // make endIndex point to the matching end quote
            for (c = null, endIndex = index + 1; endIndex < n; endIndex++) {
                c = expression.charAt(endIndex);
                // stop when matching quote found, unless there are two together for an escape sequence
                if (c === quote) {
                    if (endIndex < n - 1 && expression.charAt(endIndex + 1) === quote) {
                        // skip second quote
                        endIndex++;
                    } else {
                        // return the quoted string, including the quotes
                        return expression.substring(index, endIndex + 1);
                    }
                } else if (c === '\\') // handle escape sequences
                {
                    endIndex++; // skip the next character
                }
            }
            // invalid quoted string
            throw new Error("Missing matching end quote: " + expression.substr(index));
        }

        // handle numbers
        var foundNumber = Compiler.numberRegex.exec(expression.substr(index));
        if (foundNumber)
            return foundNumber[0];

        // handle operators (find the longest matching operator)
        // this function assumes operators h been initialized
        if (this.operators.hasOwnProperty(c)) // only handle operator if it begins with operator character (doesn't include as,in,instanceof,is)
            for (var opLength = this.MAX_OPERATOR_LENGTH; opLength > 0; opLength--)
            if (this.operators.hasOwnProperty(c = expression.substr(index, opLength)))
                return c;

            // handle whitespace (find the longest matching sequence)
        endIndex = index;
        while (endIndex < n && Compiler.WHITESPACE.indexOf(expression.charAt(endIndex)) >= 0)
            endIndex++;
        if (index < endIndex)
            return expression.substring(index, endIndex);

        // handle everything else (go until a special character is found)
        for (endIndex = index + 1; endIndex < n; endIndex++) {
            c = expression.charAt(endIndex);
            // whitespace terminates a token
            if (Compiler.WHITESPACE.indexOf(c) >= 0)
                break;
            // operator terminates a token
            if (this.operators.hasOwnProperty(c))
                break;
        }
        return expression.substring(index, endIndex);
    }

    /**
     * This function will recursively compile a set of tokens into a compiled object representing a function that takes no parameters and returns a value.
     * Example set of input tokens:  pow ( - ( - 2 + 1 ) ** - 4 , 3 ) - ( 4 + - 1 )
     * @param tokens An Array of tokens for an expression.  This array will be modified in place.
     * @param allowSemicolons Set to true to allow multiple statements and empty expressions.
     * @return A CompiledConstant or CompiledFunctionCall generated from the tokens.
     * @throws Error If the tokens do not describe a valid expression.
     */
    function compileTokens(tokens, allowSemicolons) {
        // there are no more parentheses, so the remaining tokens are operators, constants, and variable names.
        if (this.debug)
            console.log("compiling tokens", tokens.join(' '));

        var i;
        var token;
        var str;
        var call;

        // first step: compile quoted Strings and Numbers
        for (i = 0; i < tokens.length; i++) {
            str = (tokens[i].constructor === String) ? tokens[i] : null;

            if (!str)
                continue;

            // if the token starts with a quote, treat it  String
            if (str.charAt(0) === '"' || str.charAt(0) === "'" || str.charAt(0) === '`') {
                tokens[i] = compileStringLiteral.call(this, str);
            } else {
                // attempt to evaluate the token  Number
                try {
                    var number = Number(str);
                    if (!isNaN(number))
                        tokens[i] = new weavecore.CompiledConstant(str, number);
                } catch (e) {}
            }
        }


        // next step: compile escaped operators
        for (i = 0; i < tokens.length - 1; i++) {
            token = tokens[i];
            if (token === Compiler.OPERATOR_ESCAPE && this.operators[tokens[i + 1]].constructor === Function) {
                token = tokens[i + 1];
                tokens.splice(i, 2, new weavecore.CompiledConstant(Compiler.OPERATOR_ESCAPE + token, this.operators[token]));
            }
        }

        // next step: combine 'for each' into a single token
        for (i = tokens.length; i > 0; i--)
            if (tokens[i] === Compiler.ST_EACH && tokens[i - 1] === Compiler.ST_FOR)
                tokens.splice(i - 1, 2, Compiler.ST_FOR_EACH);
        if (tokens[0] === Compiler.ST_EACH)
            throw new Error("Invalid statement 'each'");

        // next step: compile unary '#' operators (except those immediately followed by other operators)
        if (this.operators.hasOwnProperty('#'))
            compileUnaryOperators.call(this, tokens, ['#']);

        // next step: handle operators "..[]{}()"
        compileBracketsAndProperties.call(this, tokens);

        // next step: handle stray operators "..[](){}"
        for (i = 0; i < tokens.length; i++)
            if (tokens[i].constructor === String && '..[](){}'.indexOf(tokens[i]) >= 0)
                throw new Error("Misplaced '" + tokens[i] + "'" + _betweenTwoTokens.call(this, tokens[i - 1], tokens[i + 1]));

            // next step: compile constants and variable names
        for (i = 0; i < tokens.length; i++) {
            token = (tokens[i].constructor === String) ? tokens[i] : null;
            // skip tokens that have already been compiled and skip operator tokens
            if (token === null || this.operators.hasOwnProperty(token))
                continue;
            // evaluate constants
            if (this.constants.hasOwnProperty(token)) {
                tokens[i] = new weavecore.CompiledConstant(token, this.constants[token]);
                continue;
            }
            // treat everything else  variable name.
            // make a copy of the variable name that is safe for the wrapper function to use
            // compile the token  call to variableGetter.
            tokens[i] = compileVariable.call(this, token);
        }

        // next step: compile new operator used  unary operator (missing parentheses)
        compileUnaryOperators.call(this, tokens, [Compiler.OPERATOR_NEW]);

        // next step: compile unary '#' operators
        if (this.operators.hasOwnProperty('#'))
            compileUnaryOperators.call(this, tokens, ['#']);

        compilePostfixOperators(tokens, ['--', '++']);

        // next step: compile infix '**' operators
        compileInfixOperators.call(this, tokens, ['**']);

        // next step: compile unary operators
        compileUnaryOperators.call(this, tokens, this.unaryOperatorSymbols);

        // next step: compile remaining infix operators in order
        for (i = 0; i < this.orderedOperators.length; i++)
            compileInfixOperators.call(this, tokens, this.orderedOperators[i]);

        // next step: compile conditional branches
        conditionals: while (true) {
                // true branch includes everything between the last '?' and the next ':'
                var left = tokens.lastIndexOf('?');
                var right = tokens.indexOf(':', left);

                var terminators = [',', ';'];
                for (var index in terminators) {
                    var terminator = terminators[index];
                    var terminatorIndex = tokens.indexOf(terminator, left);
                    if (terminatorIndex >= 0 && terminatorIndex < right)
                        throw new Error("Expecting colon before '" + terminator + "'");
                    if (terminatorIndex === right + 1)
                        break conditionals; // missing expression
                }

                // stop if operator missing or any section h tokens
                if (right < 0 || left < 1 || left + 1 === right || right + 1 === tokens.length)
                    break;

                // false branch includes everything after ':' and up until the next ?:,;
                var end = right + 2;
                while (end < tokens.length) {
                    token = tokens[end];
                    if (token && '?:,;'.indexOf(token) >= 0)
                        break;
                    end++;
                }
                if (this.debug)
                    console.log("compiling conditional branch:", tokens.slice(left - 1, right + 2).join(' '));

                // condition includes only the token to the left of the '?'
                var condition = compileTokens.call(this, tokens.slice(left - 1, left), false);
                var trueBranch = compileTokens.call(this, tokens.slice(left + 1, right), false);
                var falseBranch = compileTokens.call(this, tokens.slice(right + 1, end), false);
                tokens.splice(left - 1, end - left + 1, compileOperator.call(this, '?:', [condition, trueBranch, falseBranch]));
            }
            // stop if any branch operators remain
        if (Math.max(tokens.indexOf('?')) >= 0)
            throw new Error('Invalid conditional branch');

        // next step: inline functions (headers only), right to left
        i = tokens.length;
        while (i--) {
            if (tokens[i] === Compiler.FUNCTION)
                tokens.splice(i, 2, compileFunctionHeader.call(this, Compiler.FUNCTION, tokens[i + 1]));
            if (tokens[i] === '=>')
                tokens.splice(i - 1, 2, compileFunctionHeader.call(this, '=>', tokens[i - 1]));
        }

        // next step: function applications
        for (i = 0; i < tokens.length; i++) {
            call = (tokens[i] && tokens[i] instanceof weavecore.CompiledFunctionCall) ? tokens[i] : null;
            if (call && call.evaluatedMethod === this.operators[','] && tokens[i - 1] instanceof weavecore.ICompiledObject && !isFunctionHeader.call(this, tokens[i - 1]))
                tokens.splice(i - 1, 2, new weavecore.CompiledFunctionCall(tokens[i - 1], call.compiledParams));
        }

        // next step: variable assignment and inline function definitions, right to left
        while (true) {
            i = tokens.length;
            while (i--) {
                if (isFunctionHeader.call(this, tokens[i]))
                    tokens.splice(i, 2, compileFunctionDefinition.call(this, tokens[i], tokens[i + 1]));
                else if (this.assignmentOperators.hasOwnProperty(tokens[i]))
                    break;
            }
            if (i < 0)
                break;
            if (i === 0 || i + 1 === tokens.length)
                throw new Error("Misplaced '" + tokens[i] + "'");
            tokens.splice(i - 1, 3, compileVariableAssignment.call(this, tokens[i - 1], tokens[i], tokens[i + 1]));
        }

        //next step literal property declarations: [variable, ":", expr]
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i + 1] === ':' && tokens[i + 2] instanceof weavecore.ICompiledObject) {
                var constant = (tokens[i] && tokens[i] instanceof weavecore.CompiledConstant) ? tokens[i] : null;
                if (constant && !(constant.value.constructor === String) && this.constants.hasOwnProperty(constant.name) && isValidSymbolName(constant.name))
                    constant = new weavecore.CompiledConstant(constant.name, constant.name);

                call = (tokens[i] && tokens[i] instanceof weavecore.CompiledFunctionCall) ? tokens[i] : null;
                if (isVariableLookup(call))
                    constant = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledConstant) ? call.compiledMethod : null;

                if (constant && constant.value instanceof String)
                    tokens.splice(i, 3, compileOperator.call(this, ":", [constant, tokens[i + 2]]));
            }
        }
        // stop if any ":" remain
        if (tokens.indexOf(':') >= 0)
            throw new Error('Misplaced ":"');

        // next step: commas
        compileInfixOperators.call(this, tokens, [',']);

        // next step: handle statements
        if (allowSemicolons) {
            // remove leading ';'
            while (tokens[0] === ';')
                tokens.shift();
            // convert EXPR; to {EXPR}
            for (i = 1; i < tokens.length; i++) {
                if (tokens[i] === ';') {
                    call = (tokens[i - 1] && tokens[i - 1] instanceof weavecore.CompiledFunctionCall) ? tokens[i - 1] : null;

                    if (Compiler._jumpStatements.indexOf(tokens[i - 1]) >= 0 || (call && call.evaluatedMethod === this.operators['('])) {
                        // support for "return;" and "while (cond);"
                        tokens[i] = compileOperator.call(this, ';', []);
                    } else if (tokens[i - 1] instanceof weavecore.CompiledConstant || (call && call.evaluatedMethod != this.operators[';'])) {
                        // support for "while (cond) expr;"
                        tokens.splice(i - 1, 2, compileOperator.call(this, ';', [tokens[i - 1]]));
                    }
                }
            }

            // if there are any remaining ';', compile separate statements
            if (tokens.indexOf(';') >= 0)
                return compileOperator.call(this, ';', compileArray.call(this, tokens, ';'));

            // there are no more ';'
            assertValidStatementParams.call(this, tokens);
            for (i = 0; i < tokens.length; i++)
                compileStatement.call(this, tokens, i);

            // group multiple statements in {}
            if (tokens.length > 1)
                return compileOperator.call(this, ';', tokens);
        } else if (tokens.indexOf(';') >= 0)
            throw new Error("Misplaced ';'");

        // last step: verify there is only one token left
        if (tokens.length === 1)
            return tokens[0];

        if (tokens.length > 1)
            throw new Error("Missing operator" + _betweenTwoTokens.call(this, tokens[0], tokens[1]));

        if (allowSemicolons)
            return compileOperator.call(this, ';', tokens);

        throw new Error("Empty expression");
    }


    /**
     * This function is for internal use only.  It assumes the string it receives is valid.
     * @param encodedString A quoted String with special characters escaped using ActionScript string literal format.
     * @return The compiled string.
     */
    function compileStringLiteral(encodedString) {
        // remove quotes
        var quote = encodedString.charAt(0);
        var input = encodedString.substr(1, encodedString.length - 2);
        input = input.split(quote + quote).join(quote); // handle doubled quote escape sequences
        var output = "";
        var searchIndex = 0;
        var compiledObjects = [];
        while (true) {
            var escapeIndex = input.indexOf("\\", searchIndex);
            if (escapeIndex < 0)
                escapeIndex = input.length;
            // only support expressions inside { } if the string literal is surrounded by the '`' quote symbol.
            var bracketIndex = quote === '`' ? input.indexOf("{", searchIndex) : -1;
            if (bracketIndex < 0)
                bracketIndex = input.length;

            if (bracketIndex === escapeIndex) // handle end of string
            {
                output += input.substring(searchIndex);
                input = Compiler.encodeString(output, quote); // use original quote symbol

                var compiledString = new weavecore.CompiledConstant(input, output);

                if (compiledObjects.length === 0)
                    return compiledString;

                compiledObjects.unshift(compiledString);
                return new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant('substitute', weavecore.StandardLib.substitute), compiledObjects);
            } else if (escapeIndex < bracketIndex) // handle '\'
            {
                // append everything before the escaped character
                output += input.substring(searchIndex, escapeIndex);

                // look up escaped character
                var c = input.charAt(escapeIndex + 1);
                c = Compiler.DECODE_LOOKUP[c] || c;

                if ('0123'.indexOf(c) >= 0) {
                    // \000 .. \377        a byte specified in octal
                    var oct = input.substr(escapeIndex + 1, 3);
                    c = String.fromCharCode(parseInt(oct, 8));
                    searchIndex = escapeIndex + 4; // skip over escape sequence
                } else if (c === 'x') {
                    // \x00 .. \xFF        a byte specified in hexadecimal
                    var hex = input.substr(escapeIndex + 2, 2);
                    c = String.fromCharCode(parseInt(hex, 16));
                    searchIndex = escapeIndex + 4; // skip over escape sequence
                } else if (c === 'u') {
                    var unicodeDigits;
                    var unicodeValue;
                    var foundUnicode = Compiler.unicodeRegex.exec(input.substr(escapeIndex + 2, maxUnicodeEscapeChars))
                    if (foundUnicode) {
                        unicodeDigits = foundUnicode[0];
                        if (unicodeDigits.charAt(0) === '{') // \u{10FFFF}
                            unicodeValue = parseInt(unicodeDigits.substr(1, unicodeDigits.length - 2), 16);
                        else // \u0000 .. \uFFFF    a 16-bit Unicode character specified in hexadecimal
                            unicodeValue = parseInt(unicodeDigits, 16);
                    }
                    if (!foundUnicode || unicodeValue > maxUnicodeEscapeValue)
                        throw new Error("Malformed Unicode character escape sequence: " + input);
                    c = weavecore.StandardLib.ucs2encode(unicodeValue);
                    searchIndex = escapeIndex + 2 + unicodeDigits.length; // skip over escape sequence
                } else {
                    searchIndex = escapeIndex + 2; // skip over escape sequence
                }

                // append the escaped character
                output += c;
            } else if (bracketIndex < escapeIndex) // handle '{'
            {
                // handle { } brackets for inline code
                var tokens = [];
                var token = null;
                var depth = 1;
                escapeIndex = bracketIndex + 1;
                while (escapeIndex < input.length) {
                    token = getToken.call(this, input, escapeIndex);
                    if (token === '{')
                        depth++;
                    if (token === '}')
                        depth--;
                    if (depth === 0)
                        break;
                    if (Compiler.WHITESPACE.indexOf(token.charAt(0)) === -1)
                        tokens.push(token);
                    escapeIndex += token.length;
                }
                if (escapeIndex === input.length)
                    throw new Error("Missing '}' in string literal inline code: " + input);

                // now bracketIndex points to '{' and escapeIndex points to matching '}'
                //replace code between brackets with an int like {0} so the resulting string can be passed to StandardLib.substitute() with compiledObject  next parameter
                output += input.substring(searchIndex, bracketIndex) + '{' + compiledObjects.length + '}';
                searchIndex = escapeIndex + 1;
                compiledObjects.push(compileTokens.call(this, tokens, true));
            }
        }
        throw new Error("unreachable");
    }

    /**
     * This function is for internal use only.
     * This will compile unary operators of the given type from right to left.
     * @param compiledTokens An Array of compiled tokens for an expression.  No '(' ')' or ',' tokens should appear in this Array except when compiling '#' operator.
     * @param operatorSymbols An Array containing all the infix operator symbols to compile.
     */
    function compileUnaryOperators(compiledTokens, operatorSymbols) {
        var call;
        var index = compiledTokens.length;
        while (index--) // right to left
        {

            var token = (compiledTokens[index].constructor === String) ? compiledTokens[index] : null;

            // skip tokens that are not listed unary operators
            if (operatorSymbols.indexOf(token) < 0)
                continue;

            var nextToken = compiledTokens[index + 1];

            if (token === '#') {
                // do not compile unary '#' if immediately followed by an uncompiled operator
                if (operators.hasOwnProperty(nextToken))
                    continue;

                if (nextToken !== undefined)
                    nextToken = compileTokens.call(this, [nextToken], false);
            }

            // fail when next token is not a compiled object, unless we're compiling '#'
            if ((nextToken === undefined && token !== '#') || nextToken.constructor === String)
                throw new Error("Misplaced unary operator '" + token + "'");

            // skip infix operator
            if (index > 0 && compiledTokens[index - 1] instanceof weavecore.ICompiledObject) {
                call = (compiledTokens[index - 1] && compiledTokens[index - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[index - 1] : null;
                if (!call || call.evaluatedMethod !== this.operators[';'])
                    continue;
            }

            // compile unary operator
            if (this.debug)
                console.log("compile unary operator", compiledTokens.slice(index, index + 2).join(' '));

            if (this.assignmentOperators.hasOwnProperty(token)) // unary assignment operators
            {

                call = (nextToken && nextToken instanceof weavecore.CompiledFunctionCall) ? nextToken : null;
                if (call && !call.compiledParams) // variable lookup
                {
                    compiledTokens.splice(index, 2, compileOperator.call(this, token, [call.compiledMethod, newUndefinedConstant()]));
                } else if (call && call.evaluatedMethod === this.operators['.']) {
                    // switch '.' to the unary assignment operator
                    call.compiledParams.push(newUndefinedConstant());
                    compiledTokens.splice(index, 2, compileOperator.call(this, token, call.compiledParams));
                } else {
                    throw new Error("Invalid operand for unary operator " + token);
                }
            } else {
                compiledTokens.splice(index, 2, compileOperator.call(this, token, nextToken === undefined ? [] : [nextToken]));
            }
        }
    }

    function newTrueConstant() {
        return new weavecore.CompiledConstant('true', true);
    }

    function newUndefinedConstant() {
        return new weavecore.CompiledConstant('undefined', undefined);
    }

    function compileOperator(operatorName, compiledParams) {
        operatorName = Compiler.OPERATOR_ESCAPE + operatorName;
        var op = new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant(operatorName, this.constants[operatorName]), compiledParams);
        //op.originalTokens = originalTokensForDecompiling;
        return op;
    }

    /**
     *
     * @param leftBracket
     * @param rightBracket
     * @param tokens
     */
    function compileBracketsAndProperties(tokens) {
        var token;
        var compiledToken;
        var compiledParams;
        var open;
        var close;
        var leftBracket;
        var rightBracket;
        while (true) {
            // find first closing bracket or '.' or '..'
            for (close = 0; close < tokens.length; close++)
                if ('..])}'.indexOf(tokens[close]) >= 0)
                    break;
            if (close === tokens.length || close === 0)
                break; // possible error, or no operator found

            // use matching brackets
            rightBracket = tokens[close];
            if (rightBracket === '..')
                leftBracket = '..';
            else
                leftBracket = '.[({'.charAt('.])}'.indexOf(rightBracket));

            // work backwards to the preceeding, matching opening bracket or stop if '.'
            for (open = close; open >= 0; open--)
                if (tokens[open] === leftBracket)
                    break;
            if (open < 0 || open + 1 === tokens.length)
                break; // possible error, or no operator found

            // unless it's an operator, compile the token to the left
            token = open > 0 ? tokens[open - 1] : null;
            compiledToken = (token && token instanceof weavecore.ICompiledObject) ? token : null;
            if (open > 0 && !compiledToken && !this.operators.hasOwnProperty(token)) {
                // The function token hasn't been compiled yet.
                if (this.constants.hasOwnProperty(token))
                    compiledToken = new weavecore.CompiledConstant(token, this.constants[token]);
                else {
                    var tok = (token && token.constructor === String) ? token : null;
                    var compiledToken = compileVariable.call(this, tok);
                    compiledToken = (compiledToken && compiledToken instanceof weavecore.ICompiledObject) ? compiledToken : null;

                }

            }

            // handle access and descendants operators
            if ('..'.indexOf(tokens[open]) === 0) {
                var propertyToken = tokens[open + 1];

                if (!compiledToken || !propertyToken || this.operators.hasOwnProperty(propertyToken))
                    throw new Error("Misplaced '" + tokens[open] + "' " + _betweenTwoTokens.call(this, token, tokens[open + 1]));

                // the token on the right is a variable name, but we will store it  String because it's a property lookup
                compiledParams = [compiledToken, new weavecore.CompiledConstant(Compiler.encodeString(propertyToken), propertyToken)];
                tokens.splice(open - 1, 3, compileOperator.call(this, tokens[open], compiledParams));
                continue;
            }

            // cut out tokens between brackets
            var subArray = tokens.splice(open + 1, close - open - 1);

            if (this.debug)
                console.log("compiling tokens", leftBracket, subArray.join(' '), rightBracket);

            if (leftBracket === '{') {
                var block = compileTokens.call(this, subArray, true);
                var blockCall = (block && block instanceof weavecore.CompiledFunctionCall) ? block : null;
                if (blockCall) {
                    var blockItems = null;
                    if (blockCall.evaluatedMethod === this.operators[';'] && blockCall.compiledParams.length === 0)
                        blockItems = [];
                    if (blockCall.evaluatedMethod === this.operators[','])
                        blockItems = blockCall.compiledParams;
                    if (blockCall.evaluatedMethod === this.operators[':'])
                        blockItems = [blockCall];
                    if (blockItems && (blockItems.length === 0 || weavecore.StandardLib.getArrayType(blockItems) === weavecore.CompiledFunctionCall)) {
                        var params = [];
                        for (var index in blockItems) {
                            var item = blockItems[index]
                            if (item.evaluatedMethod !== this.operators[':']) {
                                params = null;
                                break;
                            }
                            params.push(item.compiledParams[0], item.compiledParams[1]);
                        }
                        if (params !== null) {
                            tokens.splice(open, 2, compileOperator.call(this, '{', params));
                            continue;
                        }
                    }
                }
                // It's ok if it creates an extra {} wrapper because finalize() will take care of that.
                // It's important to remember that the brackets existed for statement processing.
                tokens.splice(open, 2, compileOperator.call(this, ';', [block]));
                continue;
            }

            var separator = ',';
            if (leftBracket === '(' && Compiler.statements.hasOwnProperty(token) && Compiler.statements[token])
                separator = ';'; // statement parameters are separated by ';'
            compiledParams = compileArray.call(this, subArray, separator);

            if (leftBracket === '[') // this is either an array or a property access
            {
                if (compiledToken) {
                    // property access
                    if (compiledParams.length === 0)
                        throw new Error("Missing parameter for bracket operator: " + this.decompileObject.call(this, compiledToken) + "[]");
                    // the token on the left becomes the first parameter of the access operator
                    compiledParams.unshift(compiledToken);
                    // replace the token to the left and the brackets with the operator call
                    tokens.splice(open - 1, 3, compileOperator.call(this, '.', compiledParams));
                } else {
                    // array initialization -- replace '[' and ']' tokens
                    tokens.splice(open, 2, compileOperator.call(this, '[', compiledParams));
                }
                continue;
            }

            compiledToken = (compiledToken && compiledToken.constructor === weavecore.CompiledFunctionCall) ? compiledToken : null;
            var compiledCall = compiledToken;
            // if there is a compiled token to the left, this is a function call (unless the token is a function header or is a call to operator ';')
            if (leftBracket === '(' && compiledToken && !isFunctionHeader.call(this, compiledToken) && !(compiledCall && compiledCall.evaluatedMethod === this.operators[';'])) {
                if (open >= 2) {
                    var prevToken = tokens[open - 2];
                    if (prevToken === Compiler.OPERATOR_NEW) {
                        compiledParams.unshift(compiledToken);
                        tokens.splice(open - 2, 4, compileOperator.call(this, Compiler.OPERATOR_NEW, compiledParams));
                        continue;
                    }
                }
                if (this.debug)
                    console.log("compiling function call", this.decompileObject.call(this, compiledToken));

                // the token to the left is the method
                // replace the function token, '(', and ')' tokens with a compiled function call
                tokens.splice(open - 1, 3, new weavecore.CompiledFunctionCall(compiledToken, compiledParams));
                continue;
            }

            // '{' or '(' group that does not correspond to a function call

            if (leftBracket === '(' && compiledParams.length === 0 && (token !== Compiler.FUNCTION && tokens[open + 2] != '=>'))
                throw new Error("Missing expression inside parentheses");

            if (leftBracket === '(' && Compiler.statements.hasOwnProperty(token) && Compiler.statements[token])
                separator = '('; // statement params
            tokens.splice(open, 2, compileOperator.call(this, separator, compiledParams));

            if (token === Compiler.FUNCTION && leftBracket === '(')
                tokens.splice(open - 1, 2, compileFunctionHeader.call(this, Compiler.FUNCTION, tokens[open]));
        }
    }

    /**
     * Used for generating a portion of an error message like " between token1 and token2"
     */
    function _betweenTwoTokens(token1, token2) {
        if (token1 instanceof weavecore.ICompiledObject)
            token1 = this.decompileObject(token1);
        if (token2 instanceof weavecore.ICompiledObject)
            token2 = this.decompileObject(token2);
        if (token1 && token2)
            return ' between ' + token1 + ' and ' + token2;
        if (token1)
            return ' after ' + token1;
        if (token2)
            return ' before ' + token2;
        return '';
    }


    /**
     * This function will compile an expression into a compiled object representing a function that takes no parameters and returns a value.
     * This function is useful for inspecting the structure of the compiled function and decompiling individual parts.
     * @param expression An expression to parse.
     * @return A CompiledConstant or CompiledFunctionCall generated from the tokens.
     * @throws Error If the expression is invalid.
     */
    p.compileToObject = function (expression) {
        return finalize.call(this, compileTokens.call(this, getTokens.call(this, expression), true));
    }

    /**
     * Call this to move all var declarations at the beginning of the code and perform optimizations on the compiled objects.
     * @param compiledObject An ICompiledObject to finalize.
     * @param forceInlineObjectConstants If true, forces the evaluation of inline objects to constants.
     * @return A finialized/optimized version of compiledObject.
     */
    function finalize(compiledObject, forceInlineObjectConstants) {
        forceInlineObjectConstants = (forceInlineObjectConstants === undefined) ? false : forceInlineObjectConstants;
        var varLookup = {};

        var final = _finalize.call(this, compiledObject, forceInlineObjectConstants, varLookup);
        if (!final)
            return compiledObject;

        compiledObject = final;

        var names = [];
        for (var name in varLookup)
            names.push(name);

        if (names.length > 0) {
            // there is at least one var declaration, so we need to include it at the beginning.
            var varDeclarations = compileOperator.call(this, Compiler.ST_VAR, [new weavecore.CompiledConstant(null, names)]);
            var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;
            if (call && call.evaluatedMethod === this.operators[';']) {
                call.compiledParams.unshift(varDeclarations);
                call.evaluateConstants();
            } else
                compiledObject = compileOperator.call(this, ';', [varDeclarations, compiledObject]);
        }
        return compiledObject;
    }
    /**
     * @private helper function
     */
    function _finalize(compiledObject, forceInlineObjectConstants, varLookup) {
        if (compiledObject instanceof weavecore.CompiledConstant)
            return compiledObject;

        var i;
        var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;

        // function headers should not appear alone
        if (isFunctionHeader.call(this, call))
            compileFunctionDefinition.call(this, call, null); // this will throw an appropriate error

        call.compiledMethod = _finalize.call(this, call.compiledMethod, forceInlineObjectConstants, varLookup);
        if (!call.compiledMethod)
            throw new Error("Misplaced variable declaration");
        var params = call.compiledParams;
        if (params) {
            for (i = 0; i < params.length; i++) {
                params[i] = _finalize.call(this, params[i], forceInlineObjectConstants, varLookup);
                if (params[i] === null) // variable declaration eliminated?
                    params.splice(i--, 1);
            }
        }
        call.evaluateConstants();

        var method = call.evaluatedMethod;

        if (method === this.operators[':'])
            throw new Error("Invalid object literal syntax");

        // remove var declarations from their current locations
        if (method === this.operators[Compiler.ST_VAR]) {
            call.evaluatedParams[0].forEach(function (name) {
                varLookup[name] = true;
            });
            return null;
        }

        if (method === this.operators[';'] || method === this.operators[','] || method === this.operators['(']) {
            if (params.length === 0) {
                if (this.debug)
                    console.log('optimized empty expression to undefined constant:', this.decompileObject(compiledObject));
                return newUndefinedConstant();
            }
            if (params.length === 1) {
                if (this.debug)
                    console.log('optimized unnecessary wrapper function call:', this.decompileObject(compiledObject));
                return _finalize.call(this, params[0], forceInlineObjectConstants, varLookup);
            }

            // flatten nested grouping operators
            i = params.length;
            while (i--) {
                var nestedCall = (params[i] && params[i] instanceof weavecore.CompiledFunctionCall) ? params[i] : null;
                if (!nestedCall)
                    continue;
                var nestedMethod = nestedCall.evaluatedMethod;
                if (nestedMethod === this.operators[';'] || nestedMethod === this.operators[','] || nestedMethod === this.operators['(']) {
                    if (this.debug)
                        console.log('flattened nested grouped expressions:', this.decompileObject(nestedCall));
                    nestedCall.compiledParams.unshift(i, 1);
                    params.splice(nestedCall.compiledParams);
                }
            }
            call.evaluateConstants();
        }

        if ((method === this.operators[Compiler.ST_IF] || method === this.operators['?:']) && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant) {
            if (this.debug)
                console.log('optimized short-circuited ?: operator:', this.decompileObject(compiledObject));

            var index = call.evaluatedParams[Compiler.INDEX_CONDITION] ? Compiler.INDEX_TRUE : Compiler.INDEX_FALSE;
            return index < params.length ? params[index] : newUndefinedConstant();
        }

        if (method === this.operators['&&'] && params.length === 2 && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant && !call.evaluatedParams[Compiler.INDEX_CONDITION]) {
            if (this.debug)
                console.log('optimized short-circuited && operator:', this.decompileObject(compiledObject));
            return params[Compiler.INDEX_CONDITION];
        }

        if (method === this.operators['||'] && params.length === 2 && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant && call.evaluatedParams[Compiler.INDEX_CONDITION]) {
            if (this.debug)
                console.log('optimized short-circuited || operator:', this.decompileObject(compiledObject));
            return params[Compiler.INDEX_CONDITION];
        }

        if (this.PURE_OP_LOOKUP[method] || (forceInlineObjectConstants && (method === this.operators['{'] || method === this.operators['[']))) {
            // if all parameters are constants, just evaluate the pure operator as a constant.
            for (i = 0; i < params.length; i++) {
                var param = params[i];
                if (!(param instanceof weavecore.CompiledConstant))
                    return call; // cannot be optimized
            }

            if (this.debug)
                console.log('optimized pure operator call to constant:', this.decompileObject(compiledObject));
            return new weavecore.CompiledConstant(this.decompileObject(call), (method).apply(null, call.evaluatedParams));
        }

        return call;
    }


    /**
     * This function is for internal use only.
     * @param compiledObject Either a CompiledConstant or a CompiledFunctionCall.
     * @param symbolTable This is a lookup table containing custom variables and functions that can be used in the expression. Multiple lookup tables can be specified in an Array. The values in the lookup tables may be changed outside the function after compiling.
     * @param errorHandler A function that takes an Error and optionally returns true if execution should continue, behaving as if the current instruction returned undefined.  This may be set to null, which will cause the Error to be thrown.
     * @param useThisScope If this is set to true, properties of 'this' can be accessed as if they were local variables.
     * @param paramNames This specifies local variable names to be associated with the arguments passed in as parameters to the compiled function.
     * @param paramDefaults This specifies default values corresponding to the parameter names.  This must be the same length as the paramNames array.
     * @param flattenFunctionDefinition If set to true and the compiledObject represents a function definition, that function definition will be evaluated and returned.
     * @param bindThis If non-null, the <code>this</code> symbol will be bound to the given value. Otherwise, it will be dynamically determined by how the function is called.
     * @return A Function that takes any number of parameters and returns the result of evaluating the ICompiledObject.
     */
    p.compileObjectToFunction = function (compiledObject, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults, flattenFunctionDefinition, bindThis) {
        paramNames = (paramNames === undefined) ? null : paramNames;
        paramDefaults = (paramDefaults === undefined) ? null : paramDefaults;
        flattenFunctionDefinition = (flattenFunctionDefinition === undefined) ? null : flattenFunctionDefinition;
        bindThis = (bindThis === undefined) ? null : bindThis;

        if (compiledObject === null)
            return null;
        if (paramNames) {
            if (!paramDefaults) {
                paramDefaults = [];
                paramDefaults.length = paramNames.length
            } else if (paramNames.length != paramDefaults.length)
                throw new Error("paramNames and paramDefaults Arrays must have same length");
        }

        if (symbolTable === null)
            symbolTable = {};

        if (compiledObject instanceof weavecore.CompiledConstant) {
            // create a new variable for the value to avoid the overhead of
            // accessing a member variable of the CompiledConstant object.
            const value = (compiledObject).value;
            return function () {
                return value;
            };
        }

        // create the variables that will be used inside the wrapper function

        const builtInSymbolTable = {};
        builtInSymbolTable['eval'] = undefined;
        builtInSymbolTable['this'] = bindThis;

        // set up Array of symbol tables in the correct scope order: built-in, local, params, this, global
        const allSymbolTables = [builtInSymbolTable]; // buit-in first
        const LOCAL_SYMBOL_TABLE_INDEX = allSymbolTables.push(null) - 1; // placeholder

        // add custom symbol table(s)
        if (symbolTable.constructor === Array) {
            symbolTable.forEach(function (_symbolTable) {
                allSymbolTables.push(_symbolTable);
            })
        } else {
            allSymbolTables.push(symbolTable);
        }

        // push placeholder for 'this' symbol table
        const THIS_SYMBOL_TABLE_INDEX = allSymbolTables.push(null) - 1;

        // add libraries in reverse order so the last one will be checked first
        var i = this.libraries.length;
        while (i--)
            allSymbolTables.push(this.libraries[i]);
        // check this.globals last
        allSymbolTables.push(this.globals);

        // this flag is set to useThisScope when the compiledObject is a function definition
        var cascadeThisScope = false;

        // Each recursive call must use a clone of the CompiledFunctionCall,
        // so we keep track of recursion depth and re-use copies of the CompiledFunctionCall.
        var recursion = 0;
        var recursiveCalls = [compiledObject];
        // this function avoids unnecessary function call overhead by keeping its own call stack rather than using recursion.
        var wrapperFunction = function () {
            const stack = []; // used as a queue of function calls
            const localSymbolTable = {};
            var call;
            var subCall;
            var compiledParams;
            var method;
            var result;
            var symbolName;
            var i;
            var propertyHost;
            var propertyName;
            var args = Array.prototype.slice.call(arguments);

            if (bindThis === null)
                builtInSymbolTable['this'] = this;
            builtInSymbolTable['arguments'] = args;

            allSymbolTables[LOCAL_SYMBOL_TABLE_INDEX] = localSymbolTable;
            if (useThisScope)
                allSymbolTables[THIS_SYMBOL_TABLE_INDEX] = builtInSymbolTable['this'];

            // make function parameters available under the specified parameter names
            if (paramNames)
                for (i = 0; i < paramNames.length; i++) {
                    var parName = (paramNames[i].constructor === String) ? paramNames[i] : null;
                    localSymbolTable[parName] = (i < args.length) ? args[i] : paramDefaults[i];
                }

            // initialize top-level function and push it onto the stack
            call = (recursiveCalls[recursion] && recursiveCalls[recursion] instanceof weavecore.CompiledFunctionCall) ? recursiveCalls[recursion] : null;
            if (!call)
                recursiveCalls[recursion] = call = (compiledObject).clone();
            recursion++;

            call.evalIndex = Compiler.INDEX_METHOD;
            stack.length = 1;
            stack[0] = call;
            stackLoop: while (true) {
                // evaluate the CompiledFunctionCall on top of the stack
                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;

                // if we got here because of a break, advance evalIndex
                if (method === this.operators[Compiler.ST_BREAK])
                    call.evalIndex++;

                method = call.evaluatedMethod;
                compiledParams = call.compiledParams;

                if (compiledParams) {
                    if (this.LOOP_LOOKUP.get(method) && call.evalIndex === Compiler.INDEX_METHOD) {
                        if (method === this.operators[Compiler.ST_DO] || method === this.operators[Compiler.ST_FOR_DO]) {
                            // skip first evaluation of loop condition
                            call.evaluatedParams[Compiler.INDEX_CONDITION] = true;
                            call.evalIndex = Compiler.INDEX_TRUE;
                        }
                    }

                    // check which parameters should be evaluated
                    for (; call.evalIndex < compiledParams.length; call.evalIndex++) {
                        //trace(StringLib.lpad('', stack.length, '\t') + "[" + call.evalIndex + "] " + compiledParams[call.evalIndex].name);

                        // handle branching and short-circuiting
                        // skip evaluation of true or false branch depending on condition and branch operator
                        if (this.BRANCH_LOOKUP.get(method) !== undefined && call.evalIndex > Compiler.INDEX_CONDITION)
                            if (this.BRANCH_LOOKUP.get(method) === (call.evalIndex != (call.evaluatedParams[Compiler.INDEX_CONDITION] ? Compiler.INDEX_TRUE : Compiler.INDEX_FALSE)))
                                continue;

                        if (call.evalIndex === Compiler.INDEX_METHOD)
                            subCall = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledFunctionCall) ? call.compiledMethod : null;
                        else
                            subCall = (compiledParams[call.evalIndex] && compiledParams[call.evalIndex] instanceof weavecore.CompiledFunctionCall) ? compiledParams[call.evalIndex] : null;

                        if (subCall != null) {
                            // special case for for-in and for-each
                            // implemented as "for (each|in)(\in(list), item=undefined, stmt)
                            if (this.LOOP_LOOKUP.get(method) && call.evalIndex === Compiler.INDEX_FOR_ITEM && (method === this.operators[Compiler.ST_FOR_IN] || method === this.operators[Compiler.ST_FOR_EACH])) {
                                if ((call.evaluatedParams[Compiler.INDEX_FOR_LIST]).length > 0) {
                                    // next item
                                    result = (call.evaluatedParams[Compiler.INDEX_FOR_LIST]).shift(); // property name
                                    if (method === this.operators[Compiler.ST_FOR_EACH]) {
                                        // get property value from property name
                                        var _in = (call.compiledParams[Compiler.INDEX_FOR_LIST] && call.compiledParams[Compiler.INDEX_FOR_LIST] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[Compiler.INDEX_FOR_LIST] : null;
                                        result = _in.evaluatedParams[0][result]; // property value
                                    }
                                    // set item value
                                    subCall.evaluatedParams[subCall.evaluatedParams.length - 1] = result;
                                } else {
                                    // break out of loop
                                    method = this.operators[Compiler.ST_BREAK];
                                    break;
                                }
                            }

                            // initialize subCall and push onto stack
                            subCall.evalIndex = Compiler.INDEX_METHOD;
                            stack.push(subCall);
                            continue stackLoop;
                        }
                    }
                }
                // no parameters need to be evaluated, so make the function call now
                try {
                    // reset _propertyHost and _propertyName prior to method apply in case we are calling operator '.'
                    propertyHost = this._propertyHost = null;
                    propertyName = this._propertyName = null;

                    if (!compiledParams) // no compiled params means it's a variable lookup
                    {
                        // call.compiledMethod is a constant and call.evaluatedMethod is the method name
                        method = (method && method.constructor === String) ? method : null;
                        symbolName = method;
                        // find the variable
                        for (i = 0; i < allSymbolTables.length; i++) // max i after loop will be length
                        {
                            if (allSymbolTables[i] && allSymbolTables[i].hasOwnProperty(symbolName)) {
                                /*if (i === THIS_SYMBOL_TABLE_INDEX || allSymbolTables[i] is Proxy) {
                                    propertyHost = allSymbolTables[i];
                                    propertyName = symbolName;
                                }*/
                                result = allSymbolTables[i][symbolName];
                                break;
                            }
                        }

                        if (i === allSymbolTables.length)
                            result = Compiler.getDefinition.call(this, symbolName);
                    } else if (this.JUMP_LOOKUP.get(method)) {
                        if (method === this.operators[Compiler.ST_RETURN]) {
                            recursion--;
                            return compiledParams.length ? call.evaluatedParams[0] : undefined;
                        } else if (method === this.operators[Compiler.ST_CONTINUE]) {
                            while (true) {
                                stack.pop();
                                if (stack.length === 0) {
                                    recursion--;
                                    return result; // executing continue at top level of script
                                }

                                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;
                                method = call.evaluatedMethod;
                                if (this.LOOP_LOOKUP.get(method) && this.LOOP_LOOKUP.get(method) !== Compiler.ST_BREAK)
                                    break; // loop will be handled below.
                            }
                        } else if (method === this.operators[Compiler.ST_BREAK]) {
                            while (stack.length > 1) {
                                var popedCall = stack.pop();
                                call = (popedCall && popedCall instanceof weavecore.CompiledFunctionCall) ? popedCall : null;
                                method = call.evaluatedMethod;
                                if (this.LOOP_LOOKUP.get(method) && this.LOOP_LOOKUP.get(method) != Compiler.ST_CONTINUE) {
                                    method = this.operators[Compiler.ST_BREAK];
                                    continue stackLoop;
                                }
                            }
                            recursion--;
                            return result; // executing break at top level
                        } else if (method === this.operators[Compiler.ST_THROW]) {
                            //TODO - find try/catch/finally
                            throw call.evaluatedParams[0];
                        }
                    } else if (this.ASSIGN_OP_LOOKUP.get(method) && compiledParams.length === 2) // two params means local assignment
                    {
                        // local assignment
                        symbolName = call.evaluatedParams[0];
                        if (builtInSymbolTable.hasOwnProperty(symbolName))
                            throw new Error("Cannot assign built-in symbol: " + symbolName);

                        // find the most local symbol table that has the variable
                        for (i = LOCAL_SYMBOL_TABLE_INDEX; i <= THIS_SYMBOL_TABLE_INDEX; i++)
                            if (allSymbolTables[i] && allSymbolTables[i].hasOwnProperty(symbolName))
                                break;
                            // if no symbol table has the variable, create a new local variable
                        if (i > THIS_SYMBOL_TABLE_INDEX)
                            i = LOCAL_SYMBOL_TABLE_INDEX;

                        // assignment operator expects parameters like (host, ...chain, value)
                        result = method(allSymbolTables[i], symbolName, call.evaluatedParams[1]);
                    } else if (method === this.operators[Compiler.ST_IMPORT]) {
                        call.evaluatedParams.forEach(function (result) {
                            result = (result.constructor === String) ? result : null;
                            symbolName = result;
                            if (symbolName)
                                result = Compiler.getDefinition.call(this, result);
                            else if (!Compiler.isClass(result))
                                throw new Error("Unable to import non-Class: " + this.decompileObject(call));

                            if (!symbolName)
                                symbolName = result.constructor.appName;

                            symbolName = symbolName.substr(Math.max(symbolName.lastIndexOf('.'), symbolName.lastIndexOf(':')) + 1);
                            allSymbolTables[LOCAL_SYMBOL_TABLE_INDEX][symbolName] = result;
                        }.bind(this));
                    } else if (method && Compiler.isClass(method)) {
                        // type casting
                        if (method === Array) // special case for Array
                        {
                            result = call.evaluatedParams.concat();
                        } else if (call.evaluatedParams.length != 1) {
                            // special case for Object('prop1', value1, ...)
                            if (method === Object) {
                                var params = call.evaluatedParams;
                                result = {};
                                for (i = 0; i < params.length - 1; i += 2)
                                    result[params[i]] = params[i + 1];
                            } else
                                throw new Error("Incorrect number of arguments for type casting.  Expected 1.");
                        }
                        // special case for Class('some.qualified.ClassName')
                        else if (Compiler.isClass(method) && call.evaluatedParams[0].constructor === String) {
                            result = Compiler.getDefinition.call(this, call.evaluatedParams[0]);
                        } else // all other single-parameter type casting operations
                        {
                            result = cast(call.evaluatedParams[0], method);
                        }
                    } else if (method === this.operators[Compiler.ST_VAR]) // variable initialization
                    {
                        call.evaluatedParams[0].forEach(function (result) {
                            if (!localSymbolTable.hasOwnProperty(result))
                                localSymbolTable[result] = undefined;
                        })
                        result = undefined;
                    } else if (method === this.operators[Compiler.FUNCTION] || method === this.operators['=>']) // inline function definition
                    {
                        var _symbolTables = [localSymbolTable].concat(symbolTable); // works whether symbolTable is an Array or Object
                        if (useThisScope)
                            _symbolTables.push(builtInSymbolTable['this']);

                        var funcParams = call.evaluatedParams[0];
                        result = this.compileObjectToFunction.call(this,
                            funcParams[Compiler.FUNCTION_CODE],
                            _symbolTables,
                            errorHandler,
                            cascadeThisScope,
                            funcParams[Compiler.FUNCTION_PARAM_NAMES],
                            funcParams[Compiler.FUNCTION_PARAM_VALUES],
                            false,
                            method === this.operators['=>'] || (cascadeThisScope && bindThis !== null) ? builtInSymbolTable['this'] : null
                        );
                    }
                    /*else if (call.evaluatedHost is Proxy)
                    {
                    	// use Proxy.callProperty
                    	var proxyParams = call.evaluatedParams.concat();
                    	proxyParams.unshift(call.evaluatedMethodName);
                    	result = (call.evaluatedHost as Proxy).callProperty.apply(call.evaluatedHost, proxyParams);
                    }*/
                    else {
                        // normal function call
                        result = method.apply(call.evaluatedHost, call.evaluatedParams);
                        // in case this is operator '.', save these values
                        propertyHost = this._propertyHost;
                        propertyName = this._propertyName;
                        // then reset them so they do not get re-used by mistake
                        this._propertyHost = null;
                        this._propertyName = null;
                    }
                } catch (e) {
                    recursion--;

                    var decompiled = this.decompileObject(call);
                    var err = e;
                    if (err) {
                        //to-do
                        //fixErrorMessage(err);
                        err.message = decompiled + '\n' + err.message;
                        // console.log(err);
                    } else
                        console.log(decompiled);

                    if (errorHandler === null)
                        throw e;

                    if (errorHandler(e))
                        result = undefined; // ignore and continue
                    else
                        return undefined; // halt
                }

                // handle while and for loops
                if (this.LOOP_LOOKUP.get(method)) {
                    if (method === this.operators[Compiler.ST_FOR_IN] || method === this.operators[Compiler.ST_FOR_EACH]) {
                        // skip evaluation of list to avoid infinite loop
                        call.evalIndex = Compiler.INDEX_FOR_ITEM;
                        continue;
                    } else if (result) {
                        // skip evaluation of method to avoid infinite 'do' loop
                        call.evalIndex = Compiler.INDEX_METHOD + 1;
                        continue;
                    }
                }

                // remove this call from the stack
                stack.pop();
                // if there is no parent function call, return the result
                if (stack.length === 0) {
                    recursion--;
                    return result;
                }
                // otherwise, store the result in the evaluatedParams array of the parent call
                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;
                if (call.evalIndex === Compiler.INDEX_METHOD) {
                    call.evaluatedHost = propertyHost;
                    call.evaluatedMethodName = propertyName;
                    call.evaluatedMethod = result;
                } else
                    call.evaluatedParams[call.evalIndex] = result;
                // advance the evalIndex so the next parameter will be evaluated.
                call.evalIndex++;
            }
            throw new Error("unreachable");
        };

        // if the compiled object is a function definition, return that function definition instead of the wrapper.
        if (flattenFunctionDefinition && this.compiledObjectIsFunctionDefinition.call(this, compiledObject)) {
            cascadeThisScope = useThisScope;
            return wrapperFunction.call(this);
        }

        return wrapperFunction.bind(this);
    }

    /**
     * This will check if the compiled object is a function definition.
     * @param compiledObject A compiled object returned by compileToObject().
     * @return true if the compiledObject is a function definition.
     */
    p.compiledObjectIsFunctionDefinition = function (compiledObject) {
        var cfc = compiledObject;
        return cfc && (cfc.evaluatedMethod === this.operators[Compiler.FUNCTION] || cfc.evaluatedMethod === this.operators['=>']);
    }



    /**
     * @param compiledObject A CompiledFunctionCall or CompiledConstant to decompile into an expression String.
     * @return The expression String generated from the compiledObject.
     */
    p.decompileObject = function (compiledObject) {
        // special case for constants
        if (compiledObject instanceof weavecore.CompiledConstant)
            return (compiledObject).name;

        var i;
        var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;

        // if originalTokens is specified, decompile those instead.
        if (call.originalTokens) {
            var tokens = call.originalTokens.concat();
            for (i = 0; i < tokens.length; i++)
                if (tokens[i] instanceof weavecore.ICompiledObject)
                    tokens[i] = this.decompileObject(tokens[i]);
            return tokens.join(' ');
        }

        // special case for variable lookup
        if (isVariableLookup.call(this, call))
            return this.decompileObject(call.compiledMethod);

        var cMethod = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledConstant) ? call.compiledMethod : null;
        var cParams = call.compiledParams;

        // decompile each param
        var params = [];
        for (i = 0; i < cParams.length; i++)
            params[i] = this.decompileObject(cParams[i]);

        var op;
        if (cMethod) {
            op = cMethod.name;
            if (op.substr(0, Compiler.OPERATOR_ESCAPE.length) === Compiler.OPERATOR_ESCAPE)
                op = op.substr(Compiler.OPERATOR_ESCAPE.length);
        }
        if (cMethod && this.constants[cMethod.name] === cMethod.value && this.operators[op] === cMethod.value) {
            var n = cParams.length;
            var isAssignFuncAvailable = this.ASSIGN_OP_LOOKUP.get(cMethod.value);
            if (n > 0 && (isAssignFuncAvailable || op === '.' || op === '..')) {
                var result = params[0];
                for (i = 1; i < n; i++) {
                    // assignment op h parameter -hand-side value
                    if (i === n - 1 && op !== '.' && op !== '..')
                        break;
                    // if the evaluated param compiles  variable, use the '.' syntax
                    var constant = (cParams[i] && cParams[i] instanceof weavecore.CompiledConstant) ? cParams[i] : null;
                    var variable = null;
                    try {
                        var comObj = compileToObject(constant.value);
                        variable = (comObj && comObj instanceof weavecore.CompiledFunctionCall) ? comObj : null;
                        if (!isVariableLookup(variable))
                            variable = null;
                    } catch (e) {}

                    if (op === '..')
                        result += '.descendants(' + params[i] + ')';
                    else if (variable)
                        result += '.' + variable.evaluatedMethod;
                    else
                        result += '[' + params[i] + ']';
                }
                if (op === '.' || op === '..')
                    return result;
                if (op === '#++' || op === '#--')
                    return result + op.substr(1);
                if (op === '++' || op === '--')
                    return op + result;
                if (op === 'delete')
                    return op + ' ' + result;

                return weavecore.StandardLib.substitute("({0} {1} {2})", result, op, params[n - 1]); // example: "(a.b = c)"
            }

            // variable number of params
            if (op === '[')
                return '[' + params.join(', ') + ']';

            if (op === ';')
                return '{' + params.join('; ') + '}';

            if (op === ',' && n > 0) // zero params not allowed for this syntax
                return '(' + params.join(', ') + ')';

            if (op === '(' && n > 0) // zero params not allowed for this syntax
                return '(' + params.join('; ') + ')';

            if (op === '{') {
                var str = '';
                for (i = 0; i < params.length - 1; i += 2) {
                    if (str)
                        str += ', ';
                    str += params[i] + ': ' + params[i + 1];
                }
                return '{' + str + '}';
            }

            if (this.PURE_OP_LOOKUP.get(cMethod.value) || op === 'in') {
                if (n === 1) // unary op
                {
                    var param = params[0];
                    var c = op.charAt(0);
                    if (this.operators.hasOwnProperty(c) && c !== param.charAt(0))
                        return op + param;
                    // need a space between operators with identical characters
                    return op + ' ' + param;
                }

                if (n === 2) // infix op
                    return weavecore.StandardLib.substitute("({0} {1} {2})", params[0], op, params[1]);

                if (n === 3 && op === '?:') // ternary op
                    return weavecore.StandardLib.substitute("({0} ? {1} : {2})", params);
            }

            if (op === Compiler.ST_VAR) {
                var comCon = (cParams[0] && cParams[0] instanceof weavecore.CompiledConstant) ? cParams[0] : null
                return Compiler.ST_VAR + ' ' + (comCon.value).join(', ');
            }

            if (op === Compiler.ST_IMPORT)
                return Compiler.ST_IMPORT + ' ' + params.join(', ');
        }

        // normal function syntax
        return this.decompileObject(call.compiledMethod) + '(' + params.join(', ') + ')';
    }

    /**
     * Tests if a token is a variable lookup.
     */
    function isVariableLookup(token) {
        var cfc = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        return cfc && !cfc.compiledParams;
    }

    function isFunctionHeader(token) {
        var cfc = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        return cfc && (cfc.evaluatedMethod === this.operators[Compiler.FUNCTION] || cfc.evaluatedMethod === this.operators['=>']) && cfc.evaluatedParams[0][Compiler.FUNCTION_CODE] === undefined;
    }

    /**
     * This function is for internal use only.
     * This function is necessary because variableName needs to be a new Flash variable each time a wrapper function is created.
     * @param variableName The name of the variable to get when the resulting wrapper function is evaluated.
     * @param A CompiledFunctionCall for getting the variable.
     * @return If the variable name is valid, returns an ICompiledObject.  If not valid, the same variableName String is returned.
     */
    function compileVariable(variableName) {
        // do not treat statement keywords  names
        if (Compiler.statements.hasOwnProperty(variableName) || this.operators.hasOwnProperty(variableName))
            return variableName;
        return new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant(variableName, variableName), null); // params are null  special case
    }

    function compilePostfixOperators(compiledTokens, operatorSymbols) {
        for (var i = 1; i < compiledTokens.length; i++) {
            var op = compiledTokens[i];
            if (operatorSymbols.indexOf(op) < 0)
                continue;

            var call = (compiledTokens[i - 1] && compiledTokens[i - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[i - 1] : null;
            if (!call)
                continue;

            if (!call.compiledParams) // variable lookup
            {
                // 2 parameters for assignment/postfix operator means local variable assignment
                // last parameter is ignored but required for postfix operator
                compiledTokens.splice(--i, 2, compileOperator.call(this, '#' + op, [call.compiledMethod, newUndefinedConstant()]));
                continue;
            } else if (call.evaluatedMethod === this.operators['.']) {
                // switch to the postfix operator
                // last parameter is ignored but required for postfix operator
                call.compiledParams.push(newUndefinedConstant());
                compiledTokens.splice(--i, 2, compileOperator.call(this, '#' + op, call.compiledParams));
                continue;
            }
        }
    }

    /**
     * This function is for internal use only.
     * This will compile infix operators of the given type from left to right.
     * @param compiledTokens An Array of compiled tokens for an expression.  No '(' ')' or ',' tokens should appear in this Array.
     * @param operatorSymbols An Array containing all the infix operator symbols to compile.
     */
    function compileInfixOperators(compiledTokens, operatorSymbols) {
        var index = 0;
        while (index < compiledTokens.length) {
            // skip tokens that are not in the list of infix operators
            if (operatorSymbols.indexOf(compiledTokens[index]) < 0) {
                index++;
                continue;
            }

            // special case code for infix operators ('**') that are evaluated prior to unary operators
            var right = index + 1;
            // find the next ICompiledObject
            while (right < compiledTokens.length && compiledTokens[right].constructor === String)
                right++;
            // if there were String tokens, we need to compile unary operators on the right-hand-side
            if (right > index + 1) {
                // extract the right-hand-side, compile unary operators, and then insert the result to the right of the infix operator
                var rhs = compiledTokens.splice(index + 1, right - index);
                compileUnaryOperators.call(this, rhs, this.unaryOperatorSymbols);
                if (rhs.length !== 1)
                    throw new Error("Unable to parse second parameter of infix operator '" + compiledTokens[index] + "'");
                compiledTokens.splice(index + 1, 0, rhs[0]);
            }

            // stop if infix operator does not have compiled objects on either side
            if (index === 0 || index + 1 === compiledTokens.length || compiledTokens[index - 1].constructor === String || compiledTokens[index + 1].constructor === String)
                throw new Error("Misplaced infix operator '" + compiledTokens[index] + "'");

            // replace the tokens for this infix operator call with the compiled operator call
            if (this.debug)
                console.log("compile infix operator", compiledTokens.slice(index - 1, index + 2).join(' '));

            // special case for comma - simplify multiple comm one operator ',' call
            var call = (compiledTokens[index - 1] && compiledTokens[index - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[index - 1] : null;
            if (compiledTokens[index] === ',' && call && call.evaluatedMethod === this.operators[',']) {
                // append next parameter to existing ',' operator call
                call.compiledParams.push(compiledTokens[index + 1]);
                call.evaluateConstants(); // must be called after modifying compiledParams
                compiledTokens.splice(index, 2); // remove the comma and the next token
            } else {
                // replace three tokens "lhs op rhs" with one CompiledFunctionCall "\op(lhs,rhs)"
                compiledTokens.splice(index - 1, 3, compileOperator.call(this, compiledTokens[index], [compiledTokens[index - 1], compiledTokens[index + 1]]));
            }
        }
    }


    /**
     * This function will compile a list of expressions separated by ',' or ';' tokens.
     * @param tokens
     * @return
     */
    function compileArray(tokens, separator) {
        // avoid compiling an empty set of tokens
        if (tokens.length === 0)
            return [];

        var compiledObjects = [];
        while (true) {
            var index = tokens.indexOf(separator);
            if (index >= 0) {
                // compile the tokens before the comma  parameter
                if (index === 0 && separator === ',')
                    throw new Error("Expecting expression before comma");
                compiledObjects.push(compileTokens.call(this, tokens.splice(0, index), separator === ';'));
                tokens.shift(); // remove comma
            } else {
                if (tokens.length === 0 && separator === ',')
                    throw new Error("Expecting expression after comma");
                // compile remaining group of tokens  parameter
                compiledObjects.push(compileTokens.call(this, tokens, separator === ';'));
                break;
            }
        }
        return compiledObjects;
    }


    function compileFunctionDefinition(functionHeader, body) {
        if (!body)
            throwInvalidSyntax.call(this, (functionHeader.compiledMethod).name.substr(Compiler.OPERATOR_ESCAPE.length));
        var cc = functionHeader.compiledParams[0];
        if (cc.value[Compiler.FUNCTION_CODE] != null)
            throw new Error("Unexpected error: attempting to overwrite function body");
        cc.value[Compiler.FUNCTION_CODE] = finalize.call(this, body);
        functionHeader.evaluateConstants();
        functionHeader.originalTokens.push(body);
        return functionHeader;
    }

    function compileVariableAssignment(variableToken, assignmentOperator, valueToken) {
        var lhs = (variableToken && variableToken instanceof weavecore.CompiledFunctionCall) ? variableToken : null;
        var rhs = (valueToken && valueToken instanceof weavecore.ICompiledObject) ? valueToken : null;

        if (!rhs)
            throw new Error("Invalid right-hand-side of '" + assignmentOperator + "': " + (valueToken || this.decompileObject(valueToken)));

        // lhs should either be a variable lookup or a call to operator '.'
        if (lhs && !lhs.compiledParams) // lhs is a variable lookup
        {
            return compileOperator.call(this, assignmentOperator, [lhs.compiledMethod, rhs]);
        } else if (lhs && lhs.evaluatedMethod === this.operators['.']) {
            // switch to the assignment operator
            lhs.compiledParams.push(rhs);
            return compileOperator.call(this, assignmentOperator, lhs.compiledParams);
        } else
            throw new Error("Invalid left-hand-side of '" + assignmentOperator + "': " + (variableToken || this.decompileObject(variableToken)));
    }



    function assertValidStatementParams(tokens) {
        for (var index = 0; index < tokens.length; index++) {
            var statement = (tokens[index].constructor === String) ? tokens[index] : null;
            if (Compiler.statements[statement]) // requires parameters?
            {
                // statement parameters must be wrapped in operator ';' call
                var params = tokens[index + 1];
                if (!params || params.evaluatedMethod != this.operators['('])
                    throwInvalidSyntax(statement);

                var cpl = params.compiledParams.length;

                // 'for' can have 3 statement params
                if (statement === Compiler.ST_FOR && cpl === 3)
                    continue;

                // all other statements must have only one param
                if (cpl !== 1)
                    throwInvalidSyntax.call(this, statement);

                if (statement === Compiler.ST_FOR || statement === Compiler.ST_FOR_EACH) {
                    // if 'for' or 'for each' has only one param, it must be the 'in' operator
                    var call = (params.compiledParams[0] && params.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? params.compiledParams[0] : null; // the first statement param
                    if (!call || call.evaluatedMethod !== this.operators['in'] || call.compiledParams.length !== 2)
                        throwInvalidSyntax(statement);

                    // check the first parameter of the 'in' operator
                    call = (call.compiledParams[0] && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[0] : null;

                    if (call && call.evaluatedMethod === this.operators[','] && call.compiledParams.length === 2) {
                        var _var = call.compiledParams[0];
                        if (!_var || _var.evaluatedMethod !== this.operators[Compiler.ST_VAR])
                            throwInvalidSyntax(statement);
                        call = (call.compiledParams[1] && call.compiledParams[1] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[1] : null; // should be the variable
                    }

                    // the 'in' operator must have a variable or property reference  first parameter
                    if (!call || !(call.compiledParams === null || call.evaluatedMethod === this.operators['.'])) // not a variable and not a property
                        throwInvalidSyntax(statement);
                }

            }
        }
    }

    function throwInvalidSyntax(statement) {
        throw new Error("Invalid '" + statement + "' syntax");
    }

    function tokenIsStatement(token) {
        var call = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        if (!call)
            return Compiler.statements.hasOwnProperty(token);

        var method = call.evaluatedMethod;
        return (this.JUMP_LOOKUP.get(method) || this.LOOP_LOOKUP.get(method))
    }

    /**
     * This function assumes that every token except statements have already been compiled.
     * @param tokens
     * @param startIndex The index of the first token to compile
     */
    function compileStatement(tokens, startIndex) {
        var stmt = (tokens[startIndex].constructor === String) ? tokens[startIndex] : null;
        var call;

        // stop if tokens does not start with a statement
        if (!Compiler.statements.hasOwnProperty(stmt)) {
            // complain about missing ';' after non-statement except for last token
            if (startIndex < tokens.length - 1) {
                call = (tokens[startIndex] && tokens[startIndex] instanceof weavecore.CompiledFunctionCall) ? tokens[startIndex] : null;
                if (!call || (call.evaluatedMethod != this.operators[';'] && !tokenIsStatement.call(this, call))) {
                    if (stmt)
                        throw new Error("Unexpected " + stmt);
                    var next = tokens[startIndex + 1];
                    if (next instanceof weavecore.ICompiledObject)
                        next = this.decompileObject(next);
                    throw new Error("Missing ';' before " + next);
                }
            }
            return;
        }

        var varNames;

        // find a matching statement pattern
        nextPattern: for (var index = 0; index < Compiler._validStatementPatterns.length; index++) {
            var pattern = Compiler._validStatementPatterns[index]
            for (var iPattern = 0; iPattern < pattern.length; iPattern++) {
                if (startIndex + iPattern >= tokens.length)
                    continue nextPattern;

                var type = pattern[iPattern];
                var token = tokens[startIndex + iPattern];
                call = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;

                if (Compiler.statements.hasOwnProperty(type) && token != type)
                    continue nextPattern;

                if (type === Compiler.PN_PARAMS)
                    continue; // params have already been verified

                // if we get past a statement and its params, if compiling something fails we don't need to check any more patterns

                if (type === Compiler.PN_EXPR) // non-statement
                {
                    if (tokenIsStatement.call(this, token))
                        throw new Error('Unexpected ' + token);
                    if (call && call.evaluatedMethod === this.operators[';'] && call.compiledParams.length > 1)
                        throwInvalidSyntax(stmt);
                }

                if (type === Compiler.PN_STMT) {
                    compileStatement.call(this, tokens, startIndex + iPattern);
                }

                if (type === Compiler.PN_BLOCK) {
                    if (!call || call.evaluatedMethod != this.operators[';'])
                        throwInvalidSyntax(stmt);
                }

                if (type === Compiler.PN_VARS) {
                    // must be function call
                    if (tokenIsStatement.call(this, token) || !call)
                        throwInvalidSyntax(stmt);

                    // must be local variable/assignment or list of local variables/assignments

                    // special case for "y, x = 3;" which at this point is stored as {y, x = 3}
                    if (call.evaluatedMethod === this.operators[';']) {
                        if (!(call.evaluatedParams.length === 1 && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall))
                            throwInvalidSyntax(stmt);
                        // remove the operator ';' wrapper
                        tokens[startIndex + iPattern] = token = call = call.compiledParams[0];
                    }

                    // if there is only a single variable, wrap it in an operator ',' call
                    if (isVariableLookup(call) || call.evaluatedMethod === this.operators['='])
                        tokens[startIndex + iPattern] = token = call = compileOperator.call(this, ',', [call]);

                    // special case for "for (var x in y) { }"
                    if (call.evaluatedMethod === this.operators['in'] && call.compiledParams.length === 2) {
                        // check the variable
                        call = (call.compiledParams[0] && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[0] : null;
                        if (!isVariableLookup(call))
                            throwInvalidSyntax(stmt);
                        // save single variable name
                        varNames = [call.evaluatedMethod];
                        continue;
                    }

                    if (call.evaluatedMethod != this.operators[','] || call.compiledParams.length === 0)
                        throwInvalidSyntax(stmt);

                    varNames = [];
                    for (var iParam = 0; iParam < call.compiledParams.length; iParam++) {
                        var variable = (call.compiledParams[iParam] && call.compiledParams[iParam] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[iParam] : null;
                        if (!variable)
                            throwInvalidSyntax.call(this, stmt);

                        if (isVariableLookup(variable)) // local initialization
                        {
                            // variable initialization only -- remove from ',' params
                            call.compiledParams.splice(iParam--, 1);
                            varNames.push(variable.evaluatedMethod);
                        } else if (variable.evaluatedMethod === this.operators['='] && variable.compiledParams.length === 2) // local assignment
                        {
                            varNames.push(variable.evaluatedParams[0]);
                        } else
                            throwInvalidSyntax.call(this, stmt);
                    }
                    call.evaluateConstants();
                }
            }

            // found matching pattern
            var originalTokens = tokens.slice(startIndex, startIndex + pattern.length);
            var params = tokens.splice(startIndex + 1, pattern.length - 1);

            if (stmt === Compiler.ST_VAR) {
                token = compileOperator.call(this, Compiler.ST_VAR, [new weavecore.CompiledConstant(null, varNames)]);
                call = params[0];
                if (call.evaluatedMethod === this.operators['in']) {
                    call.compiledParams[0] = compileOperator.call(this, ',', [token, call.compiledParams[0]]);
                    call.evaluateConstants();
                    token = call;
                } else if (call.compiledParams.length > 0) {
                    call.compiledParams.unshift(token);
                    call.evaluateConstants();
                    token = call;
                }
                originalTokens = null; // avoid infinite decompile recursion
                tokens[startIndex] = token;
            } else if (stmt === Compiler.ST_IMPORT) {
                originalTokens = null;
                call = (params[0] && params[0] instanceof weavecore.CompiledFunctionCall) ? params[0] : null;
                // support multiple imports separated by commas
                if (call && call.evaluatedMethod === this.operators[';'] && call.compiledParams.length === 1)
                    params[0] = call.compiledParams[0];
                if (call && call.evaluatedMethod === this.operators[','])
                    params = call.compiledParams;

                for (var i = 0; i < params.length; i++) {
                    var _lib = (params[i] && params[i] instanceof weavecore.CompiledConstant) ? params[i] : null;
                    if (_lib && _lib.value.constructor === String) {
                        try {
                            var def = Compiler.getDefinition(_lib.value);
                            if (Compiler.isClass(def))
                                _lib.value = def;
                        } catch (e) {
                            /*e.message = 'import ' + decompileObject(_lib) + '\n' + e.message;
                            throw e;*/
                            // ignore compile-time error, hoping it will work at run-time
                        }
                    }
                }
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_IMPORT, params);
            } else if (stmt === Compiler.ST_IF) // if (cond) {stmt} else {stmt}
            {
                // implemented as "cond ? true_stmt : false_stmt"
                params.splice(2, 1); // works whether or not else is present
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_IF, params);
            } else if (stmt === Compiler.ST_DO) // do {stmt} while (cond);
            {
                // implemented as "while (cond && (stmt, true))" with first evaluation of 'cond' skipped
                params = [params[2], compileOperator.call(this, ',', [params[0], newTrueConstant.call(this)])];
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_DO, params);
            } else if (stmt === Compiler.ST_WHILE) // while (cond) {stmt}
            {
                // implemented as "while (cond && (stmt, true));"
                params[1] = compileOperator.call(this, ',', [params[1], newTrueConstant.call(this)]);
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_WHILE, params);
            } else if (stmt === Compiler.ST_FOR || stmt === Compiler.ST_FOR_EACH) // for (params) {stmt}
            {
                var forParams = params[0]; // statement params wrapper
                if (forParams.compiledParams.length === 3) // for (init; cond; inc) {stmt}
                {
                    // implemented as "(init, cond) && while((inc, cond) && (stmt, true))" with first evaluation of "(inc, cond)" skipped

                    var _init = forParams.compiledParams[0];
                    var _cond = forParams.compiledParams[1];
                    var _inc = forParams.compiledParams[2];

                    var _init_cond = compileOperator.call(this, ',', [_init, _cond]);
                    var _inc_cond = compileOperator.call(this, ',', [_inc, _cond]);
                    var _stmt_true = compileOperator.call(this, ',', [params[1], newTrueConstant.call(this)]);
                    var _forDo = compileOperator.call(this, Compiler.ST_FOR_DO, [Compiler._inc_cond, _stmt_true]);

                    tokens[startIndex] = compileOperator.call(this, Compiler.ST_FOR, [_init_cond, _forDo]);
                } else // for [each] (item in list) {stmt}
                {
                    // differentiate from 'for' with 3 statement params
                    if (stmt === Compiler.ST_FOR)
                        stmt = Compiler.ST_FOR_IN;

                    // implemented as "for (each|in)(\in(list), item=undefined, stmt)
                    var _in = forParams.compiledParams[0];
                    var _item;
                    var _var = (_in.compiledParams[0] && _in.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? _in.compiledParams[0] : null;
                    if (_var.evaluatedMethod === this.operators[','] && _var.compiledParams.length === 2) // represented as (var x, x)
                    {
                        _var.compiledParams[1] = compileVariableAssignment.call(this, _var.compiledParams[1], '=', newUndefinedConstant());
                    } else {
                        _var = compileVariableAssignment.call(this, _in.compiledParams[0], '=', newUndefinedConstant());
                    }
                    var _list = compileOperator.call(this, 'in', [_in.compiledParams[1]]);
                    tokens[startIndex] = compileOperator.call(this, stmt, [_list, _var, params[1]]);
                }
            } else if (Compiler._jumpStatements.indexOf(stmt) >= 0) {
                tokens[startIndex] = compileOperator.call(this, stmt, params);
            } else {
                throw new Error(stmt + " not supported");
            }

            // save original token list for correct decompiling
            (tokens[startIndex]).originalTokens = originalTokens;

            return;
        }

        // no matching pattern found
        throwInvalidSyntax(stmt);
    }


    function compileFunctionHeader(functionOperator, paramsToken) {
        if (functionOperator !== Compiler.FUNCTION && functionOperator !== '=>')
            throw new Error("compileFunctionHeader called with unsupported operator: " + functionOperator);

        // when compiling a function operator, only the argument list should be provided
        var args = (paramsToken && paramsToken instanceof weavecore.CompiledFunctionCall) ? paramsToken : null;
        if (!args)
            throwInvalidSyntax.call(this, functionOperator);

        // if there is only a single variable name, wrap it in an operator ',' call
        if (!args.compiledParams)
            args = compileOperator.call(this, ',', [args]);

        if (args.evaluatedMethod !== this.operators[','])
            throwInvalidSyntax.call(this, functionOperator);

        // verify that each parameter inside operator ',' is a variable name or a local assignment to a constant.
        var variableNames = [];
        var variableValues = [];
        args.compiledParams.forEach(function (token) {
            var variable = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
            if (!variable)
                throwInvalidSyntax.call(this, functionOperator);

            if (!variable.compiledParams) {
                // local variable
                variableNames.push(variable.evaluatedMethod);
                variableValues.push(undefined);
            } else if (variable.evaluatedMethod === this.operators['='] && variable.compiledParams.length === 2 && variable.compiledParams[1] instanceof weavecore.CompiledConstant) {
                // local variable assignment
                variableNames.push(variable.evaluatedParams[0]);
                variableValues.push(variable.evaluatedParams[1]);
            } else
                throwInvalidSyntax.call(this, functionOperator);
        }.bind(this))
        var functionParams = {};
        functionParams[Compiler.FUNCTION_PARAM_NAMES] = variableNames;
        functionParams[Compiler.FUNCTION_PARAM_VALUES] = variableValues;

        var op = compileOperator.call(this, functionOperator, [new weavecore.CompiledConstant(null, functionParams)]);
        op.originalTokens = functionOperator === Compiler.FUNCTION ? [Compiler.FUNCTION, paramsToken] : [paramsToken, '=>'];
        return op;
    }


    /**
     * This function will initialize the operators and constants.
     */
    function initialize() {


        if (!Compiler.statements) {
            Compiler.statements = {};
            var stmt;
            Compiler._statementsWithParams.forEach(function (stmt) {
                Compiler.statements[stmt] = true;
            })
            Compiler._statementsWithoutParams.forEach(function (stmt) {
                Compiler.statements[stmt] = false;
            })
        }
        this.constants = {};
        this.globals = {};
        this.operators = {};
        this.pureOperators = {};
        this.assignmentOperators = {};

        // constant, built-in symbols
        [null, true, false, undefined, NaN, Infinity].forEach(function (_const) {
            this.constants[String(_const)] = _const;
        }.bind(this));


        // global classes
        [Array, Boolean, Date, Error, Function, Number, Object, String].forEach(function (_class) {
            this.globals[_class.name] = _class;
        }.bind(this));

        'decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,escape,isFinite,isNaN,isPrototypeOf,parseFloat,parseInt,trace,unescape'.split(',').forEach(function (_funcName) {
            this.globals[_funcName] = _funcName.name;
        }.bind(this));




        /** this.operators **/
        // first, make sure all special characters are defined as operators whether or not they have functions associated with them
        var specialChars = "`~!#%^&*()-+=[{]}\\|;:'\",<.>/?";
        for (var i = 0; i < specialChars.length; i++)
            this.operators[specialChars.charAt(i)] = true;

        // now define the functions

        // impure operators
        this.operators["["] = function () {
            return Array.prototype.slice.call(arguments);
        }; // array creation
        this.operators["{"] = function () // object creation
            {
                var args = Array.prototype.slice.call(arguments)
                var o = {};
                var end = args.length - 1;
                for (var i = 0; i < end; i += 2)
                    o[args[i]] = args[i + 1];
                return o;
            }
        this.operators[Compiler.OPERATOR_NEW] = function (classOrQName) {
            var params = Array.prototype.slice.call(arguments);
            classOrQName = params.shift();
            var classDef = classOrQName;
            if (!classDef && classOrQName)
                classDef = Compiler.getDefinition(String(classOrQName));
            switch (params.length) {
            case 0:
                return new classDef();
            case 1:
                return new classDef(params[0]);
            case 2:
                return new classDef(params[0], params[1]);
            case 3:
                return new classDef(params[0], params[1], params[2]);
            case 4:
                return new classDef(params[0], params[1], params[2], params[3]);
            case 5:
                return new classDef(params[0], params[1], params[2], params[3], params[4]);
            case 6:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5]);
            case 7:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6]);
            case 8:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
            case 9:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8]);
            case 10:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8], params[9]);
            default:
                throw new Error("Too many constructor parameters (maximum 10)");
            }
        };
        this.operators[Compiler.FUNCTION] = function () {};
        this.operators['=>'] = function () {};
        this.operators[':'] = function (key, value) {
            this[key] = value;
        };
        // property access should not be optimized to constants
        this.operators["."] = function (object) {
            var chain = Array.prototype.slice.call(arguments);
            object = chain.shift();
            var iHost = chain.length - 2;
            this._propertyHost = object;
            this._propertyName = chain[iHost + 1];
            for (var i = 0; i < chain.length; i++) {
                if (i === iHost)
                    this._propertyHost = object;
                object = object[chain[i]];
            }
            return object;
        };
        this.operators[".."] = function (object, propertyName) {
            /*if (object is XML_Class)
            	return (object as XML_Class).descendants(propertyName);
            if (object is Proxy)
            	return (object as Proxy).getDescendants(propertyName);
            return object.flash_proxy::getDescendants(propertyName);*/
        };
        this.operators['in'] = function () {
            // dual purpose for infix operator and for..in loop initialization
            var args = Array.prototype.slice.call(arguments);
            if (args.length === 2)
                return args[0] in args[1];

            var a = [];
            for (var k in args[0])
                a.push(k);
            return a;
        };
        this.operators[Compiler.ST_VAR] = function () {};
        this.operators[Compiler.ST_IMPORT] = function () {};
        // loop statements
        this.operators[Compiler.ST_DO] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_WHILE] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR_DO] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR_IN] = function () {};
        this.operators[Compiler.ST_FOR_EACH] = function () {};
        // jump statements
        this.operators[Compiler.ST_BREAK] = function () {};
        this.operators[Compiler.ST_CONTINUE] = function () {};
        this.operators[Compiler.ST_RETURN] = function () {};
        this.operators[Compiler.ST_THROW] = function (e) {
            throw e;
        };

        // 'if' statement can be considered a pure operator
        this.pureOperators[Compiler.ST_IF] = function (c, t, f) {
            return c ? t : f;
        };
        // math
        this.pureOperators["**"] = Math.pow;
        this.pureOperators["*"] = function (x, y) {
            return x * y;
        };
        this.pureOperators["/"] = function (x, y) {
            return x / y;
        };
        this.pureOperators["%"] = function (x, y) {
            return x % y;
        };
        this.pureOperators["+"] = function () {
            // this works as a unary or infix operator
            var args = Array.prototype.slice.call(arguments);
            switch (args.length) {
            case 1:
                return +args[0];
            case 2:
                return args[0] + args[1];
            }
        };
        this.pureOperators["-"] = function () {
            var args = Array.prototype.slice.call(arguments);
            // this works as a unary or infix operator
            switch (args.length) {
            case 1:
                return -args[0];
            case 2:
                return args[0] - args[1];
            }
        };
        // bitwise
        this.pureOperators["~"] = function (x) {
            return ~x;
        };
        this.pureOperators["&"] = function (x, y) {
            return x & y;
        };
        this.pureOperators["|"] = function (x, y) {
            return x | y;
        };
        this.pureOperators["^"] = function (x, y) {
            return x ^ y;
        };
        this.pureOperators["<<"] = function (x, y) {
            return x << y;
        };
        this.pureOperators[">>"] = function (x, y) {
            return x >> y;
        };
        this.pureOperators[">>>"] = function (x, y) {
            return x >>> y;
        };
        // comparison
        this.pureOperators["<"] = function (x, y) {
            return x < y;
        };
        this.pureOperators["<="] = function (x, y) {
            return x <= y;
        };
        this.pureOperators[">"] = function (x, y) {
            return x > y;
        };
        this.pureOperators[">="] = function (x, y) {
            return x >= y;
        };
        this.pureOperators["=="] = function (x, y) {
            return x === y;
        };
        this.pureOperators["==="] = function (x, y) {
            return x === y;
        };
        this.pureOperators["!="] = function (x, y) {
            return x != y;
        };
        this.pureOperators["!=="] = function (x, y) {
            return x !== y;
        };
        // logic
        this.pureOperators["!"] = function (x) {
            return !x;
        };
        this.pureOperators["&&"] = function (x, y) {
            return x && y;
        };
        this.pureOperators["||"] = function (x, y) {
            return x || y;
        };
        // branching
        this.pureOperators["?:"] = function (c, t, f) {
            return c ? t : f;
        };
        // multiple commands - equivalent functionality but must be remembered as different operators
        this.pureOperators[','] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        this.pureOperators[';'] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        this.pureOperators['('] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        // operators with alphabetic names
        this.pureOperators['void'] = function () {};
        this.pureOperators['typeof'] = function (value) {
            return typeof (value);
        };
        //this.pureOperators['as'] = function(a, b) { return a as b; };
        this.pureOperators['is'] = this.pureOperators['instanceof'] = function (a, classOrQName) {
            var classDef = (classOrQName && typeof (classOrQName) !== 'string') ? classOrQName : null;
            if (!classDef && classOrQName)
                classDef = Compiler.getDefinition(String(classOrQName));
            return a instanceof classDef;
        };
        // assignment operators -- first arg is host object, last arg is new value, remaining args are a chain of property names
        this.assignmentOperators['='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] = a[i + 1];
        };
        this.assignmentOperators['+='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] += a[i + 1];
        };
        this.assignmentOperators['-='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] -= a[i + 1];
        };
        this.assignmentOperators['*='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] *= a[i + 1];
        };
        this.assignmentOperators['/='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] /= a[i + 1];
        };
        this.assignmentOperators['%='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] %= a[i + 1];
        };
        this.assignmentOperators['<<='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] <<= a[i + 1];
        };
        this.assignmentOperators['>>='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] >>= a[i + 1];
        };
        this.assignmentOperators['>>>='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] >>>= a[i + 1];
        };
        this.assignmentOperators['&&='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            o[a[i]] = o[a[i]] && a[i + 1];
            return o[a[i]];
        };
        this.assignmentOperators['||='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            o[a[i]] = o[a[i]] || a[i + 1];
            return o[a[i]];
        };
        this.assignmentOperators['&='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] &= a[i + 1];
        };
        this.assignmentOperators['|='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] |= a[i + 1];
        };
        this.assignmentOperators['^='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] ^= a[i + 1];
        };
        // special cases: delete, -- and ++ unary operators ignore last parameter
        this.assignmentOperators['--'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return --o[a[i]];
        };
        this.assignmentOperators['++'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return ++o[a[i]];
        };
        this.assignmentOperators['#--'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]]--;
        };
        this.assignmentOperators['#++'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]]++;
        };
        this.assignmentOperators['delete'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return delete o[a[i]];
        };

        // evaluate operators in the same order as ActionScript
        this.orderedOperators = [
				['*', '/', '%'],
				['+', '-'],
				['<<', '>>', '>>>'],
				['<', '<=', '>', '>=', 'in', 'instanceof'],
				['==', '!=', '===', '!=='],
				['&'],
				['^'],
				['|'],
				['&&'],
				['||']
			];
        // unary operators
        this.unaryOperatorSymbols = ['++', '--', '+', '-', '~', '!', 'delete', 'typeof']; // '#' not listed because it has special evaluation order

        var op;


        // copy over pure and assignment operators
        for (var op in this.pureOperators) {
            this.operators[op] = this.pureOperators[op];
        }
        for (var op in this.assignmentOperators) {
            this.operators[op] = this.assignmentOperators[op];
        }

        for (var op in this.operators) {
            if (this.operators[op].constructor === Function)
                this.constants[Compiler.OPERATOR_ESCAPE + op] = this.operators[op];
        }


        // fill reverse-lookup dictionaries
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_IF], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_DO], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_WHILE], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_FOR], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_FOR_DO], true);
        this.BRANCH_LOOKUP.set(this.operators['?:'], true);
        this.BRANCH_LOOKUP.set(this.operators['&&'], true);
        this.BRANCH_LOOKUP.set(this.operators['||'], false);

        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_DO], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_WHILE], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR], Compiler.ST_BREAK); // break target only
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_DO], Compiler.ST_CONTINUE); // continue target only
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_IN], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_EACH], true);

        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_BREAK], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_CONTINUE], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_RETURN], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_THROW], true);


        var key;
        for (key in this.pureOperators) {
            var func = this.pureOperators[key];
            this.PURE_OP_LOOKUP.set(func, true);
        }

        for (key in this.assignmentOperators) {
            var func = this.assignmentOperators[key];
            this.ASSIGN_OP_LOOKUP.set(func, true);
        }

    }


    //-----------------------------------------------------------------
    // Class('weave.compiler.Compiler').test()
    Compiler.test = function (eqIndex) {
        eqIndex = eqIndex === undefined ? 0 : eqIndex;
        var compiler = new weavecore.Compiler();
        var testEqs = [
				"(a = 1, 0) ? (a = 2, a + 1) : (4, a + 100), a",
				"1 + '\"abc ' + \"'x\\\"y\\\\\\'z\"",
				'0 ? trace("?: BUG") : -v',
				'1 ? ~-~-v : trace("?: BUG")',
				'!true && trace("&& BUG")',
				'true || trace("|| BUG")',
				//'round(.5 - random() < 0 ? "1.6" : "1.4")',
				'(- x * 3) / get("v") + -2 + pow(5,3) +\\**(6,3)',
				'\\+ ( - ( - 2 + 1 ) ** - 4 , - 3 ) - ( - 4 + - 1 * - 7 )',
				'-v- - -3+v2',
				'(x + v) / \\+ ( - ( 2 + 1 ) ** 4 , 3 ) - ( 4 + 1 )',
				'3',
				'-3',
				'v',
				'-v',
				//'roundSignificant(random(),3)',
				'rpad("hello", 4+(v+2)*2, "._,")',
				'lpad("hello", 4+(v+2)*2, "._,")',
				'"hello world".substr(v*2, 5)',
				'asString(random()).length',
				'"(0x" + numberToBase(0xFF00FF,16).toUpperCase() + ") " + lpad(numberToBase(v*20, 2, 4), 9) + ", base10: " + rpad(numberToBase(sign(v) * (v+10),10,3), 6) + ", base16: " + numberToBase(v+10,16)', 'if (false) { trace(3) } else trace(4)',
				'do {} while (random());',
				'if (random()) while (random()); if (random()) 1',
				"x = 10; while (x--) trace('x =',x);",
				"for (y = 0; y < 10; y++) trace('y =',y);",
				"x = 0; do { trace('do',x++); } while (trace('cond'), x < 10);",
				//_do_continue_test,
				"for (trace('y =',0), y = 0; trace(y,'<',10), y < 10; trace('y++'), y++) { trace('loop y =',y); }",
				"for (i = 0; i < 10; i++) if (i === 5) return ; else trace(i);",
				"if (true) return ; else trace('test'); trace('BUG');",
				"for (i = 0; i < 10; i++) { if (i === 3) continue; trace(i); if (i === 5) break; } trace('done');",
				"i = 0; do { if (i === 3) continue; trace(i); if (i === 5) break; } while (i >= 0 && ++i < 10) trace('done');",
				"i = -1; while (++i < 10) { if (i === 3) continue; trace(i); if (i === 5) break; } trace('done');",
				"a = []; o = Object('a',1,'b',2,'c',3,'d',4,'e',5); for (k in o) { a.push(`{k} = {o[k]}`); o['?'+k]=k+'!'; delete o[k]; } for each (p in o) a.push(p); return [a,o];",
				"y = 4; x = 3; var x = 4, y; [x, y]",
				"`abc { function(x,y) { return x+y; } } xyz`",
				"var obj = Object('f', function() { return this === obj; }); var ff = obj.f; [obj.f(), (obj.f)(), ff()]",
				"x = 'x'; function(){ x = 3; return x; }() === x"
			];
        var eqs = [testEqs[eqIndex]];
        var values = [-2, -1, -0.5, 0, 0.5, 1, 2];
        var vars = {};
        vars['v'] = 123;
        vars['v2'] = 222;
        vars['x'] = 10;
        vars['get'] = function (name) {
            //console.log("get variable", name, "=", vars[name]);
            return vars[name];
        };

        compiler.debug = true;
        eqs.forEach(function (eq) {
            console.log("expression: " + eq);

            var tokens = getTokens.call(compiler, eq);
            console.log("    tokens:", tokens.join(' '));
            var decompiled = compiler.decompileObject(compileTokens.call(compiler, tokens, true));
            console.log("decompiled:", decompiled);

            var tokens2 = getTokens.call(compiler, decompiled);
            console.log("   tokens2:", tokens2.join(' '));
            var recompiled = compiler.decompileObject(compileTokens.call(compiler, tokens2, true));
            console.log("recompiled:", recompiled);

            var tokens3 = getTokens.call(compiler, recompiled);
            var decompiled2 = compiler.decompileObject(compileTokens.call(compiler, tokens3, true));
            console.log("decompiled(2):", decompiled2);

            var f = compiler.compileToFunction(eq, vars);
            values.forEach(function (value) {
                vars['v'] = value;
                console.log("f(v=" + value + ")\t= " + f.call(compiler, value));
            });
        });
    }




    weavecore.Compiler = Compiler;
}(this));

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    // constructor
    /**
     * Utility Class to create Dynamic state objects with three properties: objectName, className, sessionState
     * @class DynamicState
     */
    function DynamicState() {
        throw "DynamicState cannot be instantiated.";
    }

    // Static Public Const Properties
    /**
     * The name of the property containing the name assigned to the object when the session state is generated.
     * @static
     * @public
     * @property OBJECT_NAME
     * @readOnly
     * @default "objectName"
     * @type String
     */
    Object.defineProperty(DynamicState, 'OBJECT_NAME', {
        value: "objectName"
    });

    /**
     * The name of the property containing the qualified class name of the original object providing the session state.
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @default "className"
     * @type String
     */
    Object.defineProperty(DynamicState, 'CLASS_NAME', {
        value: "className"
    });

    /**
     * The name of the property containing the session state for an object of the type specified by className.
     * @static
     * @public
     * @property SESSION_STATE
     * @readOnly
     * @default "sessionState"
     * @type String
     */
    Object.defineProperty(DynamicState, 'SESSION_STATE', {
        value: "sessionState"
    });

    /**
     * The name of the property used to make isDynamicState() return false in order to bypass special diff logic for dynamic state arrays.
     * @static
     * @public
     * @property BYPASS_DIFF
     * @readOnly
     * @default "bypassDiff"
     * @type String
     */
    Object.defineProperty(DynamicState, 'BYPASS_DIFF', {
        value: "bypassDiff"
    });

    //static Public Methods
    /**
     * Creates an Object having three properties: objectName, className, sessionState
     * @method create
     * @static
     * @param {String} objectName The name assigned to the object when the session state is generated.
     * @param {String} className The qualified class name of the original object providing the session state.
     * @param {Object} sessionState The session state for an object of the type specified by className.
     */
    DynamicState.create = function (objectName, className, sessionState) {
        var obj = {};
        // convert empty strings ("") to null
        obj[DynamicState.OBJECT_NAME] = objectName || null;
        obj[DynamicState.CLASS_NAME] = className || null;
        obj[DynamicState.SESSION_STATE] = sessionState;
        return obj;
    };

    /**
     * This function can be used to detect dynamic state objects within nested, untyped session state objects.
     * This function will check if the given object has the three properties of a dynamic state object.
     * @method isDynamicState
     * @static
     * @param {Object} object An object to check.
     * @return {Boolean} true if the object has all three properties and no extras.
     */
    DynamicState.isDynamicState = function (object, handleBypassDiff) {
        handleBypassDiff = (handleBypassDiff === undefined ? false : handleBypassDiff);
        var matchCount = 0;
        for (var name in object) {
            if (name === DynamicState.OBJECT_NAME || name === DynamicState.CLASS_NAME || name === DynamicState.SESSION_STATE)
                matchCount++;
            else if (handleBypassDiff && name === DynamicState.BYPASS_DIFF)
                continue;
            else
                return false;
        }
        return (matchCount == 3); // must match all three properties with no extras
    };

    /**
     * This function checks whether or not a session state is an Array containing at least one
     * object that looks like a DynamicState and has no other non-String items.
     * @method isDynamicStateArray
     * @static
     * @param {Object} state
     * @return {Boolean} A value of true if the Array looks like a dynamic session state or diff.
     */
    DynamicState.isDynamicStateArray = function (state, handleBypassDiff) {
        handleBypassDiff = (handleBypassDiff === undefined ? false : handleBypassDiff);
        if (!Array.isArray(state))
            return false;
        var result = false;
        for (var i = 0; i < state.length; i++) {
            var item = state[i];
            if (typeof item == 'string' || item instanceof String)
                continue; // dynamic state diffs can contain String values.
            if (DynamicState.isDynamicState(item, handleBypassDiff))
                result = true;
            else
                return false;
        }
        return result;
    };

    /**
     * Alters a session state object to bypass special diff logic for dynamic state arrays.
     * It does so by adding the "bypassDiff" property to any part for which isDynamicState(part) returns true.
     * @method alterSessionStateToBypassDiff
     * @static
     * @param {Object} state
     * @return {Boolean} A value of true if the Array looks like a dynamic session state or diff.
     */
    DynamicState.alterSessionStateToBypassDiff = function (object) {
        if (DynamicState.isDynamicState(object)) {
            object[DynamicState.BYPASS_DIFF] = true;
            object = object[DynamicState.SESSION_STATE];
        }
        // in JS String (for Name in Object ) will return index number of all characters and Length as Properties of string
        // so this flag is required
        if (Object.hasOwnProperty(object) && object.constructor.name !== 'String') {
            for (var name in object)
                DynamicState.alterSessionStateToBypassDiff(object[name]);
        }


    };

    weavecore.DynamicState = DynamicState;

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableObject, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableObject, 'CLASS_NAME', {
        value: 'ILinkableObject'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableObject, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * An object that implements this empty interface has an associated CallbackCollection and session state,
     * accessible through the global functions in the WeaveAPI Object. In order for an ILinkableObject to
     * be created dynamically at runtime, it must not require any constructor parameters.
     * @class ILinkableObject
     * @constructor
     */
    function ILinkableObject() {

    }

    weavecore.ILinkableObject = ILinkableObject;
    weavecore.ClassUtils.registerClass('weavecore.ILinkableObject', ILinkableObject);

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is an interface to a composite object with dynamic state, meaning child objects can be dynamically added or removed.
 * The session state for this type of object is defined as an Array of DynamicState objects.
 * DynamicState objects are defined as having exactly three properties: objectName, className, and sessionState.
 * @see DynamicState
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @public
     * @property NS
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableCompositeObject, 'NS', {
        value: 'weavecore'
    });

    /**
     * temporary solution to save the className for this class/prototype
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableCompositeObject, 'CLASS_NAME', {
        value: 'ILinkableCompositeObject'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ILinkableCompositeObject, 'SESSIONABLE', {
        value: true
    });


    function ILinkableCompositeObject() {
        weavecore.ILinkableObject.call(this);
    }



    ILinkableCompositeObject.prototype = new weavecore.ILinkableObject();
    ILinkableCompositeObject.prototype.constructor = ILinkableCompositeObject;

    // Prototypes
    var p = ILinkableCompositeObject.prototype;

    /**
     * This gets the session state of this composite object.
     * @return An Array of DynamicState objects which compose the session state for this object.
     * @see weave.api.core.DynamicState
     */
    p.getSessionState = function () {};

    /**
     * This sets the session state of this composite object.
     * @param newState An Array of child name Strings or DynamicState objects containing the new values and types for child ILinkableObjects.
     * @param removeMissingDynamicObjects If true, this will remove any child objects that do not appear in the session state.
     *     As a special case, a null session state will result in no change regardless of the removeMissingDynamicObjects value.
     * @see weave.api.core.DynamicState
     */
    p.setSessionState = function (newState, removeMissingDynamicObjects) {};

    weavecore.ILinkableCompositeObject = ILinkableCompositeObject;
    weavecore.ClassUtils.registerClass('weavecore.ILinkableCompositeObject', ILinkableCompositeObject);

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    "use strict";

    // Static Public Const Properties
    /**
     * The name of the property containing the name assigned to the object when the session state is generated.
     * @static
     * @public
     * @property DEFAULT_TRIGGER_COUNT
     * @readOnly
     * @default 1
     * @type number
     */
    Object.defineProperty(CallbackCollection, 'DEFAULT_TRIGGER_COUNT', {
        value: 1
    });

    /**
     * TO-DO:temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @readOnly
     * @type String
     */
    Object.defineProperty(CallbackCollection, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(CallbackCollection, 'CLASS_NAME', {
        value: 'CallbackCollection'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(CallbackCollection, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This class manages a list of callback functions.
     * If specified, the preCallback function will be called immediately before running each
     * callback using the parameters passed to _runCallbacksImmediately(). This means if there
     * are five callbacks added, preCallback() gets called five times whenever
     * _runCallbacksImmediately() is called.  An example usage of this is to make sure a relevant
     * variable is set to the appropriate value while each callback is running.  The preCallback
     * function will not be called before grouped callbacks.
     * @class CallbackCollection
     * @param {Function} preCallback An optional function to call before each immediate callback.
     * @constructor
     */

    function CallbackCollection(preCallback) {

        weavecore.ILinkableObject.call(this);

        //private properties:

        /**
         * for debugging only... will be set when debug==true
         * @private
         * @property _linkableObject
         * @type ILinkableObject
         **/
        this._linkableObject;

        /**
         * for debugging only... will be set when debug==true
         * @private
         * @property _lastTriggerStackTrace
         * @type string
         **/
        this._lastTriggerStackTrace; //
        /**
         * @private
         * @property _oldEntries
         * @type Array
         **/
        this._oldEntries;

        /**
         * This is a list of CallbackEntry objects in the order they were created.
         * @private
         * @property _callbackEntries
         * @type Array
         **/
        this._callbackEntries = [];

        /**
         * This is the function that gets called immediately before every callback.
         * @protected
         * @property _precallback
         * @type function
         **/
        this._preCallback = preCallback;

        /**
         * If this is true, it means triggerCallbacks() has been called while delayed was true.
         * @private
         * @property _runCallbacksIsPending
         * @defaut false
         * @type boolean
         **/
        this._runCallbacksIsPending = false;

        /**
         * This is the number of times delayCallbacks() has been called without a matching call to resumeCallbacks().
         * While this is greater than zero, effects of triggerCallbacks() will be delayed.
         * @private
         * @property _delayCount
         * @type number
         * @default 0
         **/
        this._delayCount = 0;

        /**
         * This value keeps track of how many times callbacks were triggered, and is returned by the public triggerCounter accessor function.
         * The value starts at 1 to simplify code that compares the counter to a previous value.
         * This allows the previous value to be set to zero so change will be detected the first time the counter is compared.
         * This fixes potential bugs where the base case of zero is not considered.
         * @private
         * @property _runCallbacksIsPending
         * @type boolean
         **/
        this._triggerCounter = CallbackCollection.DEFAULT_TRIGGER_COUNT;

        /**
         * A list of CallbackEntry objects for when dispose() is called.
         * @private
         * @property _disposeCallbackEntries
         * @type Array
         */
        this._disposeCallbackEntries = [];
        /**
         * This value is used internally to remember if dispose() was called.
         * @private
         * @property _wasDisposed
         * @type Boolean
         * @default false
         */
        this._wasDisposed = false;

        /**
         * This flag is used in _runCallbacksImmediately() to detect when a recursive call has completed running all the callbacks.
         * @private
         * @property _runCallbacksCompleted
         * @type Boolean
         */
        this._runCallbacksCompleted;

        // public properties:
        // readonly Properties

        /**
         * This counter gets incremented at the time that callbacks are triggered and before they are actually called.
         * It is necessary in some situations to check this counter to determine if cached data should be used.
         * @public
         * @property triggerCounter
         * @readOnly
         * @type Number
         */
        Object.defineProperty(this, 'triggerCounter', {
            get: function () {
                return this._triggerCounter;
            }
        });

        /**
         * While this is true, it means the delay count is greater than zero and the effects of
         * triggerCallbacks() are delayed until resumeCallbacks() is called to reduce the delay count.
         * @public
         * @property callbacksAreDelayed
         * @readOnly
         * @type Boolean
         */
        Object.defineProperty(this, 'callbacksAreDelayed', {
            get: function () {
                return this._delayCount > 0;
            }
        });

        /**
         * This flag becomes true after dispose() is called.
         * @public
         * @property wasDisposed
         * @readOnly
         * @type Boolean
         */
        Object.defineProperty(this, 'wasDisposed', {
            get: function () {
                return this._wasDisposed;
            }
        });

    }

    CallbackCollection.prototype = new weavecore.ILinkableObject();
    CallbackCollection.prototype.constructor = CallbackCollection;

    // Prototypes
    var p = CallbackCollection.prototype;
    // public methods:
    /**
     * This adds the given function as a callback.  The function must not require any parameters.
     * The callback function will not be called recursively as a result of it triggering callbacks recursively.
     * @method addImmediateCallback
     * @param {Object} relevantContext If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param {Function} callback The function to call when callbacks are triggered.
     * @param {Boolean} runCallbackNow If this is set to true, the callback will be run immediately after it is added.
     * @param {Boolean} alwaysCallLast If this is set to true, the callback will be always be called after any callbacks that were added with alwaysCallLast=false.  Use this to establish the desired child-to-parent triggering order.
     */
    p.addImmediateCallback = function (contextObj, callback, runCallbackNow, alwaysCallLast) {
        if (callback === null || callback === undefined)
            return;

        // set default value for parameters
        if (runCallbackNow === null || runCallbackNow === undefined)
            runCallbackNow = false;

        if (alwaysCallLast === null || alwaysCallLast === undefined)
            alwaysCallLast = false;

        // remove the callback if it was previously added
        this.removeCallback(callback);

        var entry = new CallbackEntry(contextObj, callback);
        if (alwaysCallLast) // this will run the callback in second round of callback entries
            entry.schedule = 1; //mostly parent.triggercallback are called last.
        this._callbackEntries.push(entry);

        if (runCallbackNow) {
            // increase the recursion count while the function is running
            entry.recursionCount++;
            callback.call(this);
            entry.recursionCount--;
        }
    };

    /**
     * This will trigger every callback function to be called with their saved arguments.
     * If the delay count is greater than zero, the callbacks will not be called immediately.
     * @method triggerCallbacks
     */
    p.triggerCallbacks = function () {

        if (CallbackCollection.debug) {
            if (arguments)
                console.log("triggerCallbacks", arguments);
            else
                console.log("triggerCallbacks", this);

            this._lastTriggerStackTrace = new Error(CallbackCollection.STACK_TRACE_TRIGGER).stack;
        }

        if (this._delayCount > 0) {
            // we still want to increase the counter even if callbacks are delayed
            this._triggerCounter++;
            if (CallbackCollection.debug) console.log("triggerCallbacks: _runCallbacksIsPending ->true", this._delayCount, this._triggerCounter);
            this._runCallbacksIsPending = true;
            return;
        }
        this._runCallbacksImmediately.call(this);
    };


    /**
     * This function runs callbacks immediately, ignoring any delays.
     * The preCallback function will be called with the specified preCallbackParams arguments.
     * @method _runCallbacksImmediately
     * @param preCallbackParams The arguments to pass to the preCallback function given in the constructor.
     * @protected
     * @final
     */
    p._runCallbacksImmediately = function () {
        if (CallbackCollection.debug) {
            if (arguments.length > 1) console.log("_runCallbacksImmediately: ", arguments);
        }
        var preCallbackParams = arguments;
        //increase the counter immediately
        this._triggerCounter++;
        this._runCallbacksIsPending = false;

        // This flag is set to false before running the callbacks.  When it becomes true, the loop exits.
        this._runCallbacksCompleted = false;

        for (var schedule = 0; schedule < 2; schedule++) {
            // run the callbacks in the order they were added
            for (var i = 0; i < this._callbackEntries.length; i++) {
                // If this flag is set to true, it means a recursive call has finished running callbacks.
                // If _preCallback is specified, we don't want to exit the loop because that cause a loss of information.
                if (this._runCallbacksCompleted && (this._preCallback === undefined || this._preCallback === null))
                    break;

                var entry = this._callbackEntries[i];

                // if we haven't reached the matching schedule yet, skip this callback
                if (entry.schedule != schedule)
                    continue;
                // Remove the entry if the context was disposed by SessionManager.
                var shouldRemoveEntry;
                if (entry.callback === null || entry.callback === undefined)
                    shouldRemoveEntry = true;
                else if (entry.context instanceof CallbackCollection) // special case
                    shouldRemoveEntry = entry.context.wasDisposed;
                else
                    shouldRemoveEntry = WeaveAPI.SessionManager.objectWasDisposed(entry.context);
                if (shouldRemoveEntry) {
                    if (CallbackCollection.debug) {
                        if (arguments.length > 1) console.log("Entry is disposed");
                    }
                    entry.dispose();
                    // remove the empty callback reference from the list
                    var removed = this._callbackEntries.splice(i--, 1); // decrease i because remaining entries have shifted
                    if (CallbackCollection.debug)
                        this._oldEntries = this._oldEntries ? this._oldEntries.concat(removed) : removed;
                    continue;
                }
                // if _preCallback is specified, we don't want to limit recursion because that would cause a loss of information.
                if (entry.recursionCount === 0 || (this._preCallback !== undefined && this._preCallback !== null)) {
                    entry.recursionCount++; // increase count to signal that we are currently running this callback.
                    if (this._preCallback !== undefined && this._preCallback !== null)
                        this._preCallback.apply(this, preCallbackParams);
                    if (CallbackCollection.debug) {
                        if (arguments.length > 1) console.log(["callback executed"]);
                    }
                    entry.callback.call();

                    entry.recursionCount--; // decrease count because the callback finished.
                }
            }
        }
        // This flag is now set to true in case this function was called recursively.  This causes the outer call to exit its loop.
        this._runCallbacksCompleted = true;
    };

    /**
     * This function will remove a callback that was previously added.
     * @method removeCallback
     * @param {Function} callback The function to remove from the list of callbacks.
     */
    p.removeCallback = function (callback) {
        // if the callback was added as a grouped callback, we need to remove the trigger function
        GroupedCallbackEntry.removeGroupedCallback(this, callback);
        // find the matching CallbackEntry, if any
        for (var outerLoop = 0; outerLoop < 2; outerLoop++) {
            var entries = outerLoop === 0 ? this._callbackEntries : this._disposeCallbackEntries;
            for (var index = 0; index < entries.length; index++) {
                var entry = entries[index];
                if (entry !== null && entry !== undefined && callback === entry.callback) {
                    // Remove the callback by setting the function pointer to null.
                    // This is done instead of removing the entry because we may be looping over the _callbackEntries Array right now.
                    entry.dispose();
                }
            }
        }
    };



    /**
     * This will increase the delay count by 1.  To decrease the delay count, use resumeCallbacks().
     * As long as the delay count is greater than zero, effects of triggerCallbacks() will be delayed.
     * @method delayCallbacks
     */
    p.delayCallbacks = function () {
        this._delayCount++;
    };

    /**
     * This will decrease the delay count by one if it is greater than zero.
     * If triggerCallbacks() was called while the delay count was greater than zero, immediate callbacks will be called now.
     * @method resumeCallbacks
     */
    p.resumeCallbacks = function () {
        if (this._delayCount > 0)
            this._delayCount--;

        if (this._delayCount === 0 && this._runCallbacksIsPending)
            this.triggerCallbacks("resume Callbacks");
    };

    /**
     * This will add a callback that will only be called once, when this callback collection is disposed.
     * @method addDisposeCallback
     * @param {Object} relevantContext If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param callback {Function} The function to call when this callback collection is disposed.
     */
    p.addDisposeCallback = function (relevantContext, callback) {
        // don't do anything if the dispose callback was already added
        for (var i = 0; i < this._disposeCallbackEntries.length; i++) {
            var entry = this._disposeCallbackEntries[i];
            if (entry.callback === callback)
                return;
        }


        this._disposeCallbackEntries.push(new CallbackEntry(relevantContext, callback));
    };


    /**
     * This function will be called automatically when the object is no longer needed, and should not be called directly.
     * Use disposeObject() instead so parent-child relationships get cleaned up automatically.
     * @method dispose
     */
    p.dispose = function () {
        // remove all callbacks
        if (CallbackCollection.debug)
            this._oldEntries = this._oldEntries ? this._oldEntries.concat(this._callbackEntries) : this._callbackEntries.concat();

        this._callbackEntries.length = 0;
        this._wasDisposed = true;

        // run & remove dispose callbacks
        while (this._disposeCallbackEntries.length) {
            var entry = this._disposeCallbackEntries.shift();
            if (entry.callback !== null && entry.callback !== undefined && !WeaveAPI.SessionManager.objectWasDisposed(entry.context)) {
                entry.callback();
            }
        }
    };



    /**
     * Adds a callback that will only be called during a scheduled time each frame.  Grouped callbacks use a central trigger list,
     * meaning that if multiple ICallbackCollections trigger the same grouped callback before the scheduled time, it will behave as
     * if it were only triggered once.  For this reason, grouped callback functions cannot have any parameters.  Adding a grouped
     * callback to a ICallbackCollection will undo any previous effects of addImmediateCallback() or addDisposeCallback() made to the
     * same ICallbackCollection.  The callback function will not be called recursively as a result of it triggering callbacks recursively.
     * @method addGroupedCallback
     * @param relevantContext {Object} If this is not null, then the callback will be removed when the relevantContext object is disposed via SessionManager.dispose().  This parameter is typically a 'this' pointer.
     * @param groupedCallback {Function} The callback function that will only be allowed to run during a scheduled time each frame.  It must not require any parameters.
     * @param triggerCallbackNow {Boolean} If this is set to true, the callback will be triggered to run during the scheduled time after it is added.
     */
    p.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow) {
        //set default value for parameters
        if (triggerCallbackNow === null || triggerCallbackNow === undefined)
            triggerCallbackNow = false;
        GroupedCallbackEntry.addGroupedCallback(this, relevantContext, groupedCallback, triggerCallbackNow);
    };



    weavecore.CallbackCollection = CallbackCollection;
    weavecore.ClassUtils.registerClass('weavecore.CallbackCollection', CallbackCollection);


    // constructor:
    /**
     * Internal Class used in {{#crossLink "CallbackCollection"}}{{/crossLink}}
     * @class CallbackEntry
     * @for CallbackCollection
     * @param {Object} context
     * @param {Function} callback
     * @constructor
     */
    function CallbackEntry(context, callback) {
        /**
         * This is the context in which the callback function is relevant.
         * When the context is disposed, the callback should not be called anymore.
         * @public
         * @property context
         * @type Object
         */
        this.context = context;
        /**
         * This is the callback function.
         * @public
         * @property callback
         * @type Function
         */
        this.callback = callback;
        /**
         * This is the current recursion depth.
         * If this is greater than zero, it means the function is currently running.
         * @public
         * @property recursionCount
         * @type number
         */
        this.recursionCount = 0;
        /**
         * This is 0 if the callback was added with alwaysCallLast=false, or 1 for alwaysCallLast=true
         * @public
         * @property schedule
         * @type number
         */
        this.schedule = 0;

        /**
         * This is a stack trace from when the callback was added.
         * @public
         * @property addCallback_stackTrace
         * @type string
         */
        this.addCallback_stackTrace;
        /**
         * This is a stack trace from when the callback was removed.
         * @public
         * @property removeCallback_stackTrace
         * @type string
         */
        this.removeCallback_stackTrace;

        if (CallbackCollection.debug)
            this.addCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_ADD).stack;
    }

    //Static Properties:
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_TRIGGER
     * @readOnly
     * @default "This is the stack trace from when the callbacks were last triggered."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_TRIGGER', {
        value: "This is the stack trace from when the callbacks were last triggered."
    });
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_ADD
     * @readOnly
     * @default "This is the stack trace from when the callback was added."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_ADD', {
        value: "This is the stack trace from when the callback was added."
    });
    /**
     * Internal Static const properties for Debugging
     * @private
     * @static
     * @property STACK_TRACE_REMOVE
     * @readOnly
     * @default "This is the stack trace from when the callback was removed."
     * @type string
     */
    Object.defineProperty(CallbackEntry, 'STACK_TRACE_REMOVE', {
        value: "This is the stack trace from when the callback was removed."
    });

    /**
     * Call this when the callback entry is no longer needed.
     * @method dispose
     */
    CallbackEntry.prototype.dispose = function () {
        if (CallbackCollection.debug && this.callback !== null && this.callback !== undefined)
            this.removeCallback_stackTrace = new Error(CallbackEntry.STACK_TRACE_REMOVE).stack;

        this.context = null;
        this.callback = null;
    };

    weavecore.CallbackEntry = CallbackEntry;


    // constructor:
    /**
     * Internal Class used in {{#crossLink "CallbackCollection"}}{{/crossLink}}
     * @class GroupedCallbackEntry
     * @extends CallbackEntry
     * @for CallbackCollection
     * @param {Function} groupedCallback
     * @constructor
     */
    function GroupedCallbackEntry(groupedCallback) {

        CallbackEntry.call(this, [], groupedCallback);
        /**
         * If true, the callback was triggered this frame.
         * @public
         * @property triggered
         * @type Boolean
         * @default false
         */
        this.triggered = false;

        /**
         * If true, the callback was triggered again from another grouped callback.
         * @public
         * @property triggeredAgain
         * @type Boolean
         * @default false
         */
        this.triggeredAgain = false;


        if (!GroupedCallbackEntry._initialized) {
            WeaveAPI.StageUtils.addEventCallback("tick", null, GroupedCallbackEntry._handleGroupedCallbacks.bind(this));
            GroupedCallbackEntry._initialized = true;
        }
    }

    //Static Properties:
    /**
     * True while handling grouped callbacks.
     * @private
     * @static
     * @property _handlingGroupedCallbacks
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._handlingGroupedCallbacks = false;

    /**
     * True while handling grouped callbacks called recursively from other grouped callbacks.
     * @private
     * @static
     * @property _handlingRecursiveGroupedCallbacks
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = false;

    /**
     * This gets set to true when the static _handleGroupedCallbacks() callback has been added as a frame listener.
     * @private
     * @static
     * @property _initialized
     * @default false
     * @type Boolean
     */
    GroupedCallbackEntry._initialized = false;

    /**
     * This maps a groupedCallback function to its corresponding GroupedCallbackEntry.
     * @private
     * @static
     * @readOnly
     * @property _entryLookup
     * @type Map
     */
    Object.defineProperty(GroupedCallbackEntry, '_entryLookup', {
        value: new Map()
    });

    /**
     * This is a list of GroupedCallbackEntry objects in the order they were triggered.
     * @private
     * @static
     * @readOnly
     * @property _triggeredEntries
     * @type Array
     */
    Object.defineProperty(GroupedCallbackEntry, '_triggeredEntries', {
        value: []
    });

    //Static Methods:

    /**
     * @method addGroupedCallback
     * @static
     * @param {CallbackCollection} callbackCollection
     * @param {Object} relevantContext
     * @param {Function} groupedCallback
     * @param {Boolean} triggerCallbackNow
     */
    GroupedCallbackEntry.addGroupedCallback = function (callbackCollection, relevantContext, groupedCallback, triggerCallbackNow) {
        // get (or create) the shared entry for the groupedCallback
        var entry = GroupedCallbackEntry._entryLookup.get(groupedCallback);
        if (!entry) {
            entry = new GroupedCallbackEntry(groupedCallback);
            GroupedCallbackEntry._entryLookup.set(groupedCallback, entry);
        }

        // context shouldn't be null because we use it to determine when to clean up the GroupedCallbackEntry.
        if (relevantContext === null || relevantContext === undefined)
            relevantContext = callbackCollection;

        // add this context to the list of relevant contexts
        entry.context.push(relevantContext);


        // make sure the actual function is not already added as a callback.
        callbackCollection.removeCallback(groupedCallback);

        // add the trigger function as a callback
        // The relevantContext parameter is set to null for entry.trigger so the same callback can be added multiple times to the same
        // target using different contexts without having the side effect of losing the callback when one of those contexts is disposed.
        // The entry.trigger function will be removed once all contexts are disposed.
        callbackCollection.addImmediateCallback(null, entry.trigger.bind(entry), triggerCallbackNow);
    };

    /**
     * @method removeGroupedCallback
     * @static
     * @param {CallbackCollection} callbackCollection
     * @param {Function} groupedCallback
     */
    GroupedCallbackEntry.removeGroupedCallback = function (callbackCollection, groupedCallback) {
        // remove the trigger function as a callback
        var entry = GroupedCallbackEntry._entryLookup.get(groupedCallback);
        if (entry)
            callbackCollection.removeCallback(entry.trigger);
    };

    /**
     * This function gets called once per frame and allows grouped callbacks to run.
     * @method _handleGroupedCallbacks
     * @static
     * @private
     */
    GroupedCallbackEntry._handleGroupedCallbacks = function () {
        var i;
        var entry;

        GroupedCallbackEntry._handlingGroupedCallbacks = true; {
            // Handle grouped callbacks in the order they were triggered,
            // anticipating that more may be added to the end of the list in the process.
            // This first pass does not allow grouped callbacks to call each other immediately.
            for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
                entry = GroupedCallbackEntry._triggeredEntries[i];
                entry.handleGroupedCallback();
            }

            // after all grouped callbacks have been handled once, run those which were triggered recursively and allow them to call other grouped callbacks immediately.
            GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = true; {
                // handle grouped callbacks that were triggered recursively
                for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
                    entry = GroupedCallbackEntry._triggeredEntries[i];
                    if (entry.triggeredAgain)
                        entry.handleGroupedCallback();
                }
            }
            GroupedCallbackEntry._handlingRecursiveGroupedCallbacks = false;
        }
        GroupedCallbackEntry._handlingGroupedCallbacks = false;

        // reset for next frame
        for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++) {
            entry = GroupedCallbackEntry._triggeredEntries[i];
            entry.triggered = entry.triggeredAgain = false;
        }
        GroupedCallbackEntry._triggeredEntries.length = 0;

    };

    GroupedCallbackEntry.prototype = new CallbackEntry();
    GroupedCallbackEntry.prototype.constructor = GroupedCallbackEntry;

    var gcP = GroupedCallbackEntry.prototype;

    /**
     * Marks the entry to be handled later (unless already triggered this frame).
     * This also takes care of preventing recursion.
     * @method trigger
     */
    gcP.trigger = function () {
        // if handling recursive callbacks, call now
        if (GroupedCallbackEntry._handlingRecursiveGroupedCallbacks) {
            this.handleGroupedCallback();
        } else if (!this.triggered) {
            // not previously triggered
            GroupedCallbackEntry._triggeredEntries.push(this);
            this.triggered = true;
        } else if (GroupedCallbackEntry._handlingGroupedCallbacks) {
            // triggered recursively - call later
            this.triggeredAgain = true;
        }
    };


    /**
     * Checks the context(s) before calling groupedCallback
     * @method handleGroupedCallback
     */
    gcP.handleGroupedCallback = function () {
        if (!this.context)
            return;

        // first, make sure there is at least one relevant context for this callback.
        var allContexts = this.context;
        // remove the contexts that have been disposed.
        for (var i = 0; i < allContexts.length; i++)
            if (WeaveAPI.SessionManager.objectWasDisposed(allContexts[i]))
                allContexts.splice(i--, 1);
            // if there are no more relevant contexts for this callback, don't run it.
        if (allContexts.length === 0) {
            this.dispose();
            GroupedCallbackEntry._entryLookup.delete(this.callback);
            return;
        }

        // avoid immediate recursion
        if (this.recursionCount === 0) {
            this.recursionCount++;
            this.callback.apply();
            this.recursionCount--;
        }
        // avoid delayed recursion
        this.triggeredAgain = false;
    };

    weavecore.GroupedCallbackEntry = GroupedCallbackEntry;

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * Facilitates the creation of dynamic trees.
 */
(function () {


    WeaveTreeItem.createItems = function (WeaveTreeItem_implementation, items) {
        var n = 0;
        while (n !== items.length) {
            n = items.length;
            items = [].concat.apply(null, items);
        }

        return items.map(WeaveTreeItem._mapItems, WeaveTreeItem_implementation).filter(WeaveTreeItem._filterItemsRemoveNullsAndUndefined);

    }

    WeaveTreeItem._mapItems = function (item, i, a) {
        if (item.constructor === Function) // to identify its a class object
            return new item();
        if (item.constructor === String || ((item !== null || item !== undefined) && item.constructor === Object)) {
            var ItemClass = this || WeaveTreeItem;
            return new ItemClass(item);
        }
        return item;

    }

    WeaveTreeItem._filterItemsRemoveNullsAndUndefined = function (item, i, a) {

        return item !== null && item !== undefined;

    }

    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

    /**
     * Constructs a new WeaveTreeItem.
     * @param params An Object containing property values to set on the WeaveTreeItem.
     *               If params is a String, both <code>label</code> and <code>data</code> will be set to that String.
     */

    function WeaveTreeItem(params) {
        //set default values
        if (params === undefined) params = null;
        /**
         * Set this to change the constructor used for initializing child items.
         * This variable is intentionally uninitialized to avoid overwriting the value set by an extending class in its constructor.
         */
        this.childItemClass; // IMPORTANT - no initial value
        this._recursion = {}; // recursionName -> Boolean
        this._label = "";
        this._children = null;
        this._dependency = null;
        /**
         * Cached values that get invalidated when the source triggers callbacks.
         */
        this._cache = {};

        /**
         * Cached values of getCallbackCollection(source).triggerCounter.
         */
        this._counter = {};


        //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

        /**
         * This can be set to either a String or a Function.
         * This property is checked by Flex's default data descriptor.
         * If this property is not set, the <code>data</code> property will be used as the label.
         */
        Object.defineProperty(this, 'label', {
            get: function () {
                const id = 'label';
                if (this.isCached(id))
                    return this._cache[id];

                var str = this.getString(this._label, id);
                if (!str && this.data !== null && this.data !== undefined)
                    str = String(this.data);
                return this.cache(id, str);
            },
            set: function (value) {
                this._counter['label'] = undefined;
                this._label = value;
            },
            configurable: true
        });




        Object.defineProperty(this, 'children', {
            /**
             * Gets a filtered copy of the child menu items.
             * When this property is accessed, refresh() will be called except if refresh() is already being called.
             * This property is checked by Flex's default data descriptor.
             */
            get: function () {
                const id = 'children';

                var items;
                if (this.isCached(id))
                    items = this._cache[id];
                else
                    items = this.getObject(this._children, id);
                if (items) {
                    // overwrite original array to support filling it asynchronously
                    var iOut = 0;
                    for (var i = 0; i < items.length; i++) {
                        var item = WeaveTreeItem._mapItems.call(this.childItemClass, items[i], i, items);
                        if (item != null)
                            items[iOut++] = item;
                    }
                }

                return this.cache(id, items);
            },
            /**
             * This can be set to either an Array or a Function that returns an Array.
             * The function can be like function():void or function(item:WeaveTreeItem):void.
             * The Array can contain either WeaveTreeItems or Objects, each of which will be passed to the WeaveTreeItem constructor.
             */
            set: function (value) {
                this._counter['children'] = undefined;
                this._children = value;
            }
        });


        /**
         * A pointer to the ILinkableObject that created this node.
         * This is used to determine when to invalidate cached values.
         */
        Object.defineProperty(this, 'dependency', {
            get: function () {
                if (this._dependency && WeaveAPI.SessionManager.objectWasDisposed(this._dependency)) {
                    this.dependency = null;
                }
                return this._dependency;
            },
            set: function (value) {
                if (this._dependency != value)
                    this._counter = {};
                this._dependency = value;
            }
        });

        /**
         * This can be any data associated with this tree item.
         */
        this.data = null;

        if (typeof (params) === 'string') {
            this.label = params;
            this.data = params;
        } else
            for (var key in params)
                this[key] = params[key];
    }






    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----
    var p = WeaveTreeItem.prototype;
    /**
     * Computes a Boolean value from various structures
     * @param param Either a Boolean, and Object like {not: param}, a Function, an ILinkableVariable, or an Array of those objects.
     * @param recursionName A name used to keep track of recursion.
     * @return A Boolean value derived from the param, or the param itself if called recursively.
     */
    p.getBoolean = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (this.isSimpleObject(param, 'not'))
                    param = !this.getBoolean(param['not'], "not_" + recursionName);
                if (this.isSimpleObject(param, 'or'))
                    param = this.getBoolean(param['or'], "or_" + recursionName);
                if (typeof (param) === "function")
                    param = this.evalFunction(param);
                if (param instanceof weavecore.LinkableVariable)
                    param = param.getSessionState();
                if (param instanceof Array) {
                    var breakValue = recursionName.indexOf("or_") === 0;
                    for (var param in param) {
                        param = this.getBoolean(param, "item_" + recursionName);
                        if (param ? breakValue : !breakValue)
                            break;
                    }
                }
                param = param ? true : false;
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * Checks if an object has a single specified property.
     */
    p.isSimpleObject = function (object, singlePropertyName) {


        var found = false;
        for (var key in object) {
            if (found)
                return false; // two or more properties

            if (key !== singlePropertyName)
                return false; // not the desired property

            found = true; // found the desired property
        }
        return found;
    };

    /**
     * Gets a String value from a String or Function.
     * @param param Either a String or a Function.
     * @param recursionName A name used to keep track of recursion.
     * @return A String value derived from the param, or the param itself if called recursively.
     */
    p.getString = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (typeof (param) === "function")
                    param = this.evalFunction(param);
                else
                    param = param || '';
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * Evaluates a function to get an Object or just returns the non-Function Object passed in.
     * @param param Either an Object or a Function.
     * @param recursionName A name used to keep track of recursion.
     * @return An Object derived from the param, or the param itself if called recursively.
     */
    p.getObject = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (typeof (param) === "function")
                    param = this.evalFunction.call(this, param);
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * First tries calling a function with no parameters.
     * If an ArgumentError is thrown, the function will called again, passing this WeaveTreeItem as the first parameter.
     */
    p.evalFunction = function (func) {
        try {
            try {
                // first try calling the function with no parameters
                return func();
            } catch (e) {
                //To-Docreate Argument error object
                // and on each function if the argument is required, and if not passed throw that Argument error object
                // console.log(e);
                /*if (!(e is ArgumentError))
				{
					if (e is Error)
						trace((e as Error).getStackTrace());
					throw e;
				}*/
            }

            // on ArgumentError, pass in this WeaveTreeItem as the first parameter
            //console.log('executing after ArgumentError');
            return func(this);

        } catch (e) {
            console.error(e);
        }

    };

    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

    /**
     * Checks if cached value is valid.
     * Always returns false if the source property is not set.
     * @param id A string identifying a property.
     * @return true if the property value has been cached.
     */
    p.isCached = function (id) {
        if (this._dependency && WeaveAPI.SessionManager.objectWasDisposed(this._dependency))
            source = null;
        return this._dependency && this._counter[id] === WeaveAPI.SessionManager.getCallbackCollection(this._dependency).triggerCounter;
    };

    /**
     * Retrieves or updates a cached value for a property.
     * Does not cache the value if the source property is not set.
     * @param id A string identifying a property.
     * @param newValue Optional new value to cache for the property.
     * @return The new or existing value for the property.
     */
    p.cache = function (id, newValue) {
        if (arguments.length === 1)
            return this._cache[id];

        if (this._source && WeaveAPI.SessionManager.objectWasDisposed(this._source))
            source = null;
        if (this._source) {
            this._counter[id] = WeaveAPI.SessionManager.getCallbackCollection(this._source).triggerCounter;
            this._cache[id] = newValue;
        }
        return newValue;
    };






    weavecore.WeaveTreeItem = WeaveTreeItem;

}());

/*
    Weave (Web-based Analysis and Visualization Environment)
    Copyright (C) 2008-2011 University of Massachusetts Lowell

    This file is a part of Weave.

    Weave is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License, Version 3,
    as published by the Free Software Foundation.

    Weave is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a wrapper for a 2-dimensional Dictionary.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {
    function Dictionary2D(weakPrimaryKeys, weakSecondaryKeys, defaultType) {
        weakPrimaryKeys = (weakPrimaryKeys === undefined) ? false : weakPrimaryKeys;
        weakSecondaryKeys = (weakSecondaryKeys === undefined) ? false : weakSecondaryKeys;

        this.dictionary = weakPrimaryKeys ? new Map() : new Map();
        this.defaultType = defaultType; // used for creating objects automatically via get()
        this.weak2 = weakSecondaryKeys // used as a constructor parameter for nested Dictionaries
    }

    var p = Dictionary2D.prototype;

    /**
     *
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @return The value in the dictionary.
     */
    p.get = function (key1, key2) {
        var value;
        var d2 = this.dictionary.get(key1);
        if (d2)
            value = d2.get(key2);
        if (value === undefined && this.defaultType) {
            value = new this.defaultType();
            this.set(key1, key2, value);
        }
        return value;
    };

    /**
     * This will add or replace an entry in the dictionary.
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @param value The value to put into the dictionary.
     */
    p.set = function (key1, key2, value) {
        var d2 = this.dictionary.get(key1);
        if (d2 === null || d2 === undefined)
            d2 = this.weak2 ? new Map() : new Map();
        this.dictionary.set(key1, d2);
        d2.set(key2, value);
    };

    /**
     * This removes all values associated with the given primary key.
     * @param key1 The first dictionary key.
     */
    p.removeAllPrimary = function (key1) {
        this.dictionary.delete(key1);
    };

    /**
     * This removes all values associated with the given secondary key.
     * @param key2 The second dictionary key.
     */
    p.removeAllSecondary = function (key2) {
        this.dictionary.forEach(function (value, key1) {
            this.dictionary.get(key1).delete(key2);

        }.bind(this));

    };

    /**
     * This removes a value associated with the given primary and secondary keys.
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @return The value that was in the dictionary.
     */
    p.remove = function (key1, key2) {
        var value;
        var d2 = this.dictionary.get(key1);
        if (d2) {
            value = d2.get(key2);
            d2.delete(key2);
        }


        for (var v2 of d2.values())
            return value;

        // otherwise, remove it
        this.dictionary.delete(key1);

        return value;
    };

    weavecore.Dictionary2D = Dictionary2D;
}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {

    /**
     * This constructor allows you to specify the three most important flash_proxy functions
     * and an optional custom flash_proxy::callProperty function.
     * @param hasProperty function hasProperty(name:*):Boolean
     * @param getProperty function getProperty(name:*):*
     * @param setProperty function setProperty(name:*, value:*):void
     * @param callProperty function callProperty(name:*, ...parameters):*
     */
    function ProxyObject(hasProperty, getProperty, setProperty, callProperty) {
        callProperty = (callProperty === undefined) ? null : callProperty;

        /*Proxy.call(this);

            this._has = handler.hasProperty;
		this._get = super.flash_proxy::getProperty as Function;
		this._set = super.flash_proxy::setProperty as Function;
		this._call = null;
			if (hasProperty !== null)
				_has = hasProperty;
			if (getProperty != null)
				_get = getProperty;
			if (setProperty != null)
				_set = setProperty;
			if (callProperty != null)
				_call = callProperty;*/
    }

    /*override flash_proxy function hasProperty(name:*):Boolean
    {
    	return _has.call(this, name);
    }

    override flash_proxy function getProperty(name:*):*
    {
    	return _get.call(this, name);
    }

    override flash_proxy function setProperty(name:*, value:*):void
    {
    	_set.call(this, name, value);
    }

    override flash_proxy function callProperty(name:*, ...parameters):*
    {
    	if (_call == null)
    		return _get.call(this, name).apply(this, parameters);

    	parameters.unshift(name);
    	return _call.apply(this, parameters);
    }*/

    weavecore.ProxyObject = ProxyObject;

}());

/**
 * @module weavecore
 */

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    "use strict";

    // constructor:
    /**
     * Session manager contains core functions related to session state.
     * @class SessionManager
     * @constructor
     */
    function SessionManager() {

        //const properties - writable default to false.
        /**
         * @private
         * @readOnly
         * @property _childToParentMap
         * @type Map
         * This maps a child ILinkableObject to a Dictionary, which maps each of its registered parent ILinkableObjects to a value of true if the child should appear in the session state automatically or false if not.
         */
        Object.defineProperty(this, "_childToParentMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _parentToChildMap
         * @type Map
         * This maps a parent ILinkableObject to a Dictionary, which maps each of its registered child ILinkableObjects to a value of true if the child should appear in the session state automatically or false if not.
         */
        Object.defineProperty(this, "_parentToChildMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _ownerToChildMap
         * @type Map
         * This maps a parent ILinkableObject to a Dictionary, which maps each child ILinkableObject it owns to a value of true.
         */
        Object.defineProperty(this, "_ownerToChildMap", {
            value: new Map()
        });

        /**
         * This maps a child ILinkableObject to its registered owner.
         * @private
         * @readOnly
         * @property _childToOwnerMap
         * @type Map
         */
        Object.defineProperty(this, "_childToOwnerMap", {
            value: new Map()
        });

        this.debug = false;

        this.linkableObjectToCallbackCollectionMap = new Map();
        this.debugBusyTasks = false;

        /**
         * @private
         * @readOnly
         * @property _disposedObjectsMap
         * @type Map
         */
        Object.defineProperty(this, "_disposedObjectsMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _treeCallbacks
         * @type CallbackCollection
         */
        Object.defineProperty(this, "_treeCallbacks", {
            value: new weavecore.CallbackCollection()
        });

        /**
         * @private
         * @readOnly
         * @property _classNameToSessionedPropertyNames
         * @type Object
         */
        Object.defineProperty(this, "_classNameToSessionedPropertyNames", {
            value: {}
        });

        /**
         * keeps track of which objects are currently being traversed
         * @private
         * @readOnly
         * @property _getSessionStateIgnoreList
         * @type Map
         */
        Object.defineProperty(this, "_getSessionStateIgnoreList", {
            value: new Map()
        });


        /**
         * @private
         * @readOnly
         * @property _dTaskStackTrace
         * @type Map
         */
        Object.defineProperty(this, "_dTaskStackTrace", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _d2dOwnerTask
         * @type weavecore.Dictionary2D
         */
        Object.defineProperty(this, "_d2dOwnerTask", {
            value: new weavecore.Dictionary2D(true, false)
        });

        /**
         * @private
         * @readOnly
         * @property _d2dTaskOwner
         * @type weavecore.Dictionary2D
         */
        Object.defineProperty(this, "_d2dTaskOwner", {
            value: new weavecore.Dictionary2D(false, true)
        });

        /**
         * ILinkableObject -> Boolean
         * @private
         * @readOnly
         * @property _dBusyTraversal
         * @type Map
         */
        Object.defineProperty(this, "_dBusyTraversal", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _aBusyTraversal
         * @type Array
         */
        Object.defineProperty(this, "_aBusyTraversal", {
            value: []
        });

        /**
         * ILinkableObject -> int
         * @private
         * @readOnly
         * @property _dUnbusyTriggerCounts
         * @type Map
         */
        Object.defineProperty(this, "_dUnbusyTriggerCounts", {
            value: new Map()
        });

        /**
         * ILinkableObject -> String
         * @private
         * @readOnly
         * @property _dUnbusyStackTraces
         * @type Map
         */
        Object.defineProperty(this, "_dUnbusyStackTraces", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _treeCache
         * @type weavecore.Dictionary2D
         */
        Object.defineProperty(this, "_treeCache", {
            value: new weavecore.Dictionary2D(true, false, weavecore.WeaveTreeItem)
        });

        /**
         * This maps destination and source ILinkableObjects to a function like:
         *     function():void { setSessionState(destination, getSessionState(source), true); }
         */
        Object.defineProperty(this, "linkFunctionCache", {
            value: new weavecore.Dictionary2D(true, true)
        });


        this._getTreeItemChildren = this._getTreeItemChildren.bind(this);

    }

    var p = SessionManager.prototype;



    /**
     * This function tells the SessionManager that the session state of the specified child should appear in the
     * session state of the specified parent, and the child should be disposed when the parent is disposed.
     *
     * There is one other requirement for the child session state to appear in the parent session state -- the child
     * must be accessible through a public variable of the parent or through an accessor function of the parent.
     *
     * This function will add callbacks to the sessioned children that cause the parent callbacks to run.
     *
     * If a callback function is given, the callback will be added to the child and cleaned up when the parent is disposed.
     *
     * @method registerLinkableChild
     * @param {Object} linkableParent A parent ILinkableObject that the child will be registered with.
     * @param {ILinkableObject} linkableChild The child ILinkableObject to register as a child.
     * @param {Function} callback A callback with no parameters that will be added to the child that will run before the parent callbacks are triggered, or during the next ENTER_FRAME event if a grouped callback is used.
     * @param {Boolean} useGroupedCallback If this is true, addGroupedCallback() will be used instead of addImmediateCallback().
     * @return {Object} The linkableChild object that was passed to the function.
     * @example usage:    const foo = registerLinkableChild(this, someLinkableNumber, handleFooChange);
     */
    p.registerLinkableChild = function (linkableParent, linkableChild, callback, useGroupedCallback) {
        //set default values for parameters
        if (useGroupedCallback === undefined)
            useGroupedCallback = false;
        if (!(linkableParent instanceof weavecore.ILinkableObject)) {
            if (!linkableParent.sessionable) {
                console.log("registerLinkableChild(): Parent does not inherit ILinkableObject. or sessionablepropery is not true");
                return;
            }
        }

        if (!(linkableChild instanceof weavecore.ILinkableObject)) {
            if (!linkableChild.sessionable) {
                console.log("registerLinkableChild(): child does not inherit ILinkableObject. or sessionablepropery is not true");
                return;
            }
        }

        if (callback !== null && callback !== undefined) {
            var cc = this.getCallbackCollection.call(this, linkableChild);
            if (useGroupedCallback)
                cc.addGroupedCallback(linkableParent, callback);
            else
                cc.addImmediateCallback(linkableParent, callback);
        }

        // if the child doesn't have an owner yet, this parent is the owner of the child
        // and the child should be disposed when the parent is disposed.
        // registerDisposableChild() also initializes the required Dictionaries.
        this.registerDisposableChild(linkableParent, linkableChild);

        if (this._childToParentMap.get(linkableChild).get(linkableParent) === undefined) {
            // remember this child-parent relationship
            this._childToParentMap.get(linkableChild).set(linkableParent, true);
            this._parentToChildMap.get(linkableParent).set(linkableChild, true);

            // make child changes trigger parent callbacks
            var parentCC = this.getCallbackCollection(linkableParent);
            // set alwaysCallLast=true for triggering parent callbacks, so parent will be triggered after all the other child callbacks
            this.getCallbackCollection(linkableChild).addImmediateCallback(linkableParent, parentCC.triggerCallbacks.bind(parentCC, "Parent's -triggerCallback"), false, true); // parent-child relationship
        }

        this._treeCallbacks.triggerCallbacks("Session Tree: Child Registered");

        return linkableChild;
    };

    /**
     * This will register a child of a parent and cause the child to be disposed when the parent is disposed.
     * Use this function when a child object can be disposed but you do not want to link the callbacks.
     * The child will be disposed when the parent is disposed.
     *
     * @method registerDisposableChild
     * @example usage:    const foo = registerDisposableChild(this, someLinkableNumber);
     *
     * @param {Object} disposableParent A parent disposable object that the child will be registered with.
     * @param {Object} disposableChild The disposable object to register as a child of the parent.
     * @return {Object} The linkableChild object that was passed to the function.
     */
    p.registerDisposableChild = function (disposableParent, disposableChild) {
        if (this._ownerToChildMap.get(disposableParent) === undefined) {
            this._ownerToChildMap.set(disposableParent, new Map());
            this._parentToChildMap.set(disposableParent, new Map());
        }
        // if this child has no owner yet...
        if (this._childToOwnerMap.get(disposableChild) === undefined) {
            // make this first parent the owner
            this._childToOwnerMap.set(disposableChild, disposableParent);
            this._ownerToChildMap.get(disposableParent).set(disposableChild, true);
            // initialize the parent dictionary for this child
            this._childToParentMap.set(disposableChild, new Map());
        }
        return disposableChild;
    };

    /**
     * Use this function with care.  This will remove child objects from the session state of a parent and
     * stop the child from triggering the parent callbacks.
     * @method unregisterLinkableChild
     * @param {ILinkableChild} parent A parent that the specified child objects were previously registered with.
     * @param {ILinkableChild} child The child object to unregister from the parent.
     */
    p.unregisterLinkableChild = function (parent, child) {
        if (this._childToParentMap.get(child))
            this._childToParentMap.get(child).delete(parent);
        if (this._parentToChildMap.get(parent))
            this._parentToChildMap.get(parent).delete(child);
        this.getCallbackCollection(child).removeCallback(this.getCallbackCollection(parent).triggerCallbacks.bind(parent));

        this._treeCallbacks.triggerCallbacks("Session Tree: Child un-Registered");
    };


    /**
     * This function will add or remove child objects from the session state of a parent.  Use this function
     * with care because the child will no longer be "sessioned."  The child objects will continue to trigger the
     * callbacks of the parent object, but they will no longer be considered a part of the parent's session state.
     * If you are not careful, this will break certain functionalities that depend on the session state of the parent.
     * @method excludeLinkableChildFromSessionState
     * @param {ILinkableChild} parent A parent that the specified child objects were previously registered with.
     * @param {ILinkableChild} child The child object to remove from the session state of the parent.
     */
    p.excludeLinkableChildFromSessionState = function (parent, child) {
        if (parent === null || child === null || parent === undefined || child === undefined) {
            console.log("SessionManager.excludeLinkableChildFromSessionState(): Parameters cannot be null.");
            return;
        }
        if (this._childToParentMap.get(child) !== undefined && this._childToParentMap.get(child).get(parent))
            this._childToParentMap.get(child).set(parent, false);
        if (this._parentToChildMap.get(parent) !== undefined && this._parentToChildMap.get(parent).get(child))
            this._parentToChildMap.get(parent).set(child, false);
    };

    /**
     * @method _getRegisteredChildren
     * @private
     * This function will return all the child objects that have been registered with a parent.
     * @param {ILinkableChild} parent A parent object to get the registered children of.
     * @return {Array} An Array containing a list of linkable objects that have been registered as children of the specified parent.
     *         This list includes all children that have been registered, even those that do not appear in the session state.
     */
    p._getRegisteredChildren = function (parent) {
        var result = [];
        if (this._parentToChildMap.get(parent) !== undefined)
            for (var child in this._parentToChildMap.get(parent))
                result.push(child);
        return result;
    };

    /**
     * This function gets the owner of a linkable object.  The owner of an object is defined as its first registered parent.
     * @method getLinkableOwner
     * @param {ILinkableObject} child An ILinkableObject that was registered as a child of another ILinkableObject.
     * @return {ILinkableObject} The owner of the child object (the first parent that was registered with the child), or null if the child has no owner.
     * See {{#crossLink "SessionManager/getLinkableDescendants:method"}}{{/crossLink}}
     */
    p.getLinkableOwner = function (child) {
        return this._childToOwnerMap.get(child);
    };

    /**
     * This function will return all the descendant objects that implement ILinkableObject.
     * If the filter parameter is specified, the results will contain only those objects that extend or implement the filter class.
     * @method getLinkableDescendants
     * @param {ILinkableObject} root A root object to get the descendants of.
     * @param {Class} filter An optional Class definition which will be used to filter the results.
     * @return {Array} An Array containing a list of descendant objects.
     * See {{#crossLink "SessionManager/getLinkableOwner:method"}}{{/crossLink}}
     */
    p.getLinkableDescendants = function (root, filter) { //TODO: Port getLinkableDescendants
        filter = (filter === undefined) ? null : filter;
        var result = [];
        if (root)
            internalGetDescendants.call(this, result, root, filter, new Map(), Number.MAX_VALUE);
        // don't include root object
        if (result.length > 0 && result[0] === root)
            result.shift();
        return result;
    };


    function internalGetDescendants(output, root, filter, ignoreList, depth) {
        if (root === null || ignoreList.get(root) !== undefined)
            return;
        ignoreList.set(root, true);
        if (filter === null || root instanceof filter)
            output.push(root);
        if (--depth <= 0)
            return;

        if (this._parentToChildMap.get(root)) {
            for (var object of this._parentToChildMap.get(root).keys()) {
                internalGetDescendants.call(this, output, object, filter, ignoreList, depth);
            }
        }

    }

    function _getPath(tree, descendant) {
        if (tree.data === descendant)
            return [];
        var children = tree.children;
        if (children) {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var path = _getPath(child, descendant);
                if (path) {
                    path.unshift(child.label);
                    console.log('Path returned:', path);
                    return path;
                }
            }
        }
        console.log('null returned');
        return null;
    }

    /**
     * Gets the path of names in the session state tree of the root object.
     * @param root The root(Ilinkableobject or sessionable) object used to generate a session state tree.
     * @param child (Ilinkableobject or sessionable) The descendant object to find in the session state tree.
     * @return {Array}The path from root to descendant, or null if the descendant does not appear in the session state.
     */
    p.getPath = function (root, descendant) {
        if (!descendant)
            return null;
        var tree = this.getSessionStateTree(root, null);
        var path = _getPath(tree, descendant);
        return path;
    }

    /**
     * This function returns a pointer to an ILinkableObject appearing in the session state.
     * @param root The root object used to find a descendant object.
     * @param path A sequence of child names used to refer to an object appearing in the session state.
     *             A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
     * @return A pointer to the object referred to by objectPath.
     * @see #getPath()
     */
    p.getObject = function (root, path) {
        var object = root;
        path.forEach(function (propertyName) {
            if (object === null || this._disposedObjectsMap.get(object))
                return null;
            if (object instanceof weavecore.LinkableHashMap) {
                if (propertyName.constructor === Number)
                    object = object.getObjects()[propertyName];
                else
                    object = object.getObject(String(propertyName));
            } else if (object instanceof weavecore.LinkableDynamicObject) {
                // ignore propertyName and always return the internalObject
                object = object.internalObject;
            } else {
                if (this.getLinkablePropertyNames(object).indexOf(propertyName) < 0)
                    return null;
                object = object[propertyName];
            }
        }.bind(this));
        return this._disposedObjectsMap.get(object) ? null : object;
    }

    /**
     * @method getSessionStateTree
     * @param {ILinkableObject} root The linkable object to be placed at the root node of the tree.
     * @param {String} objectName
     * @param {Object} objectTypeFilter
     * @return {WeaveTreeItem} A tree of nodes with the properties "label", "object", and "children"
     */
    p.getSessionStateTree = function (root, objectName) {
        var treeItem = this._treeCache.get(root, objectName);
        if (!treeItem.data) {
            treeItem.data = root;
            treeItem.label = objectName;
            treeItem.children = this._getTreeItemChildren;
            // dependency is used to determine when to recalculate children array
            treeItem.dependency = root instanceof weavecore.LinkableHashMap ? root.childListCallbacks : root;

        }
        if (objectName)
            treeItem.label = objectName;
        return treeItem;
    };

    /**
     * @method _getTreeItemChildren
     * @param {WeaveTreeItem} treeItem
     * @return {Array}
     */
    p._getTreeItemChildren = function (treeItem) {
        if (!treeItem) {
            //console.warn('Argument Warning: Need treeItem as Argument');
        }
        var object = treeItem.data;
        var children = [];
        var names = [];
        var childObject;
        var subtree;
        var ignoreList = new Map();
        if (object instanceof weavecore.LinkableHashMap) {
            names = object.getNames();
            var childObjects = object.getObjects();
            for (var i = 0; i < names.length; i++) {
                childObject = childObjects[i];
                if (this._childToParentMap.get(childObject) && this._childToParentMap.get(childObject).get(object)) {
                    if (ignoreList.get(childObject) !== undefined)
                        continue;
                    ignoreList.set(childObject, true);
                    children.push(this.getSessionStateTree(childObject, names[i]));
                }
            }
        } else {
            var deprecatedLookup = null;
            if (object instanceof weavecore.LinkableDynamicObject) {
                names = object.targetPath ? null : [null];
            } else if (Object) {
                names = this.getLinkablePropertyNames(object);
            }
            if (names) {
                for (var i = 0; i < names.length; i++) {
                    var name = names[i];
                    if (object instanceof weavecore.LinkableDynamicObject) {
                        childObject = object.internalObject;
                    }
                    if (object[name]) {
                        childObject = object[name];
                    }
                    if (!childObject) {
                        return;
                    }
                    if (this._childToParentMap.get(childObject) && this._childToParentMap.get(childObject).get(object)) {
                        if (ignoreList.get(childObject) !== undefined) {
                            return;
                        }
                        ignoreList.set(childObject, true);
                        children.push(this.getSessionStateTree(childObject, name));
                    }

                }
            }


        }
        if (children.length === 0)
            children = null;

        return children;
    };

    /**
     * Adds a grouped callback that will be triggered when the session state tree changes.
     * USE WITH CARE. The groupedCallback should not run computationally-expensive code.
     * @method addTreeCallback
     * @param {Object} relevantContext
     * @param {Function} groupedCallback
     * @param {Boolean} triggerCallbackNow
     */
    p.addTreeCallback = function (relevantContext, groupedCallback, triggerCallbackNow) {
        if (triggerCallbackNow === undefined) triggerCallbackNow = false;
        this._treeCallbacks.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow);
    };

    /**
     * @method removeTreeCallback
     * @param {Function} groupedCallback
     */
    p.removeTreeCallback = function (groupedCallback) {
        this._treeCallbacks.removeCallback(groupedCallback);
    };

    /**
     * This function will copy the session state from one sessioned object to another.
     * If the two objects are of different types, the behavior of this function is undefined.
     * @method copySessionState
     * @param {ILinkableObject} source A sessioned object to copy the session state from.
     * @param {ILinkableObject} destination A sessioned object to copy the session state to.
     * see {{#crossLink "SessionManager/getSessionState:method"}}{{/crossLink}}
     * see {{#crossLink "SessionManager/setSessionState:method"}}{{/crossLink}}
     */
    p.copySessionState = function (source, destination) {
        var sessionState = this.getSessionState(source);
        this.setSessionState(destination, sessionState, true);
    };

    /**
     * @method _applyDiff
     * @private
     * @param {Object} base
     * @param {Object} diff
     */
    p._applyDiff = function (base, diff) {
        if (base === null || base === undefined || typeof (base) !== 'object' || diff === null || diff === undefined || typeof (diff) !== 'object')
            return diff;

        for (var key in diff)
            base[key] = this._applyDiff(base[key], diff[key]);

        return base;
    };

    /**
     * Sets the session state of an ILinkableObject.
     * @method setSessionState
     * @param {ILinkableObject} linkableObject An object containing sessioned properties (sessioned objects may be nested).
     * @param {Object} newState An object containing the new values for sessioned properties in the sessioned object.
     * @param {Boolean} removeMissingDynamicObjects If true, this will remove any properties from an ILinkableCompositeObject that do not appear in the session state.
     * see {{#crossLink "SessionManager/getSessionState:method"}}{{/crossLink}}
     */
    p.setSessionState = function (linkableObject, newState, removeMissingDynamicObjects) {
        if (removeMissingDynamicObjects === undefined) removeMissingDynamicObjects = true;
        if (linkableObject === null) {
            console.log("SessionManager.setSessionState(): linkableObject cannot be null.");
            return;
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.setSessionState(): linkableObject cannot be undefined.");
            return;
        }

        // special cases: for Explicit and Composite Session Object
        if (linkableObject instanceof weavecore.LinkableVariable) {
            var lv = linkableObject;
            if (removeMissingDynamicObjects === false && newState && newState.constructor.name === 'Object') {
                lv.setSessionState.call(lv, this._applyDiff.call(this, Object.create(lv.getSessionState(lv)), newState));
            } else {
                lv.setSessionState.call(lv, newState);
            }
            return;
        }
        //linkableHashmap and linkabledynamic object is handled, In As3 version it implements ILinkableCompositeObject
        // in jS we couldnt do that, thats why linkableObject.setSessionState is used
        if (linkableObject.setSessionState) {
            if (newState.constructor.name === "String")
                newState = [newState];

            if (newState !== null && !(newState instanceof Array)) {
                var array = [];
                for (var key in newState)
                    array.push(weavecore.DynamicState.create(key, null, newState[key]));
                newState = array;
            }

            linkableObject.setSessionState(newState, removeMissingDynamicObjects);
            return;
        }

        if (newState === null || newState === undefined)
            return;

        // delay callbacks before setting session state
        var objectCC = this.getCallbackCollection(linkableObject);
        objectCC.delayCallbacks();

        // cache property names if necessary
        var className = (linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME);
        if (!this._classNameToSessionedPropertyNames[className])
            this._cacheClassInfo(linkableObject, className);

        // set session state
        var foundMissingProperty = false;
        var propertyNames;

        propertyNames = this._classNameToSessionedPropertyNames[className];

        for (var i = 0; i < propertyNames.length; i++) {
            var name = propertyNames[i];
            if (!newState.hasOwnProperty(name)) {
                if (removeMissingDynamicObjects && linkableObject.handleMissingSessionStateProperty)
                    foundMissingProperty = true;
                continue;
            }

            var property = null;
            try {
                property = linkableObject[name];
            } catch (e) {
                console.log('SessionManager.setSessionState(): Unable to get property "' + name + '" of class "' + linkableObject.constructor.name + '"', e);
            }

            if (property === null)
                continue;

            this.setSessionState(property, newState[name], removeMissingDynamicObjects);
        }

        // TODO: handle properties appearing in session state that do not appear in the linkableObject
        /*if (linkableObject instanceof ILinkableObjectWithNewProperties)
				for (name in newState)
					if (!deprecatedLookup.hasOwnProperty(name))
						linkableObject.handleMissingSessionStateProperty(newState, name);*/

        // handle properties missing from absolute session state
        if (foundMissingProperty)
            propertyNames.forEach(function (name) {
                if (!newState.hasOwnProperty(name))
                    if (linkableObject.handleMissingSessionStateProperty) {
                        linkableObject.handleMissingSessionStateProperty(newState, name);
                    } else {
                        console.log('implement handleMissingSessionStateProperty in ' + linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME);
                    }

            });

        // resume callbacks after setting session state
        objectCC.resumeCallbacks();

    };

    /**
     * Gets the session state of an ILinkableObject.
     * @method getSessionState
     * @param {IlinkableObject} linkableObject An object containing sessioned properties (sessioned objects may be nested).
     * @return {Object} An object containing the values from the sessioned properties.
     * see {{#crossLink "SessionManager/setSessionState:method"}}{{/crossLink}}
     */
    p.getSessionState = function (linkableObject) {
        if (linkableObject === null) {
            console.log("SessionManager.getSessionState(): linkableObject cannot be null.");
            return null;
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.getSessionState(): linkableObject cannot be undefined.");
            return null;
        }

        var result = null;

        // special cases (explicit session state)
        if (linkableObject instanceof weavecore.LinkableVariable) {
            // in As3, when we try to set undefined it will get ignored , where as JS its get accepted
            // we want result to be null not repalced with undefined to avoid undesire results, while generating log entries
            result = linkableObject.getSessionState();
            result = result === undefined ? null : result;
        }
        //linkableHashmap is handled, In As3 version it implements ILinkableCompositeObject
        // in jS we couldnt do that, thats why linkableObject.setSessionState is used
        else if (linkableObject instanceof weavecore.ILinkableCompositeObject || linkableObject.getSessionState) {
            // in As3, when we try to set undefined it will get ignored , where as JS its get accepted
            // we want result to be null not repalced with undefined to avoid undesire results, while generating log entries
            result = linkableObject.getSessionState();
            result = result === undefined ? null : result;
        } else if (linkableObject.sessionable) { //sessionbale variable creation is must as there is no interface concept in JS
            // implicit session state
            // first pass: get property names
            // cache property names if necessary
            //var className = linkableObject.constructor.name; // we can't use constructor.name as minified verisons have different names
            var className = linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME;

            if (!this._classNameToSessionedPropertyNames[className])
                this._cacheClassInfo(linkableObject, className);

            var propertyNames = this._classNameToSessionedPropertyNames[className];
            var resultNames = [];
            var resultProperties = [];
            var property = null;
            var i;
            for (i = 0; i < propertyNames.length; i++) {
                var name = propertyNames[i];

                try {
                    property = null; // must set this to null first because accessing the property may fail
                    property = linkableObject[name];
                } catch (e) {
                    console.log('Unable to get property "' + name + '" of class "' + linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME + '"');
                }

                // first pass: set result[name] to the ILinkableObject
                if (property !== null && !this._getSessionStateIgnoreList.get(property)) {
                    // skip this property if it should not appear in the session state under the parent.
                    if (this._childToParentMap.get(property) === undefined || !this._childToParentMap.get(property).get(linkableObject))
                        continue;
                    // avoid infinite recursion in implicit session states
                    this._getSessionStateIgnoreList.set(property, true);
                    resultNames.push(name);
                    resultProperties.push(property);
                } else {
                    if (property !== null)
                        console.log("ignoring duplicate object:", name, property);
                }

            }

            // special case if there are no child objects -- return null
            if (resultNames.length > 0) {
                // second pass: get values from property names
                result = {};
                for (i = 0; i < resultNames.length; i++) {
                    var value = this.getSessionState(resultProperties[i]);
                    property = resultProperties[i];
                    // do not include objects that have a null implicit session state (no child objects)
                    if (value === null && !(property instanceof weavecore.LinkableVariable) && !(property instanceof weavecore.ILinkableCompositeObject) && !(property.getSessionState))
                        continue;
                    result[resultNames[i]] = value;

                }
            }
        }

        this._getSessionStateIgnoreList.set(linkableObject, undefined);

        return result;
    };


    /**
     * @method _cacheClassInfo
     * @private
     * @param {ILinkableObject} linkableObject
     * @param {String} className
     */
    p._cacheClassInfo = function (linkableObject, className) {
        // linkable property names
        var propertyNames = Object.getOwnPropertyNames(linkableObject);
        var sessionedPublicProperties = propertyNames.filter(function (propName) {
            if (propName.charAt(0) === '_')
                return false; //Private properties are ignored
            else {
                var isSessionable = false;
                if (linkableObject[propName] instanceof weavecore.ILinkableObject || (linkableObject[propName] && linkableObject[propName].sessionable)) {
                    isSessionable = true
                }
            }
            return isSessionable;
        });

        this._classNameToSessionedPropertyNames[className] = sessionedPublicProperties.sort();
    };

    /**
     * This function gets a list of sessioned property names so accessor functions for non-sessioned properties do not have to be called.
     * @method getLinkablePropertyNames
     * @param {ILinkableObject} linkableObject An object containing sessioned properties.
     * @param {Boolean} filtered If set to true, filters out deprecated, null, and excluded properties.
     * @return {Array} An Array containing the names of the sessioned properties of that object class.
     */
    p.getLinkablePropertyNames = function (linkableObject, filtered) {
        if (filtered === undefined) //default parameter value
            filtered = false;

        if (linkableObject === null) {
            console.log("SessionManager.getLinkablePropertyNames(): linkableObject cannot be null.");
            return [];
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.getLinkablePropertyNames(): linkableObject cannot be undefined.");
            return [];
        }

        var className = linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME;
        var propertyNames = this._classNameToSessionedPropertyNames[className];
        if (propertyNames === null || propertyNames === undefined) {
            this._cacheClassInfo(linkableObject, className);
            propertyNames = this._classNameToSessionedPropertyNames[className];
        }

        if (filtered) {
            var filteredPropNames = propertyNames.filter(function (propName) {
                var property = linkableObject[propName];
                if (property === null || property === undefined)
                    return false;
                if (this._childToParentMap.get(property) === undefined || !this._childToParentMap.get(property).get(linkableObject))
                    return false;

                return true;
            }.bind(this));
            return filteredPropNames;
        }
        return propertyNames;
    };


    function disposeBusyTaskPointers(disposedObject) {
        this._d2dOwnerTask.removeAllPrimary(disposedObject);
        this._d2dTaskOwner.removeAllSecondary(disposedObject);
    }

    /**
     * Returns a mapping from owner debugId to an Array of debugIds for its busy tasks.
     */
    p.debugBusyObjects = function () {
        var result = {};
        this._d2dOwnerTask.dictionary.forEach(function (value, owner) {
            var tasks = [];
            var taskDictionary = this._d2dOwnerTask.dictionary.get(owner);
            taskDictionary.forEach(function (value, task) {
                tasks.push(WeaveAPI.debugId(task));
            }, taskDictionary);
            result[WeaveAPI.debugId(owner)] = tasks;

        }, this._d2dOwnerTask.dictionary);

        return result;
    }

    /**
     * @inheritDoc
     */
    p.assignBusyTask = function (taskToken, busyObject) {
        if (this.debugBusyTasks)
            this._dTaskStackTrace.set(taskToken, new Error("Stack trace when task was last assigned").getStackTrace());

        // stop if already assigned
        var test = this._d2dTaskOwner.dictionary.get(taskToken);
        if (test && test.get(busyObject))
            return;

        if (taskToken instanceof weavecore.CustomPromise && !WeaveAPI.ProgressIndicator.hasTask(taskToken))
            taskToken.addResponder({
                result: unassignAsyncToken.bind(this),
                fault: unassignAsyncToken.bind(this),
                token: taskToken
            });

        this._d2dOwnerTask.set(busyObject, taskToken, true);
        this._d2dTaskOwner.set(taskToken, busyObject, true);
    }



    function unassignAsyncToken(resposne, token) {
        this.unassignBusyTask(token);
    }

    /**
     * @inheritDoc
     */
    p.unassignBusyTask = function (taskToken) {
        if (WeaveAPI.ProgressIndicator.hasTask(taskToken)) {
            WeaveAPI.ProgressIndicator.removeTask(taskToken);
            return;
        }

        var dOwner = this._d2dTaskOwner.dictionary.get(taskToken);
        if (!dOwner)
            return;

        this._d2dTaskOwner.dictionary.delete(taskToken);


        nextOwner: for (var owner of dOwner.keys()) {
            var dTask = this._d2dOwnerTask.dictionary.get(owner);
            dTask.delete(taskToken);

            // if there are other tasks, continue to next owner
            for (var task of dTask.keys())
                continue nextOwner;

            // when there are no more tasks, check later to see if callbacks trigger
            this._dUnbusyTriggerCounts.set(owner, WeaveAPI.SessionManager.getCallbackCollection(owner).triggerCounter);
            // immediate priority because we want to trigger as soon as possible
            WeaveAPI.StageUtils.startTask(null, unbusyTrigger.bind(this), WeaveAPI.TASK_PRIORITY_IMMEDIATE);

            if (this.debugBusyTasks) {
                var stackTrace = new Error("Stack trace when last task was unassigned").getStackTrace();
                this._dUnbusyStackTraces.set(owner, {
                    assigned: _dTaskStackTrace[taskToken],
                    unassigned: stackTrace,
                    token: taskToken
                });
            }
        }
    }

    /**
     * Called the frame after an owner's last busy task is unassigned.
     * Triggers callbacks if they have not been triggered since then.
     */
    function unbusyTrigger(stopTime) {
        var owner;
        do {
            if (new Date().getTime() > stopTime)
                return 0;

            owner = null;
            for (var owner of this._dUnbusyTriggerCounts.keys()) {
                var triggerCount = this._dUnbusyTriggerCounts.get(owner);
                this._dUnbusyTriggerCounts.delete(owner); // affects next for loop iteration - mitigated by outer loop

                var cc = WeaveAPI.SessionManager.getCallbackCollection(owner);
                if (cc instanceof weavecore.CallbackCollection ? cc.wasDisposed : this.objectWasDisposed(owner))
                    continue; // already disposed

                if (cc.triggerCounter !== triggerCount)
                    continue; // already triggered

                if (this.linkableObjectIsBusy(owner))
                    continue; // busy again

                if (this.debugBusyTasks) {
                    var stackTraces = this._dUnbusyStackTraces.get(owner);
                    console.log('Triggering callbacks because they have not triggered since owner has becoming unbusy:', WeaveAPI.debugId(owner));
                    console.log(stackTraces.assigned);
                    console.log(stackTraces.unassigned);
                }

                cc.triggerCallbacks();
            }
        } while (owner);

        return 1;
    }


    p.linkableObjectIsBusy = function (linkableObject) {
        var busy = false;

        this._aBusyTraversal[this._aBusyTraversal.length] = linkableObject; // push
        this._dBusyTraversal.set(linkableObject, true);

        outerLoop: for (var i = 0; i < this._aBusyTraversal.length; i++) {
            linkableObject = this._aBusyTraversal[i];

            if (linkableObject.isBusy) {
                if (linkableObject.isBusy()) {
                    busy = true;
                    break;
                }
                // do not check children
                continue;
            }

            // if the object is assigned a task, it's busy
            for (var task in this._d2dOwnerTask.dictionary.get(linkableObject)) {
                if (this.debugBusyTasks) {
                    var stackTrace = this._dTaskStackTrace.get(task);
                    console.log(stackTrace);
                }
                busy = true;
                break outerLoop;
            }

            // see if children are busy
            var dChild = this._parentToChildMap.get(linkableObject);
            for (var child in dChild) {
                // queue all the children that haven't been queued yet
                if (!this._dBusyTraversal.get(child)) {
                    this._aBusyTraversal[this._aBusyTraversal.length] = child; // push
                    this._dBusyTraversal.set(child, true);
                }
            }
        }

        // reset traversal dictionary for next time
        for (var i = 0; i < this._aBusyTraversal.length; i++) {
            var linkableObject = this._aBusyTraversal[i];
            this._dBusyTraversal.set(linkableObject, false);
        }

        this._aBusyTraversal.length = 0;

        return busy;

    }

    /**
     * This function gets the CallbackCollection associated with an ILinkableObject.
     * If there is no CallbackCollection defined for the object, one will be created.
     * This CallbackCollection is used for reporting changes in the session state
     * @method getCallbackCollection
     * @param {ILinkableObject} linkableObject An ILinkableObject to get the associated ICallbackCollection for.
     * @return {CallbackCollection} The CallbackCollection associated with the given object.
     */
    p.getCallbackCollection = function (linkableObject) {
        if (linkableObject === null || linkableObject === undefined)
            return null;
        if (linkableObject instanceof weavecore.CallbackCollection)
            return linkableObject;

        var objectCC = this.linkableObjectToCallbackCollectionMap.get(linkableObject);
        if (objectCC === null || objectCC === undefined) {
            objectCC = this.registerDisposableChild(linkableObject, new weavecore.CallbackCollection());
            if (weavecore.CallbackCollection.debug)
                objectCC._linkableObject = linkableObject;
            this.linkableObjectToCallbackCollectionMap.set(linkableObject, objectCC);
        }

        return objectCC;
    };


    /**
     * This function checks if an object has been disposed by the SessionManager.
     * @method objectWasDisposed
     * @param {Object} object An object to check.
     * @return {Boolean} A value of true if disposeObject() was called for the specified object.
     * see {{#crossLink "SessionManager/disposeObject:method"}}{{/crossLink}}
     */
    p.objectWasDisposed = function (object) {
        if (object === undefined)
            return true; // added by sanjay:
        if (object === null) //null means :Object parameter is null i.e Object has no parameters
            return false;
        if (object instanceof weavecore.ILinkableObject || object.sessionable) {
            var cc = this.getCallbackCollection(object);
            if (cc)
                return cc.wasDisposed;
        }
        return this._disposedObjectsMap.get(object) !== undefined;
    };


    /**
     * This function should be called when an ILinkableObject  is no longer needed.
     * @method disposeObject
     * @param {Object} object An ILinkableObject  to clean up.
     * see {{#crossLink "SessionManager/objectWasDisposed:method"}}{{/crossLink}}
     */
    p.disposeObject = function (object) {
        if (object !== null && object !== undefined && !this._disposedObjectsMap.get(object)) {
            this._disposedObjectsMap.set(object, true);

            //  clean up pointers to busy tasks
            disposeBusyTaskPointers.call(this, object);

            try {
                // if the object implements IDisposableObject, call its dispose() function now
                //if (object instanceof IDisposableObject)
                //	{
                //	object.dispose();
                //	}
                if (object.dispose && object.dispose.constructor === Function) {
                    // call dispose() anyway if it exists, because it is common to forget to implement IDisposableObject.
                    object.dispose();
                }
            } catch (e) {
                console.log(e);
            }

            var linkableObject = object;
            if (linkableObject) {
                // dispose the callback collection corresponding to the object.
                // this removes all callbacks, including the one that triggers parent callbacks.
                var objectCC = this.getCallbackCollection(linkableObject);
                if (objectCC !== linkableObject)
                    this.disposeObject(objectCC);
            }

            // unregister from parents
            if (this._childToParentMap.get(object) !== undefined) {
                // remove the parent-to-child mappings
                for (var parent in this._childToParentMap.get(object))
                    if (this._parentToChildMap.get(parent) !== undefined)
                        this._parentToChildMap.get(parent).delete(object);
                    // remove child-to-parent mapping
                this._childToParentMap.delete(object);
            }

            // unregister from owner
            var owner = this._childToOwnerMap.get(object);
            if (owner !== null || owner !== undefined) {
                if (this._ownerToChildMap.get(owner) !== undefined)
                    this._ownerToChildMap.get(owner).delete(object);
                this._childToOwnerMap.delete(object);
            }

            // if the object is an ILinkableVariable, unlink it from all bindable properties that were previously linked
            //if (linkableObject instanceof LinkableVariable)
            //for (var bindableParent:* in _watcherMap[linkableObject])
            //for (var bindablePropertyName:String in _watcherMap[linkableObject][bindableParent])
            //unlinkBindableProperty(linkableObject as ILinkableVariable, bindableParent, bindablePropertyName);

            // unlink this object from all other linkable objects
            if (this.linkFunctionCache.dictionary.get(linkableObject)) {
                var otherObjectKeys = this.linkFunctionCache.dictionary.get(linkableObject).keys();
                for (var i = 0; i < otherObjectKeys.length; i++) {
                    var otherObject = otherObjectKeys[i];
                    this.unlinkSessionState(linkableObject, otherObject);
                }
            }


            // dispose all registered children that this object owns
            var children = this._ownerToChildMap.get(object);
            if (children !== null && children !== undefined) {
                // clear the pointers to the child dictionaries for this object
                this._ownerToChildMap.delete(object);
                this._parentToChildMap.delete(object);
                // dispose the children this object owned
                for (var child in children)
                    this.disposeObject(child);
            }

            this._treeCallbacks.triggerCallbacks("Session Tree: Object Disposed");
        }
    };


    /**
     * This function computes the diff of two session states.
     * @method computeDiff
     * @param {Object} oldState The source session state.
     * @param {Object} newState The destination session state.
     * @return {Object} A patch that generates the destination session state when applied to the source session state, or undefined if the two states are equivalent.
     * see {{#crossLink "SessionManager/combineDiff:method"}}{{/crossLink}}
     */
    p.computeDiff = function (oldState, newState) {
        var type = typeof (oldState); // the type of null is 'object'
        var diffValue;

        // special case if types differ
        if (typeof (newState) !== type)
            return newState;


        if (type === 'number') {
            if (isNaN(oldState) && isNaN(newState))
                return undefined; // no diff

            if (oldState !== newState)
                return newState;

            return undefined; // no diff
        } else if (oldState === null || oldState === undefined || newState === null || newState === undefined || type !== 'object') // other primitive value
        {
            if (oldState !== newState) // no type-casting
                return newState;

            return undefined; // no diff
        } else if (oldState.constructor === Array && newState.constructor === Array) {
            // If neither is a dynamic state array, don't compare them as such.
            if (!weavecore.DynamicState.isDynamicStateArray(oldState) && !weavecore.DynamicState.isDynamicStateArray(newState)) {
                if (weavecore.StandardLib.compare(oldState, newState) === 0)
                    return undefined; // no diff
                return newState;
            }

            // create an array of new DynamicState objects for all new names followed by missing old names
            var i;
            var typedState;
            var changeDetected = false;

            // create oldLookup
            var oldLookup = {};
            var objectName;
            var className;
            var sessionState;
            for (i = 0; i < oldState.length; i++) {
                // assume everthing is typed session state
                //note: there is no error checking here for typedState
                typedState = oldState[i];
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                // use '' instead of null to avoid "null"
                oldLookup[objectName || ''] = typedState;
            }
            if (oldState.length !== newState.length)
                changeDetected = true;

            // create new Array with new DynamicState objects
            var result = [];
            for (i = 0; i < newState.length; i++) {
                // assume everthing is typed session state
                //note: there is no error checking here for typedState
                typedState = newState[i];
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                className = typedState[weavecore.DynamicState.CLASS_NAME];
                sessionState = typedState[weavecore.DynamicState.SESSION_STATE];
                var oldTypedState = oldLookup[objectName || ''];
                delete oldLookup[objectName || '']; // remove it from the lookup because it's already been handled

                // If the object specified in newState does not exist in oldState, we don't need to do anything further.
                // If the class is the same as before, then we can save a diff instead of the entire session state.
                // If the class changed, we can't save only a diff -- we need to keep the entire session state.
                // Replace the sessionState in the new DynamicState object with the diff.
                if (oldTypedState !== undefined && oldTypedState[weavecore.DynamicState.CLASS_NAME] === className) {
                    className = null; // no change
                    diffValue = this.computeDiff(oldTypedState[weavecore.DynamicState.SESSION_STATE], sessionState);
                    if (diffValue === undefined) {
                        // Since the class name is the same and the session state is the same,
                        // we only need to specify that this name is still present.
                        result.push(objectName);

                        if (!changeDetected && oldState[i][weavecore.DynamicState.OBJECT_NAME] != objectName)
                            changeDetected = true;

                        continue;
                    }
                    sessionState = diffValue;
                }

                // save in new array and remove from lookup
                result.push(weavecore.DynamicState.create(objectName || null, className, sessionState)); // convert empty string to null
                changeDetected = true;
            }

            // Anything remaining in the lookup does not appear in newState.
            // Add DynamicState entries with an invalid className ("delete") to convey that each of these objects should be removed.
            for (objectName in oldLookup) {
                result.push(weavecore.DynamicState.create(objectName || null, SessionManager.DIFF_DELETE)); // convert empty string to null
                changeDetected = true;
            }

            if (changeDetected)
                return result;

            return undefined; // no diff
        } else // nested object
        {
            var diff; // start with no diff

            // find old properties that changed value
            for (var oldName in oldState) {
                diffValue = this.computeDiff(oldState[oldName], newState[oldName]);
                if (diffValue !== undefined) {
                    if (!diff)
                        diff = {};
                    diff[oldName] = diffValue;
                }
            }

            // find new properties
            for (var newName in newState) {
                if (oldState[newName] === undefined) {
                    if (!diff)
                        diff = {};
                    diff[newName] = newState[newName]; // TODO: same object pointer.. potential problem?
                }
            }

            return diff;
        }
    };

    /**
     * This modifies an existing diff to include an additional diff.
     * @method combineDiff
     * @param {Object} baseDiff The base diff which will be modified to include an additional diff.
     * @param {Object} diffToAdd The diff to add to the base diff.  This diff will not be modified.
     * @return {Object} The modified baseDiff, or a new diff object if baseDiff is a primitive value.
     * see {{#crossLink "SessionManager/computeDiff:method"}}{{/crossLink}}
     */
    p.combineDiff = function (baseDiff, diffToAdd) {
        var baseType = typeof (baseDiff); // the type of null is 'object'
        var diffType = typeof (diffToAdd);

        // special cases
        if (baseDiff === null || baseDiff === undefined || diffToAdd === null || diffToAdd === undefined || baseType !== diffType || baseType !== 'object') {
            if (diffType === 'object') // not a primitive, so make a copy
                baseDiff = Object.getPrototypeOf(Object.create(diffToAdd)).slice(0); //TODO: find better solution for array copy(currently Shallow copy)
            else
                baseDiff = diffToAdd;
        } else if (Array.isArray(baseDiff) && Array.isArray(diffToAdd)) {
            var i;

            // If either of the arrays look like DynamicState arrays, treat as such
            if (weavecore.DynamicState.isDynamicStateArray(baseDiff) || weavecore.DynamicState.isDynamicStateArray(diffToAdd)) {
                var typedState;
                var objectName;

                // create lookup: objectName -> old diff entry
                // temporarily turn baseDiff into an Array of object names
                var baseLookup = {};
                for (i = 0; i < baseDiff.length; i++) {
                    typedState = baseDiff[i];
                    // note: no error checking for typedState
                    if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                        objectName = typedState;
                    else
                        objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                    baseLookup[objectName] = typedState;
                    // temporarily turn baseDiff into an Array of object names
                    baseDiff[i] = objectName;
                }
                // apply each typedState diff appearing in diffToAdd
                for (i = 0; i < diffToAdd.length; i++) {
                    typedState = diffToAdd[i];
                    // note: no error checking for typedState
                    if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                        objectName = typedState;
                    else
                        objectName = typedState[weavecore.DynamicState.OBJECT_NAME];

                    // adjust names list so this name appears at the end
                    if (baseLookup.hasOwnProperty(objectName)) {
                        for (var j = baseDiff.indexOf(objectName); j < baseDiff.length - 1; j++)
                            baseDiff[j] = baseDiff[j + 1];
                        baseDiff[baseDiff.length - 1] = objectName;
                    } else {
                        baseDiff.push(objectName);
                    }

                    // apply diff
                    var oldTypedState = baseLookup[objectName];
                    if (typeof oldTypedState === 'string' || oldTypedState instanceof String || oldTypedState === null || oldTypedState === undefined) {
                        if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                            baseLookup[objectName] = typedState; // avoid unnecessary function call overhead
                        else
                            baseLookup[objectName] = Object.getPrototypeOf(Object.create(typedState)).slice(0); //TODO: Temp solution for Array Copy
                    } else if (!(typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)) // update dynamic state
                    {
                        var className = typedState[weavecore.DynamicState.CLASS_NAME];
                        // if new className is different and not null, start with a fresh typedState diff
                        if (className && className != oldTypedState[weavecore.DynamicState.CLASS_NAME]) {
                            baseLookup[objectName] = Object.getPrototypeOf(Object.create(typedState)).slice(0); //TODO: Temp solution for Array Copy
                        } else // className hasn't changed, so combine the diffs
                        {
                            oldTypedState[weavecore.DynamicState.SESSION_STATE] = this.combineDiff(oldTypedState[weavecore.DynamicState.SESSION_STATE], typedState[weavecore.DynamicState.SESSION_STATE]);
                        }
                    }
                }
                // change baseDiff back from names to typed states
                for (i = 0; i < baseDiff.length; i++)
                    baseDiff[i] = baseLookup[baseDiff[i]];
            } else // not typed session state
            {
                // overwrite old Array with new Array's values
                i = baseDiff.length = diffToAdd.length;
                while (i--) {
                    var value = diffToAdd[i];
                    if (value === null || value === undefined || typeof value !== 'object')
                        baseDiff[i] = value; // avoid function call overhead
                    else
                        baseDiff[i] = this.combineDiff(baseDiff[i], value);
                }
            }
        } else // nested object
        {
            for (var newName in diffToAdd)
                baseDiff[newName] = this.combineDiff(baseDiff[newName], diffToAdd[newName]);
        }

        return baseDiff;
    };

    /**************************************
     * linking sessioned objects together
     **************************************/



    /**
     * @inheritDoc
     */
    p.linkSessionState = function (primary, secondary) {
            if (primary === null || primary === undefined || secondary === null || secondary === undefined) {
                console.error("SessionManager.linkSessionState(): Parameters to this function cannot be null.");
                return;
            }
            if (primary == secondary) {
                console.error("Warning! Attempt to link session state of an object with itself");
                return;
            }
            if (this.linkFunctionCache.get(primary, secondary) instanceof Function)
                return; // already linked

            if (weavecore.CallbackCollection.debug)
                var stackTrace = new Error().getStackTrace();

            var setPrimary = function () {
                WeaveAPI.SessionManager.setSessionState(primary, WeaveAPI.SessionManager.getSessionState(secondary), true);
            };
            var setSecondary = function () {
                WeaveAPI.SessionManager.setSessionState(secondary, WeaveAPI.SessionManager.getSessionState(primary), true);
            };

            this.linkFunctionCache.set(primary, secondary, setPrimary);
            this.linkFunctionCache.set(secondary, primary, setSecondary);

            // when secondary changes, copy from secondary to primary
            WeaveAPI.SessionManager.getCallbackCollection(secondary).addImmediateCallback(primary, setPrimary);
            // when primary changes, copy from primary to secondary
            WeaveAPI.SessionManager.getCallbackCollection(primary).addImmediateCallback(secondary, setSecondary, true); // copy from primary now
        }
        /**
         * @inheritDoc
         */
    p.unlinkSessionState = function (first, second) {
        if (first === null || first === undefined || second === null || second === undefined) {
            console.error("SessionManager.unlinkSessionState(): Parameters to this function cannot be null.");
            return;
        }

        var setFirst = this.linkFunctionCache.remove(first, second);
        var setSecond = this.linkFunctionCache.remove(second, first);

        WeaveAPI.SessionManager.getCallbackCollection(second).removeCallback(setFirst);
        WeaveAPI.SessionManager.getCallbackCollection(first).removeCallback(setSecond);
    }

    /**
     * @public
     * @property  DIFF_DELETE
     * @static
     * @readOnly
     * @type String
     * @default "delete"
     */
    Object.defineProperty(SessionManager, 'DIFF_DELETE', {
        value: "delete"
    });

    weavecore.SessionManager = SessionManager;

    // namespace
    if (typeof window === 'undefined') {
        this.WeaveAPI = this.WeaveAPI || {};
        this.WeaveAPI.SessionManager = new SessionManager();
    } else {
        window.WeaveAPI = window.WeaveAPI || {};
        window.WeaveAPI.SessionManager = new SessionManager();
    }

}());

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function ErrorManager() {
        weavecore.ILinkableObject.call(this);
        this._errors = [];
        Object.defineProperty(this, 'errors', {
            get: function () {
                return this._errors;
            }
        });

    }

    ErrorManager.prototype = new weavecore.ILinkableObject();
    ErrorManager.prototype.constructor = ErrorManager;
    var p = ErrorManager.prototype;

    p.reportError = function (error, faultMessage, faultContent) {
        faultMessage = (faultMessage === undefined) ? null : faultMessage;
        faultContent = (faultContent === undefined) ? null : faultContent;

        if (typeof (error) === 'string') {
            error = new Error(error);
        }

        this._errors.push(error);
        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();

    }

    weavecore.ErrorManager = ErrorManager;
    weavecore.ClassUtils.registerClass('weavecore.ErrorManager', ErrorManager);
    WeaveAPI.ErrorManager = new ErrorManager();

}());

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function EditorManager() {
        weavecore.ILinkableObject.call(this);
        Object.defineProperties(this, {
            '_editorLookup': {
                value: new Map()
            },
            'labels': {
                value: new Map()
            }
        });

    }

    EditorManager.prototype = new weavecore.ILinkableObject();
    EditorManager.prototype.constructor = EditorManager;
    var p = EditorManager.prototype;



    /**
     * @inheritDoc
     */
    p.getEditorClass = function (linkableObjectOrClass) {
        var editorClass = this._editorLookup.get(linkableObjectOrClass);
        editorClass = (editorClass && weavecore.Compiler.isClass(editorClass)) ? editorClass : null;
        if (editorClass)
            return editorClass;

        /*var classQName = linkableObjectOrClass as String || getQualifiedClassName(linkableObjectOrClass);
        var superClasses: Array = ClassUtils.getClassExtendsList(classQName);
        superClasses.unshift(classQName);
        for (var i: int = 0; i < superClasses.length; i++) {
            classQName = superClasses[i];
            var classDef: Class = ClassUtils.getClassDefinition(classQName);
            editorClass = _editorLookup[classDef] as Class
            if (editorClass)
                return editorClass;
        }*/
        return null;
    }



    /**
     * @inheritDoc
     */
    p.getNewEditor = function (obj) {
        var Editor = this.getEditorClass(obj);
        if (Editor) {
            var editor = WeaveAPI.SessionManager.registerDisposableChild(obj, new Editor()); // when the object goes away, make the editor go away
            editor.setTarget(obj);
            return editor;
        }
        return null;
    }

    /**
     * @inheritDoc
     */
    p.setLabel = function (object, label) {
        this._labels.set(object, label);
        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    /**
     * @inheritDoc
     */
    p.getLabel = function (object) {
        return this._labels.get(object);
    }


    weavecore.EditorManager = EditorManager;
    weavecore.ClassUtils.registerClass('weavecore.EditorManager', EditorManager);
    WeaveAPI.EditorManager = new EditorManager();

}());

if (typeof window === 'undefined') {
    //this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    //window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function JavaScript() {

    }



    /**
     * Maps an ID to its corresponding value for use with _jsonReviver/_jsonReplacer.
     * Also maps a Function to its corresponding ID.
     */
    Object.defineProperty(JavaScript, '_jsonLookup', {
        value: new Map()
    });


    Object.defineProperties(JavaScript, {
        'JSON_CALL': { //This is the name of the generic external interface function which uses JSON input and output.
            value: "_jsonCall"
        },
        'JSON_REPLACER': { //The name of the property used to store a replacer function for the second parameter of JSON.stringify
            value: "_jsonReplacer"
        },
        'JSON_REVIVER': { //TThe name of the property used to store a reviver function for the second parameter of JSON.parse
            value: "_jsonReviver"
        },
        'JSON_LOOKUP': { //TThe name of the property used to store a reviver function for the second parameter of JSON.parse
            value: "_jsonLookup"
        },
        'JSON_SUFFIX': { //A random String which is highly unlikely to appear in any String value.  Used as a suffix for <code>NaN, -Infinity, Infinity</code>.
            value: ';' + Math.random() + ';' + new Date()
        }

    });

    //A random String which is highly unlikely to appear in any String value.  Used as a prefix for function identifiers in JSON.
    Object.defineProperty(JavaScript, 'JSON_FUNCTION_PREFIX', {
        value: 'function' + JavaScript.JSON_SUFFIX + ';'
    });

    /**
     * Used for generating unique function IDs.
     * Use a positive increment for ActionScript functions.
     * The JavaScript equivalent uses a negative increment to avoid collisions.
     */
    JavaScript._functionCounter = 0;

    /**
     * This flag will be set to true whenever _jsonReplacer makes a replacement that requires _jsonReviver to interpret.
     */
    JavaScript._needsReviving = false;

    /**
     * Extensions to _jsonReplacer/_jsonReviver.
     */
    JavaScript._jsonExtensions = [];

    /**
     * The name of a JavaScript property of this flash instance which contains an Array of JSON replacer/reviver extensions.
     * Each object in the Array can contain "replacer" and "reviver" properties containing the extension functions.
     */
    JavaScript.JSON_EXTENSIONS = "_jsonExtensions";

    /**
     * This is set to true when initialize() has been called.
     */
    JavaScript.initialized = false;


    /**
     * If this is true, backslashes need to be escaped when returning a String to JavaScript.
     */
    JavaScript.backslashNeedsEscaping = false;

    /**
     * Caches a new proxy function for a JavaScript function in _jsonLookup.
     * @param id The ID of the JavaScript function.
     * @return The proxy function.
     */
    JavaScript._cacheProxyFunction = function (id) {
        var params = {
            "id": id,
            "catch": false
        };

        //replaced JavaScript Exec with the function to avoid eval
        var func = function () {
            params['args'] = Array.prototype.slice.call(arguments);
            return (function () {
                var args = params['args'];
                var id = params['id'];
                var func = this._jsonReviver('', id);
                return func.apply(func['this'], args);
            }).apply(weave);
        };



        JavaScript._jsonLookup.set(func, id);
        JavaScript._jsonLookup.set(id, func);

        return func;
    }

    /**
     * Initializes json variable and required external JSON interface.
     */
    JavaScript.initialize = function () {
        // one-time initialization attempt
        JavaScript.initialized = true;

        // save special IDs for values not supported by JSON
			[NaN, Infinity, -Infinity].forEach(function (symbol) {
            JavaScript._jsonLookup.set(symbol + JavaScript.JSON_SUFFIX, symbol)
        });

        // determine if backslashes need to be escaped
        var slashes = "\\\\";
        JavaScript.backslashNeedsEscaping = false;
        //(ExternalInterface.call('function(slashes){ return slashes; }', slashes) !== slashes);


        //ExternalInterface.addCallback(JavaScript.JSON_CALL, _jsonCall);
        weave[JavaScript.JSON_CALL] = JavaScript._jsonCall;

        (function () {
            var JSON_CALL = JavaScript.JSON_CALL;
            var JSON_LOOKUP = JavaScript.JSON_LOOKUP;
            var JSON_SUFFIX = JavaScript.JSON_SUFFIX;
            var JSON_REVIVER = JavaScript.JSON_REVIVER;
            var JSON_REPLACER = JavaScript.JSON_REPLACER;
            var JSON_EXTENSIONS = JavaScript.JSON_EXTENSIONS;
            var JSON_FUNCTION_PREFIX = JavaScript.JSON_FUNCTION_PREFIX;
            var flash = this;
            var toJson = function (value) {
                return JSON.stringify(value, flash[JSON_REPLACER]);
            };
            var fromJson = function (value) {
                return JSON.parse(value, flash[JSON_REVIVER]);
            };
            var functionCounter = 0;
            var lookup = flash[JSON_LOOKUP] = {}; // Object is fine here as our keys are going to be string.
            var extensions = flash[JSON_EXTENSIONS] = [];
            var symbols = [NaN, Infinity, -Infinity];
            for (var i in symbols)
                lookup[symbols[i] + JSON_SUFFIX] = symbols[i];

            function cacheProxyFunction(id) {
                var func = function () { //these proxy function represent weave->getObject, evaulavteExpression....
                    if (!flash[JSON_CALL])
                        throw new Error("Cannot use the JavaScript API of a Flash object after it has been removed from the DOM.");
                    var params = Array.prototype.slice.call(arguments);
                    var paramsJson = toJson(params);
                    var resultJson = flash[JSON_CALL](id, paramsJson); //id which is passed through cacheProxyfunction was saved due to fucntion closure for respective functions like weave ->evaluavtexpression, getobject
                    return fromJson(resultJson);
                };
                func[JSON_FUNCTION_PREFIX] = id;
                return lookup[id] = func;
            }
            flash[JSON_REPLACER] = function (key, value) {
                if (typeof value === "function") {
                    if (!value[JSON_FUNCTION_PREFIX]) {
                        var id = JSON_FUNCTION_PREFIX + (--functionCounter);
                        value[JSON_FUNCTION_PREFIX] = id;
                        lookup[id] = value;
                    }
                    value = value[JSON_FUNCTION_PREFIX];
                } else if (typeof value === "number" && !isFinite(value))
                    value = value + JSON_SUFFIX;
                else if (Array.isArray(value) && !(value instanceof Array))
                    value = Array.prototype.slice.call(value);
                for (var i in extensions)
                    if (typeof extensions[i] === "object" && typeof extensions[i].replacer === "function")
                        value = extensions[i].replacer.call(flash, key, value);
                return value;
            };
            flash[JSON_REVIVER] = function (key, value) {
                if (typeof value === "string") {
                    if (lookup.hasOwnProperty(value))
                        value = lookup[value];
                    else if (value.substr(0, JSON_FUNCTION_PREFIX.length) == JSON_FUNCTION_PREFIX)
                        value = cacheProxyFunction(value);
                }
                for (var i in extensions)
                    if (typeof extensions[i] === "object" && typeof extensions[i].reviver === "function")
                        value = extensions[i].reviver.call(flash, key, value);
                return value;
            };
        }).apply(weave);
        /* JavaScript.exec({
                 "JSON_FUNCTION_PREFIX": JavaScript.JSON_FUNCTION_PREFIX,
                 "JSON_EXTENSIONS": JavaScript.JSON_EXTENSIONS,
                 "JSON_REPLACER": JavaScript.JSON_REPLACER,
                 "JSON_REVIVER": JavaScript.JSON_REVIVER,
                 "JSON_SUFFIX": JavaScript.JSON_SUFFIX,
                 "JSON_LOOKUP": JavaScript.JSON_LOOKUP,
                 "JSON_CALL": JavaScript.JSON_CALL
             },
             'var flash = this;',
             'var toJson = function(value) { return JSON.stringify(value, flash[JSON_REPLACER]); };',
             'var fromJson = function(value) { return JSON.parse(value, flash[JSON_REVIVER]); };',
             'var functionCounter = 0;',
             'var lookup = flash[JSON_LOOKUP] = {};',
             'var extensions = flash[JSON_EXTENSIONS] = [];',
             'var symbols = [NaN, Infinity, -Infinity];',
             'for (var i in symbols)',
             '   lookup[symbols[i] + JSON_SUFFIX] = symbols[i];',
             'function cacheProxyFunction(id) {',
             '   var func = function() {',
             '       if (!flash[JSON_CALL])',
             '           throw new Error("Cannot use the JavaScript API of a Flash object after it has been removed from the DOM.");',
             '       var params = Array.prototype.slice.call(arguments);',
             '       var paramsJson = toJson(params);',
             '       var resultJson = flash[JSON_CALL](id, paramsJson);',
             '       return fromJson(resultJson);',
             '   };',
             '   func[JSON_FUNCTION_PREFIX] = id;',
             '   return lookup[id] = func;',
             '}',
             'flash[JSON_REPLACER] = function(key, value) {',
             '   if (typeof value === "function") {',
             '       if (!value[JSON_FUNCTION_PREFIX]) {',
             '           var id = JSON_FUNCTION_PREFIX + (--functionCounter);',
             '           value[JSON_FUNCTION_PREFIX] = id;',
             '           lookup[id] = value;',
             '       }',
             '       value = value[JSON_FUNCTION_PREFIX];',
             '   }',
             '   else if (typeof value === "number" && !isFinite(value))',
             '       value = value + JSON_SUFFIX;',
             '   else if (Array.isArray(value) && !(value instanceof Array))',
             '       value = Array.prototype.slice.call(value);',
             '   for (var i in extensions)',
             '       if (typeof extensions[i] === "object" && typeof extensions[i].replacer === "function")',
             '           value = extensions[i].replacer.call(flash, key, value);',
             '   return value;',
             '};',
             'flash[JSON_REVIVER] = function(key, value) {',
             '   if (typeof value === "string") {',
             '       if (lookup.hasOwnProperty(value))',
             '           value = lookup[value];',
             '       else if (value.substr(0, JSON_FUNCTION_PREFIX.length) == JSON_FUNCTION_PREFIX)',
             '           value = cacheProxyFunction(value);',
             '   }',
             '   for (var i in extensions)',
             '       if (typeof extensions[i] === "object" && typeof extensions[i].reviver === "function")',
             '           value = extensions[i].reviver.call(flash, key, value);',
             '   return value;',
             '};'
         );*/
    }

    JavaScript.exec = function () {
        var paramsAndCode = Array.prototype.slice.call(arguments);
        if (!JavaScript.initialized)
            JavaScript.initialize();

        if (paramsAndCode.length === 1 && paramsAndCode[0] instanceof Array)
            paramsAndCode = paramsAndCode[0];

        /*var pNames = JSON ? null : [];
        var pValues = JSON ? null : [];*/
        var code = [];
        //var marshallExceptions = true;

        // separate function parameters from code
        paramsAndCode.forEach(function (item) {
            if (item.constructor.name === 'Object') {
                // We assume that all the keys in the Object are valid JavaScript identifiers,
                // since they are to be used in the code as variables.
                for (var key in item) {
                    var value = item[key];
                    if (key === 'this') {
                        // put a variable declaration at the beginning of the code
                        var thisVar = (value && typeof value === 'string') ? value : null;
                        if (thisVar) {
                            code.unshift("var " + thisVar + " = this;");
                        }
                    } else if (key === 'catch') {
                        // save error handler
                        //marshallExceptions = value;
                    } else if (JSON) {
                        // put a variable declaration at the beginning of the code
                        var jsValue;
                        if (value === null || value === undefined || typeof value === "number" || typeof value === "boolean")
                            jsValue = String(value);
                        else if (value instanceof Function)
                            jsValue = 'this.' + JavaScript.JSON_REVIVER + '("", ' + json.stringify(value, JavaScript._jsonReplacer) + ')';
                        else if (typeof value === 'object') {
                            JavaScript._needsReviving = false;
                            jsValue = JSON.stringify(value, JavaScript._jsonReplacer);
                            if (JavaScript._needsReviving)
                                jsValue = 'JSON.parse(' + JSON.stringify(jsValue) + ', this.' + JavaScript.JSON_REVIVER + ')';
                        } else
                            jsValue = JSON.stringify(value);

                        code.unshift("var " + key + " = " + jsValue + ";");
                    }
                }
            } else {
                code.push(String(item));
            }
        });
        var appliedCode = '(function(){\n' + code.join('\n') + '\n}).apply(weave)';

        var result = undefined;
        try {
            // work around unescaped backslash bug
            if (JavaScript.backslashNeedsEscaping && appliedCode.indexOf('\\') >= 0)
                appliedCode = appliedCode.split('\\').join('\\\\');

            result = evalFunction(appliedCode, null);
            if (result)
                result = JSON.parse(result, JavaScript._jsonReviver);

        } catch (e) {
            console.log(e);
        }
        return result;
    }

    function evalFunction(__code_from_flash__, __arguments_from_flash__) {
        try {
            return JSON.stringify(window.eval(__code_from_flash__), weavecore.JavaScript.JSON_REPLACER);
        } catch (e) {
            e.message += "\n" + __code_from_flash__;
            console.error(e);
        }
    }

    /**
     * Handles a JavaScript request.
     * @param methodId The ID of the method to call.
     * @param paramsJson An Array of parameters to pass to the method, stringified with JSON.
     * @return The result of calling the method, stringified with JSON.
     */
    JavaScript._jsonCall = function (methodId, paramsJson) {

        var method = JavaScript._jsonReviver('', methodId);
        method = (method && method instanceof Function) ? method : null;
        if (method === null)
            throw new Error('No method with id="' + methodId + '"');

        // json to object
        //var params;
        //if (JSON)
        var params = JSON.parse(paramsJson, JavaScript._jsonReviver);
        /*else
        	params = (paramsJson as Array).map(_mapJsonReviver);*/

        var result = method.apply(null, params);

        // object to json
        //var resultJson;
        //if (json)
        var resultJson = JSON.stringify(result, JavaScript._jsonReplacer) || 'null';
        /*else
        	resultJson = result is Array ? (result as Array).map(_mapJsonReplacer) : _jsonReplacer('', result);*/

        // work around unescaped backslash bug
        if (typeof (resultJson) === 'string' && JavaScript.backslashNeedsEscaping && (resultJson).indexOf('\\') >= 0)
            resultJson = (resultJson).split('\\').join('\\\\');

        return resultJson;
    }

    /**
     * Preserves primitive values not supported by JSON: undefined, NaN, Infinity, -Infinity
     * Also looks up or generates a Function corresponding to its ID value.
     */
    JavaScript._jsonReviver = function (key, value) {
        if (typeof (value) === 'string') {
            if (JavaScript._jsonLookup.get(value))
                value = JavaScript._jsonLookup.get(value);
            else if ((value).substr(0, JavaScript.JSON_FUNCTION_PREFIX.length) === JavaScript.JSON_FUNCTION_PREFIX)
                value = JavaScript._cacheProxyFunction(value); // ID -> Function
        }
        JavaScript._jsonExtensions.forEach(function (extension) {
            if (extension[JavaScript.JSON_REVIVER] instanceof Function)
                value = extension[JavaScript.JSON_REVIVER](key, value);
        });
        return value;
    }

    /**
     * Preserves primitive values not supported by JSON: NaN, Infinity, -Infinity
     * Also looks up or generates an ID corresponding to a Function value.
     */
    JavaScript._jsonReplacer = function (key, value) {
        // Function -> ID
        if (value && value instanceof Function) {
            var id = JavaScript._jsonLookup.get(value);
            if (!id) {
                id = JavaScript.JSON_FUNCTION_PREFIX + (++JavaScript._functionCounter);
                JavaScript._jsonLookup.set(value, id);
                JavaScript._jsonLookup.set(id, value);
            }
            JavaScript._needsReviving = true;
            value = id;
        } else if (typeof (value) === "number" && !isFinite(value)) {
            JavaScript._needsReviving = true;
            value = value + JavaScript.JSON_SUFFIX;
        }
        JavaScript._jsonExtensions.forEach(function (extension) {
            if (extension[JavaScript.NEEDS_REVIVING] instanceof Function && extension[JavaScript.NEEDS_REVIVING](key, value))
                JavaScript._needsReviving = true;
            if (extension[JavaScript.JSON_REPLACER] instanceof Function)
                value = extension[JavaScript.JSON_REPLACER](key, value);
        });
        return value;
    }


    JavaScript.extendJson = function (replacer, reviver, needsReviving) {
        var extension = {};
        extension[JavaScript.JSON_REPLACER] = replacer;
        extension[JavaScript.JSON_REVIVER] = reviver;
        extension[JavaScript.NEEDS_REVIVING] = needsReviving;
        JavaScript._jsonExtensions.push(extension);
    }


    /**
     * Exposes a method to JavaScript.
     * @param methodName The name to be used in JavaScript.
     * @param method The method.
     */
    JavaScript.registerMethod = function (methodName, method) {
        if (!JavaScript.initialized)
            JavaScript.initialize();

        var jsonId = JavaScript._jsonReplacer('', method)
        this[methodName] = this[JavaScript.JSON_REVIVER]('', jsonId);

    }

    /**
     * Handles a JavaScript request.
     * @param methodId The ID of the method to call.
     * @param paramsJson An Array of parameters to pass to the method, stringified with JSON.
     * @return The result of calling the method, stringified with JSON.
     */
    JavaScript._jsonCall = function (methodId, paramsJson) {
        //ExternalInterface.marshallExceptions = true; // let the external code handle errors

        var method = JavaScript._jsonReviver('', methodId);
        method = (method && method instanceof Function) ? method : null;
        if (method === null)
            throw new Error('No method with id="' + methodId + '"');

        // json to object
        var params = JSON.parse(paramsJson, JavaScript._jsonReviver);

        var result = method.apply(null, params);

        // object to json
        var resultJson = JSON.stringify(result, JavaScript._jsonReplacer) || 'null';


        // work around unescaped backslash bug
        if (typeof resultJson === 'string' && JavaScript.backslashNeedsEscaping && (resultJson).indexOf('\\') >= 0)
            resultJson = (resultJson).split('\\').join('\\\\');

        return resultJson;
    }

    weavecore.JavaScript = JavaScript;

}());

createjs.Ticker.setFPS(50);
//createjs.Ticker.

// constructor:

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}


Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_IMMEDIATE', {
    value: 0
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_HIGH', {
    value: 1
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_NORMAL', {
    value: 2
});

Object.defineProperty(WeaveAPI, 'TASK_PRIORITY_LOW', {
    value: 3
});


WeaveAPI._pathLookup = new Map();

WeaveAPI._jsonReviver = function (key, value) {
    var WP = 'WeavePath';
    if (value !== null && typeof (value) === 'object' && value.hasOwnProperty(WP) && value[WP] instanceof Array) {
        for (key in value)
            if (key !== WP)
                return value;
        return WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, value[WP]);
    }
    return value;
}

WeaveAPI._jsonReplacer = function (key, value) {
    if (value instanceof weavecore.ILinkableObject) {
        var obj = WeaveAPI._pathLookup.get(value);
        if (obj === undefined || obj === null) {
            var path = WeaveAPI.SessionManager.getPath(WeaveAPI.globalHashMap, value);
            // return null for ILinkableObjects not in session state tree
            obj = path ? {
                "WeavePath": path
            } : null;
            WeaveAPI._pathLookup.set(value, obj);
        }
        return obj;
    }
    return value;
}






WeaveAPI._needsReviving = function (key, value) {
    return value instanceof weavecore.ILinkableObject && WeaveAPI._jsonReplacer(key, value) !== null;
}

// moved to weavePath as IIFE function
/*WeaveAPI.addJsonExtension = function () {
    weavecore.JavaScript.extendJson(WeaveAPI._jsonReplacer, WeaveAPI._jsonReviver, WeaveAPI._needsReviving);
    weavecore.JavaScript.exec({
            "this": "weave",
            "WP": "WeavePath",
            "JSON_EXTENSIONS": weavecore.JavaScript.JSON_EXTENSIONS
        },
        'function replacer(key, value) {',
        '    if (value instanceof weave[WP]) {',
        '        var obj = {};',
        '        obj[WP] = value.getPath();',
        '        return obj;',
        '    }',
        '    return value;',
        '}',
        'function reviver(key, value) {',
        '    if (value != null && typeof value === "object" && value.hasOwnProperty(WP) && Array.isArray(value[WP])) {',
        '        for (key in value)',
        '            if (key != WP)',
        '                return value;',
        '        return weave.path(value[WP]);',
        '    }',
        '    return value;',
        '}',
        'weave[JSON_EXTENSIONS].push({"description": "ILinkableObject/WeavePath", "replacer": replacer, "reviver": reviver});'
    );
};*/

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {

    function URLUtil() {

    }

    URLUtil.isHttpURL = function (url) {
        return url !== null &&
            (url.indexOf("http://") === 0 ||
                url.indexOf("https://") === 0);

    }

    URLUtil.getFullURL = function (rootURL, url) {
        if (url !== null && !URLUtil.isHttpURL(url)) {
            if (url.indexOf("./") === 0) {
                url = url.substring(2);
            }
            if (URLUtil.isHttpURL(rootURL)) {
                var slashPos;

                if (url.charAt(0) === '/') {
                    // non-relative path, "/dev/foo.bar".
                    slashPos = rootURL.indexOf("/", 8);
                    if (slashPos === -1)
                        slashPos = rootURL.length;
                } else {
                    // relative path, "dev/foo.bar".
                    slashPos = rootURL.lastIndexOf("/") + 1;
                    if (slashPos <= 8) {
                        rootURL += "/";
                        slashPos = rootURL.length;
                    }
                }

                if (slashPos > 0)
                    url = rootURL.substring(0, slashPos) + url;
            }
        }

        return url;
    }

    weavecore.URLUtil = URLUtil;

}());

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}


(function () {

    URLRequestUtils.debug = false;
    URLRequestUtils.delayResults = false; // when true, delays result/fault handling and fills the 'delayed' Array.

    // array of objects with properties:  label:String, resume:Function
    Object.defineProperty(URLRequestUtils, 'delayed', {
        value: []
    });


    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_TEXT', {
        value: 'text'
    });

    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_BINARY', {
        value: 'binary'
    });
    Object.defineProperty(URLRequestUtils, 'DATA_FORMAT_VARIABLES', {
        value: 'variables'
    });

    Object.defineProperty(URLRequestUtils, 'LOCAL_FILE_URL_SCHEME', {
        value: 'local://'
    });




    function URLRequestUtils(defaultValue, taskDescription) {
        /**
         * A mapping of URL Strings to CustomXMLHttpRequest.
         * This mapping is necessary for cached requests to return the active request.
         */
        Object.defineProperty(this, '_requestURLToLoader', {
            value: {}
        });

        this._localFiles = {};
        this._baseURL;

    }

    var p = URLRequestUtils.prototype;

    /**
     * This will set the base URL for use with relative URL requests.
     */
    p.setBaseURL = function (baseURL) {
        // only set baseURL if there is a ':' before first '/'
        if (baseURL.split('/')[0].indexOf(':') >= 0) {
            // remove '?' and everything after
            this._baseURL = baseURL.split('?')[0];
        }
    }


    function addBaseURL(url) {
        if (this._baseURL)
            url = weavecore.URLUtil.getFullURL(this._baseURL, url);
    }



    p.getPromise = function (relevantContext, url, data, method, requestHeaders, dataFormat, allowMultipleEvents) {

        allowMultipleEvents = allowMultipleEvents === undefined ? false : allowMultipleEvents;

        var client;

        if (url.indexOf(URLRequestUtils.LOCAL_FILE_URL_SCHEME) === 0) {
            var fileName = url.substr(URLRequestUtils.LOCAL_FILE_URL_SCHEME.length);
            // If it's a local file, we still need to create a promise.
            // CustomURLLoader doesn't load if the last parameter to the constructor is false.
            if (allowMultipleEvents)
                client = this._requestURLToLoader[url];
            if (!client) {
                client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, false);
                if (allowMultipleEvents)
                    this._requestURLToLoader[url] = client;
            }
            client.promise.addRelevantContext(relevantContext);
            if (this._localFiles.hasOwnProperty(fileName)) {
                WeaveAPI.StageUtils.callLater(relevantContext, client.applyResult.bind(client), [this._localFiles[fileName]]);
            } else {
                fault = "Error: Missing local file: " + fileName;
                WeaveAPI.StageUtils.callLater(relevantContext, client.applyFault.bind(client), [fault]);
            }

            return client.promise;

        }

        addBaseURL.call(this, url);

        // attempt to load crossdomain.xml from same folder as file
        //Security.loadPolicyFile(URLUtil.getFullURL(request.url, 'crossdomain.xml'));

        try {
            client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, true);
        } catch (e) {
            // When an error occurs, we need to run the asyncFaultHandler later
            // and return a new URLLoader. CustomURLLoader doesn't load if the
            // last parameter to the constructor is false.
            client = new weavecore.CustomClient(url, data, method, requestHeaders, dataFormat, false);

            WeaveAPI.StageUtils.callLater(relevantContext, client.applyFault.bind(client), [e]);
        }

        client.promise.addRelevantContext(relevantContext);

        return client.promise;



    }


    weavecore.URLRequestUtils = URLRequestUtils;
    WeaveAPI.URLRequestUtils = new URLRequestUtils();






}());

(function () {
    /**
     * Lookup for hosts that previously failed due to crossdomain.xml security error
     */
    Object.defineProperty(CustomClient, '_failedHosts', {
        value: {} // host -> true
    });

    /**
     * Maps a status code to a description.
     */
    Object.defineProperty(CustomClient, 'HTTP_STATUS_CODES', {
        value: {
            "100": "Continue",
            "101": "Switching Protocol",
            "200": "OK",
            "201": "Created",
            "202": "Accepted",
            "203": "Non-Authoritative Information",
            "204": "No Content",
            "205": "Reset Content",
            "206": "Partial Content",
            "300": "Multiple Choice",
            "301": "Moved Permanently",
            "302": "Found",
            "303": "See Other",
            "304": "Not Modified",
            "305": "Use Proxy",
            "306": "unused",
            "307": "Temporary Redirect",
            "308": "Permanent Redirect",
            "400": "Bad Request",
            "401": "Unauthorized",
            "402": "Payment Required",
            "403": "Forbidden",
            "404": "Not Found",
            "405": "Method Not Allowed",
            "406": "Not Acceptable",
            "407": "Proxy Authentication Required",
            "408": "Request Timeout",
            "409": "Conflict",
            "410": "Gone",
            "411": "Length Required",
            "412": "Precondition Failed",
            "413": "Request Entity Too Large",
            "414": "Request-URI Too Long",
            "415": "Unsupported Media Type",
            "416": "Requested Range Not Satisfiable",
            "417": "Expectation Failed",
            "500": "Internal Server Error",
            "501": "Not Implemented",
            "502": "Bad Gateway",
            "503": "Service Unavailable",
            "504": "Gateway Timeout",
            "505": "HTTP Version Not Supported"
        }
    });

    function CustomClient(url, data, method, requestHeaders, dataFormat, loadNow) {

        method = method === null ? 'GET' : method;
        this._label;
        this._customPromise;
        this._isClosed = false;
        this._url = url;
        this._method = method;
        this._requestHeaders = requestHeaders;
        this.data = data;

        //XMLHttpRequest is a host object(DOM objects) so we cant extend using prototype
        Object.defineProperty(this, 'client', {
            value: new XMLHttpRequest()
        })

        //var ie9_XHR = window.XDomainRequest;
        //var XHR = ie9_XHR || XMLHttpRequest;
        //XHR.call(this);

        this._resumeFunc = null;
        this._resumeParam = null;


        this._resolve;
        this._reject;
        this._customPromise = new weavecore.CustomPromise(this, function (_resolve, _reject) {
            this._resolve = _resolve;
            this._reject = _reject;
        }.bind(this));
        /**
         * This is the promise that keeps track of repsonders.
         */
        Object.defineProperty(this, 'promise', {
            get: function () {
                return this._customPromise
            }
        });

        /**
         * list of function gets executed for promise then
         */
        Object.defineProperty(this, 'responders', {
            value: []
        });

        /**
         * This is the URLRequest that was passed to load().
         */
        Object.defineProperty(this, 'url', {
            get: function () {
                return this._url
            }
        });


        /**
         * Gets the open or closed status of the URLLoader.
         */
        Object.defineProperty(this, 'isClosed', {
            get: function () {
                return this._isClosed
            }
        });


        if (loadNow) {
            if (weavecore.URLRequestUtils.delayResults) {
                label = url;
                //to-do : change to binary data temporary solution JSON string
                try {
                    var stringData = JSON.stringify(data);
                    label += ' ' + stringData.split('\n').join(' ');
                } catch (e) {}
                console.log('requested ' + label);
                URLRequestUtils.delayed.push({
                    "label": label,
                    "resume": resume
                });
            }

            /*if (CustomClient._failedHosts[getHost()]) {
                // don't bother trying a URLLoader with the same host that previously failed due to a security error
                ExternalDownloader.download(_urlRequest, dataFormat, _asyncToken);
                return;
            }*/

            for (var name in requestHeaders)
                this.client.setRequestHeader(name, requestHeaders[name], false);

            this.client.responseType = "blob";

            var done = false;
            var customClient = this;
            this.client.onload = function (event) {
                Blob_to_b64(customClient.client.response, function (b64) {
                    callback.call(customClient, customClient.client.status, b64);
                    done = true;
                });
            };
            this.client.onerror = function (event) {
                if (!done)
                    callback.call(customClient, customClient.client.status, null);
                done = true;
            };
            this.client.onreadystatechange = function () {
                if (customClient.client.readyState == 4 && customClient.client.status != 200) {
                    setTimeout(
                        function () {
                            if (!done)
                                callback.call(customClient, customClient.client.status, null);
                            done = true;
                        },
                        1000
                    );
                }
            };




            if (weavecore.URLRequestUtils.debug)
                console.log(this, 'request', url);

            this.client.open(method, url, true);
            var data = null;
            if (method == "POST" && base64data) {
                data = weave.b64_to_ArrayBuffer(base64data);
                this.client.send(data);
            } else {
                this.client.send();
            }


        }

        this.promise.internal.then(function (response) {
            handleGetResult.call(this, response);
        }.bind(this), function (response) {
            handleGetError.call(response);
        }.bind(this))
    }

    function decodeResponse(response) {
        var dataView = new DataView(response);
        // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
        var decoder = new TextDecoder('utf-8');
        return decoder.decode(dataView);
    }

    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    function callback(status, base64data) {
        var result;
        if (base64data) {
            var bytes = b64_to_ArrayBuffer(base64data);
            result = decodeResponse(bytes);

        }
        if (status === 200) {
            this._resolve(result);
        } else {
            var faultCode = null;
            if (CustomClient.HTTP_STATUS_CODES[status])
                faultCode = status + " " + CustomClient.HTTP_STATUS_CODES[status];
            else if (status)
                faultCode = "" + status;
            else
                faultCode = "Error";
            this._reject(faultCode);
        }
    }

    function b64_to_ArrayBuffer(base64data) {
        var byteCharacters = atob(base64data);
        var myArray = new ArrayBuffer(byteCharacters.length);
        var longInt8View = new Uint8Array(myArray);
        for (var i = 0; i < byteCharacters.length; i++)
            longInt8View[i] = byteCharacters.charCodeAt(i);
        return myArray;
    };

    function Blob_to_b64(blob, callback) {
        var reader = new FileReader();
        reader.onloadend = function (event) {
            var dataurl = reader.result;
            var base64data = dataurl.split(',').pop();
            callback(base64data);
        };
        reader.onerror = function (event) {
            callback(null);
        };
        reader.readAsDataURL(blob);
    };



    function loadLater() {
        if (!this._isClosed) {
            this.open(this._method, this.url, true);
            this.send();
        }

    }

    function getHost() {
        var start = this.url.indexOf("/") + 2;
        var length = this.url.indexOf("/", start);
        var host = this.url.substr(0, length);
        return host;
    }

    var p = CustomClient.prototype;

    p.close = function () {
        WeaveAPI.ProgressIndicator.removeTask(this._customPromise);
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'cancel', this._url);
        this._isClosed = true;
        try {
            this.client.abort();
        } catch (e) {

        } // ignore close() errors
    }

    /**
     * This provides a convenient way for adding result/fault handlers.
     * @param responder
     */
    p.addResponder = function (responder) {
        this.promise.responders.push(responder);
    }

    /**
     * This provides a convenient way to remove a URLRequestToken as a responder.
     * @param responder
     */
    p.removeResponder = function (responder) {
        var responders = this.promise.responders;
        var index = responders.indexOf(responder);
        if (index >= 0) {
            // URLRequestToken found -- remove it
            responders.splice(index, 1);
            /*// see if there are any more URLRequestTokens
            for (var i = 0; i < responders.length; i++) {
                if (obj.isCustomResponder)
                    return;
            }*/

            // no more CustomAsyncResponders found, so cancel
            this.close();
        }
    }


    /**
     * When URLRequestUtils.delayResults is set to true, this function will resume
     * @return true
     */
    p.resume = function () {
        if (this._resumeFunc === null) {
            this._resumeFunc = resume; // this cancels the pending delay behavior
        } else if (this._resumeFunc !== resume) {
            this._resumeFunc(this._resumeParam);
        }
    }

    function handleGetResult(response) {
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'complete', this.url);
        if (weavecore.URLRequestUtils.delayResults && this._resumeFunc == null) {
            this._resumeFunc = handleGetResult;
            this._resumeParam = response;
            return;
        }

        // broadcast result to responders
        WeaveAPI.StageUtils.callLater(null, this.applyResult.bind(this), [response]);

    }

    /**
     * This function gets called when a URLLoader generated by getURL() dispatches an IOErrorEvent.
     * @param event The ErrorEvent from a URLLoader.
     */
    function handleGetError(fault) {
        if (weavecore.URLRequestUtils.debug)
            console.log(this, 'error', this.url);
        if (weavecore.URLRequestUtils.delayResults && this._resumeFunc == null) {
            this._resumeFunc = handleGetError;
            this._resumeParam = fault;
            return;
        }

        // broadcast fault to responders

        fault = fault ? fault : "Request cancelled";

        applyFault(fault);
        this._isClosed = true;
    }

    p.applyResult = function (data) {
        if (this.data !== data)
            this.data = data;
        this.promise.applyResult(data);
    }

    p.applyFault = function (fault) {
        this.promise.applyFault(fault);
    }



    weavecore.CustomClient = CustomClient;

}());

(function () {
    function CustomPromise(client, executor) {
        /*if (window.Promise) {
            try {
                window.Promise.call(this, executor);
            } catch (e) {
                console.error(e);
            }

        } else {
            console.warn("Promise Object Prototype not Found");
            return;
        }*/

        Object.defineProperty(this, 'internal', {
            value: new Promise(executor)
        });

        this._client = client;
        this._relevantContexts = [];

        Object.defineProperty(this, 'responders', {
            value: []
        });

        Object.defineProperty(this, 'client', {
            get: function () {
                return this._client
            }
        });

        this.addResponder({
            result: firstResponder.bind(this),
            fault: firstResponder.bind(this),
            token: null
        });

    }

    var p = CustomPromise.prototype;

    //responder {result:Function, fault:Function, token:Object}
    p.addResponder = function (responder) {
        this.responders.push(responder);
    }

    /**
     * Adds a context in which this AsyncToken is relevant.
     * If all contexts are disposed, this AsyncToken will not broadcast a ResultEvent or FaultEvent.
     */
    p.addRelevantContext = function (context) {
        var desc = "URL request";
        if (this.client)
            desc += ": " + this.client.url;
        WeaveAPI.ProgressIndicator.addTask(this, context, desc);
        this._relevantContexts.push(context);
    }

    p.applyResult = function (response) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].result(response, this.responders[i].token);
        }

    }

    p.applyFault = function (response) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].fault(response, this.responders[i].token);
        }
    }

    function contextDisposed(context, i, a) {
        return WeaveAPI.SessionManager.objectWasDisposed(context);
    }

    function firstResponder(response, token) {
        WeaveAPI.ProgressIndicator.removeTask(this);
        // if there are contexts and none are relevant, don't call responders
        if (this._relevantContexts.length && this._relevantContexts.every(contextDisposed))
            this._responders.length = 0;
    }

    weavecore.CustomPromise = CustomPromise;

}());

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    // this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    //  window.weavecore = window.weavecore || {};
}

(function () {

    function DebugUtils() {

    }

    /****************************
     **  Object id and lookup  **
     ****************************/

    DebugUtils._idToObjRef = new Map();
    DebugUtils._objToId = new Map(); // weakKeys=true to avoid memory leak
    DebugUtils._nextId = 0;

    /**
     * This function generates or returns a previously generated identifier for an object.
     */
    DebugUtils.debugId = function (object) {
        var type = typeof (object);
        if (object === null || type !== 'object' && type !== 'function')
            return String(object);
        var idString = DebugUtils._objToId.get(object);
        if (!idString) {
            var idNumber = DebugUtils._nextId++;
            var className = object.constructor.name;
            idString = className + '#' + idNumber;

            var ref = new Map();
            ref.set(object, true);
            // save lookup from object to idString
            DebugUtils._objToId.set(object, idString);
            // save lookup from idString and idNumber to weak object reference
            DebugUtils._idToObjRef.set(idNumber, ref);
            DebugUtils._idToObjRef.set(idString, ref);
        }
        return idString;
    }

    // weavecore.DebugUtils = DebugUtils;
    WeaveAPI.DebugUtils = DebugUtils;

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}




/**
 * Asynchronous merge sort.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @public
     * @property NS
     * @readOnly
     * @type String
     */
    Object.defineProperty(AsyncSort, 'NS', {
        value: 'weavecore'
    });

    /**
     * temporary solution to save the className for this class/prototype
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(AsyncSort, 'CLASS_NAME', {
        value: 'AsyncSort'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(AsyncSort, 'SESSIONABLE', {
        value: true
    });


    Object.defineProperty(AsyncSort, 'ARRAY_NUMERIC', {
        value: 16
    });

    Object.defineProperty(AsyncSort, 'ARRAY_CASESENSITIVE', {
        value: 1
    });

    AsyncSort.debug = false;
    AsyncSort._immediateSorter;
    AsyncSort.sortImmediately = function (array, compareFunction) {
        compareFunction = (compareFunction === undefined) ? null : compareFunction;
        if (!AsyncSort._immediateSorter) {
            AsyncSort._immediateSorter = new weavecore.AsyncSort();
            AsyncSort._immediateSorter._immediately = true;
        }

        // temporarily set AsyncSort._immediateSorter to null in case sortImmediately is called recursively.
        var sorter = AsyncSort._immediateSorter;
        AsyncSort._immediateSorter = null;

        sorter.beginSort(array, compareFunction);

        AsyncSort._immediateSorter = sorter;

    }

    /**
     * This function is a wrapper for ObjectUtil.stringCompare(a, b, true) (case-insensitive String compare).
     */
    AsyncSort.compareCaseInsensitive = function (a, b) {
        return weavecore.ObjectUtil.stringCompare(a, b, true);

    }

    /**
     * Compares two primitive values.
     * This function is faster than ObjectUtil.compare(), but does not do deep object compare.
     */
    AsyncSort.primitiveCompare = function (a, b) {
        if (a === b)
            return 0;
        if (a === null || a === undefined)
            return 1;
        if (b === null || b === undefined)
            return -1;
        var typeA = typeof (a);
        var typeB = typeof (b);
        if (typeA !== typeB)
            return weavecore.ObjectUtil.stringCompare(typeA, typeB);
        if (typeA === 'boolean')
            return weavecore.ObjectUtil.numericCompare(Number(a), Number(b));
        if (typeA === 'number')
            return weavecore.ObjectUtil.numericCompare(a, b);
        if (typeA === 'string')
            return weavecore.ObjectUtil.stringCompare(a, b);
        if (a instanceof Date && b instanceof Date)
            return weavecore.ObjectUtil.dateCompare(a, b);
        return 1; // not equal
    }


    function AsyncSort() {

        this._original; // original array
        this._source; // contains sub-arrays currently being merged
        this._destination; // buffer to store merged sub-arrays
        this._compare; // compares two array items
        this._length; // length of original array
        this._subArraySize; // size of sub-array
        this._middle; // end of left and start of right sub-array
        this._end; // end of right sub-array
        this._iLeft; // left sub-array source index
        this._iRight; // right sub-array source index
        this._iMerged; // merged destination index
        this._elapsed; // keeps track of elapsed time inside iterate()
        this._immediately = false; // set in sortImmediately(), checked in beginSort()

        Object.defineProperty(this, 'result', {
            get: function () {
                return this._source ? null : this._original;
            }
        });

    }



    AsyncSort.prototype = new weavecore.ILinkableObject();
    AsyncSort.prototype.constructor = AsyncSort;

    // Prototypes
    var p = AsyncSort.prototype;

    /**
     * This will begin an asynchronous sorting operation on the specified Array (or Vector).
     * Only one sort operation can be carried out at a time.
     * Callbacks will be triggered when the sorting operation completes.
     * The given Array (or Vector) will be modified in-place.
     * @param arrayToSort The Array (or Vector) to sort.
     * @param compareFunction A function that compares two items and returns -1, 0, or 1.
     * @see mx.utils.ObjectUtil#compare()
     */
    p.beginSort = function (arrayToSort, compareFunction) {
        compareFunction = (compareFunction === undefined) ? null : compareFunction;
        // initialize
        this._compare = compareFunction;
        this._original = arrayToSort || [];
        this._source = this._original;
        this._length = this._original.length;

        // make a buffer of the same type and length
        var Type = this._source.constructor;
        this._destination = new Type();
        this._destination.length = this._length;

        this._subArraySize = 1;
        this._iLeft = 0;
        this._iRight = 0;
        this._middle = 0;
        this._end = 0;
        this._elapsed = 0;

        if (this._immediately) {
            iterate.call(this, Number.MAX_VALUE);
            done.call(this);
        } else {
            // high priority because many things cannot continue without sorting results or must be recalculated when sorting finishes
            WeaveAPI.StageUtils.startTask(this, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, done.bind(this), ("Sorting {0} items" + this._original.length));
        }
    }

    /**
     * Aborts the current async sort operation.
     */

    p.abort = function () {
        this._compare = null;
        this._source = this._original = this._destination = null;
        this._length = this._subArraySize = this._iLeft = this._iRight = this._middle = this._end = this._elapsed = 0;
    }

    function iterate(stopTime) {
        /*if (this._compare === weavecore.ObjectUtil.numericCompare) {
            this._original.sort(AsyncSort.ARRAY_NUMERIC);
            return 1;
        }

        if (this._compare === AsyncSort.compareCaseInsensitive) {
            this._original.sort(AsyncSort.ARRAY_CASESENSITIVE);
            return 1;
        }*/

        if (this._compare === null || this._compare === undefined) {
            if (this._original.length) {
                if (this._original[0].constructor === Number)
                    this._original.sort(numericSort);
                else if (this._original[0].constructor === String)
                    this._original.sort(nonASCIISort);
                else if (this._original[0] instanceof Date)
                    this._original.sort(dateSort);
            }


            return 1;
        }

        var time = getTimer();

        while (getTimer() < stopTime) {
            if (this._iLeft < this._middle) // if there are still more items in the left sub-array
            {
                // copy smallest value to merge destination
                if (this._iRight < this._end && this._compare(this._source[this._iRight], this._source[this._iLeft]) < 0)
                    this._destination[this._iMerged++] = this._source[this._iRight++];
                else
                    this._destination[this._iMerged++] = this._source[this._iLeft++];
            } else if (this._iRight < this._end) // if there are still more items in the right sub-array
            {
                this._destination[this._iMerged++] = this._source[this._iRight++];
            } else if (this._end < this._length) // if there are still more pairs of sub-arrays to merge
            {
                // begin merging the next pair of sub-arrays
                var start = this._end;
                this._middle = Math.min(start + this._subArraySize, this._length);
                this._end = Math.min(this._middle + this._subArraySize, this._length);
                this._iLeft = start;
                this._iRight = this._middle;
                this._iMerged = start;
            } else // done merging all pairs of sub-arrays
            {
                // use the merged destination as the next source
                var merged = this._destination;
                this._destination = this._source;
                this._source = merged;

                // start merging sub-arrays of twice the previous size
                this._end = 0;
                this._subArraySize *= 2;

                // stop if the sub-array includes the entire array
                if (this._subArraySize >= this._length)
                    break;
            }
        }

        this._elapsed += getTimer() - time;

        // if one sub-array includes the entire array, we're done
        if (this._subArraySize >= this._length)
            return 1; // done

        //TODO: improve progress calculation
        return this._subArraySize / this._length; // not exactly accurate, but returns a number < 1
    }

    function getTimer() {
        return new Date().getTime();
    }



    function done() {
        // source array is completely sorted
        if (this._source !== this._original) // if source isn't the this._original
        {
            // copy the sorted values to the original
            var i = this._length;
            while (i--)
                this._original[i] = this._source[i];
        }

        // clean up so the "get result()" function knows we're done
        this._source = null;
        this._destination = null;

        if (AsyncSort.debug && this._elapsed > 0)
            console.log(this, this.result.length, 'in', this._elapsed / 1000, 'seconds');

        if (!this._immediately)
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    function numericSort(a, b) {
        return a - b;
    }

    function nonASCIISort(a, b) {
        return a.localeCompare(b);
    }

    function dateSort(date1, date2) {
        // This is a comparison function that will result in dates being sorted in
        // ASCENDING order.
        if (date1 > date2) return 1;
        if (date1 < date2) return -1;
        return 0;
    };

    /*************
     ** Testing **
     *************/

    /*
    	Built-in sort is slower when using a compare function because it uses more comparisons.
    	Array.sort 50 numbers; 0.002 seconds; 487 comparisons
    	Merge Sort 50 numbers; 0.001 seconds; 208 comparisons
    	Array.sort 3000 numbers; 0.304 seconds; 87367 comparisons
    	Merge Sort 3000 numbers; 0.111 seconds; 25608 comparisons
    	Array.sort 6000 numbers; 0.809 seconds; 226130 comparisons
    	Merge Sort 6000 numbers; 0.275 seconds; 55387 comparisons
    	Array.sort 12000 numbers; 1.969 seconds; 554380 comparisons
    	Merge Sort 12000 numbers; 0.514 seconds; 119555 comparisons
    	Array.sort 25000 numbers; 9.498 seconds; 2635394 comparisons
    	Merge Sort 25000 numbers; 1.234 seconds; 274965 comparisons
    	Array.sort 50000 numbers; 37.285 seconds; 10238787 comparisons
    	Merge Sort 50000 numbers; 2.603 seconds; 585089 comparisons
    */
    /*
    	Built-in sort is faster when no compare function is given.
    	Array.sort 50 numbers; 0 seconds
    	Merge Sort 50 numbers; 0.001 seconds
    	Array.sort 3000 numbers; 0.003 seconds
    	Merge Sort 3000 numbers; 0.056 seconds
    	Array.sort 6000 numbers; 0.006 seconds
    	Merge Sort 6000 numbers; 0.123 seconds
    	Array.sort 12000 numbers; 0.012 seconds
    	Merge Sort 12000 numbers; 0.261 seconds
    	Array.sort 25000 numbers; 0.026 seconds
    	Merge Sort 25000 numbers; 0.599 seconds
    	Array.sort 50000 numbers; 0.058 seconds
    	Merge Sort 50000 numbers; 1.284 seconds
    */
    AsyncSort._testArrays;
    //AsyncSort._testArraysSortOn;
    AsyncSort._testType = -1;
    AsyncSort._initTestArrays = function (testType) {
        if (testType !== AsyncSort._testType) {
            AsyncSort._testType = testType;
            AsyncSort._testArrays = [];
            //AsyncSort._testArraysSortOn = [];
            var dummyArray = [0, 1, 2, 3, 4, 5, 50, 3000, 6000, 12000, 25000, 50000];
            dummyArray.forEach(function (n) {
                var array = [];
                // var arraySortOn = [];
                for (var i = 0; i < n; i++) {
                    var value;
                    if (testType === 0) // random integers
                        value = parseInt(Math.random() * 100);
                    else if (testType === 1) // random integers and NaNs
                        value = Math.random() < .5 ? NaN : parseInt(Math.random() * 100);
                    else if (testType === 2) // random strings
                        value = 'a' + Math.random();

                    array.push(value);
                    /*arraySortOn.push({
                        'value': value
                    });*/
                }
                AsyncSort._testArrays.push(array);
                // AsyncSort._testArraysSortOn.push(arraySortOn);
            });
        }
        var desc = ['uint', 'uint and NaN', 'string'][testType];
        console.log("testType =", testType, '(' + desc + ')');
    }
    AsyncSort.test = function (compare, testType) {
            testType = (testType === undefined) ? 0 : testType;
            AsyncSort._initTestArrays(testType);
            AsyncSort._debugCompareFunction = compare;
            AsyncSort._testArrays.forEach(function (_array) {
                var array1 = _array.concat();
                var array2 = _array.concat();

                var start = getTimer();
                AsyncSort._debugCompareCount = 0;
                if (compare === null || compare === undefined) {
                    if (array1[0]) {
                        if (array1[0].constructor === Number) array1.sort(numericSort);
                        if (array1[0].constructor === String) array1.sort(nonASCIISort);
                        if (array1[0].constructor === Date) array1.sort(dateSort);
                    } else {
                        array1.sort();
                    }


                }

                /*else if (compare instanceof Function)
                    array1.sort(AsyncSort._debugCompareCounter);*/
                else
                    array1.sort(compare);
                console.log('Array.sort', array1.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                start = getTimer();
                AsyncSort._debugCompareCount = 0;
                AsyncSort.sortImmediately(array2, compare instanceof Function ? AsyncSort._debugCompareCounter : null);
                //trace('Merge Sort', n, 'numbers;', AsyncSort._immediateSorter.elapsed / 1000, 'seconds;',AsyncSort._debugCompareCount,'comparisons');
                console.log('Merge Sort', array2.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                if (array2.length === 1 && weavecore.ObjectUtil.compare(array1[0], array2[0]) !== 0)
                    throw new Error("sort failed on array length 1");

                AsyncSort._verifyNumbersSorted(array2);
            });

        }
        /*AsyncSort.testSortOn = function (compare, testType) {
            testType = (testType === undefined) ? 0 : testType;
            AsyncSort._initTestArrays(testType);
            AsyncSort._debugCompareFunction = new weavecore.SortOn('value', compare || AsyncSort.primitiveCompare).compare;
            AsyncSort._testArraysSortOn.forEach(function (_array) {
                var array1 = _array.concat();
                var array2 = _array.concat();
                var array3 = _array.concat();
                var array4 = _array.concat();

                var start = getTimer();
                AsyncSort._debugCompareCount = 0;
                if (compare === null)
                    array1.sortOn('value', 0);
                else if (compare instanceof Function)
                    array1.sortOn('value', AsyncSort._debugCompareCounter);
                else
                    array1.sortOn('value', compare);
                console.log('Array.sortOn', array1.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                start = getTimer();
                AsyncSort._debugCompareCount = 0;
                var plucked = new Array();
                plucked.length = _array.length;
                var i = _array.length;

                while (i--)
                    plucked[i] = _array[i]['value'];
                if (compare === null)
                    plucked.sort(0);
                else if (compare instanceof Function)
                    plucked.sort(AsyncSort._debugCompareCounter);
                else
                    plucked.sort(compare);
                console.log('Pluck & sort', plucked.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                start = getTimer();
                AsyncSort._debugCompareCount = 0;
                weavecore.StandardLib.sortOn(array3, 'value');
                console.log('StdLib sortOn', array3.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                start = getTimer();
                AsyncSort._debugCompareCount = 0;
                StandardLib.sortOn(array4, ['value']);
                console.log('StdLib sortOn[]', array4.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                start = getTimer();
                AsyncSort._debugCompareCount = 0;
                AsyncSort.sortImmediately(array2, AsyncSort._debugCompareCounter);
                //trace('Merge Sort', n, 'numbers;', AsyncSort._immediateSorter.elapsed / 1000, 'seconds;',AsyncSort._debugCompareCount,'comparisons');
                console.log('Merge SortOn', array2.length, 'numbers;', (getTimer() - start) / 1000, 'seconds;', AsyncSort._debugCompareCount ? (AsyncSort._debugCompareCount + ' comparisons') : '');

                if (array2.length == 1 && weavecore.ObjectUtil.compare(array1[0], array2[0]) != 0)
                    throw new Error("sort failed on array length 1");

                AsyncSort._verifyNumbersSorted(array2);
            })

        }*/

    AsyncSort._verifyNumbersSorted = function (array) {
        for (var i = 1; i < array.length; i++) {
            if (weavecore.ObjectUtil.numericCompare(array[i - 1], array[i]) > 0) {
                throw new Error("ASSERTION FAIL " + array[i - 1] + ' > ' + array[i]);
            }
        }
    }

    AsyncSort._debugCompareCount = 0;
    AsyncSort._debugCompareFunction = null;
    AsyncSort._debugCompareCounter = function (a, b) {
        AsyncSort._debugCompareCount++;
        return AsyncSort._debugCompareFunction(a, b);
    }



    weavecore.AsyncSort = AsyncSort;

}());

(function () {
    function SortOn(prop, compare) {
        this._prop = prop;
        this._compare = compare;
    }

    var p = SortOn.prototype;
    p.compare = function (a, b) {
        return this._compare(a[this._prop], b[this._prop]);
    }

    weavecore.SortOn = SortOn;
}())

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    /**
     * Use this when you need a Promise chain to depend on ILinkableObjects and resolve multiple times.
     *
     * Adds support for <code>depend(...linkableObjects)</code>
     * @param relevantContext This parameter may be null.  If the relevantContext object is disposed, the promise will be disabled.
     * @param resolver A function like function(resolve:Function, reject:Function):void which carries out the promise
     */
    function WeavePromise(relevantContext, resolver) {
        resolver = (resolver === undefined) ? null : resolver;


        this._rootPromise;
        this.relevantContext;
        this._result;
        this._error;
        Object.defineProperty(this, '_handlers', {
            value: []
        });
        Object.defineProperty(this, '_dependencies', {
            value: []
        });



        if (relevantContext instanceof WeavePromise) {
            // this is a child promise
            this._rootPromise = relevantContext._rootPromise;
            this.relevantContext = relevantContext = this._rootPromise.relevantContext;
        } else {
            // this is a new root promise
            this._rootPromise = this;
            this.relevantContext = relevantContext;

            // if resolver is not specified, immediately set the result of the root promise equal to the relevantContext
            if (resolver === null)
                this.setResult(this.relevantContext);
        }

        if (relevantContext)
            WeaveAPI.SessionManager.registerDisposableChild(relevantContext, this);

        if (resolver != null) {
            setBusy.call(this, true);
            resolver(this.setResult, this.setError);
        }
    }


    WeavePromise._noop = function (value) {
        return value;
    }

    var p = WeavePromise.prototype;

    p.setResult = function (result) {
        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        this._result = undefined;
        this._error = undefined;

        if (result instanceof weavecore.AsyncToken) {
            result.addResponder(new weavecore.AsyncResponder(
                function (result, token) {
                    this.setResult(result);
                }.bind(this),
                function (fault, token) {
                    this.setError(fault);
                }.bind(this)
            ));
        } else if (result instanceof WeavePromise) {
            result.then(this.setResult.bind(this), this.setError.bind(this));
        } else {
            this._result = result;
            callHandlers.call(this);
        }
    }

    p.getResult = function () {
        return this._result;
    }

    p.setError = function (error) {
        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        this._result = undefined;
        this._error = error;

        callHandlers.call(this);
    }

    p.getError = function () {
        return this._error;
    }

    function setBusy(busy) {
        if (busy) {
            var context = (this.relevantContext && (this.relevantContext instanceof weavecore.ILinkableObject || this.relevantContext.sessionable)) ? this.relevantContext : null;
            WeaveAPI.ProgressIndicator.addTask(this._rootPromise, context);
        } else {
            WeaveAPI.ProgressIndicator.removeTask(this._rootPromise);
        }
    }

    function callHandlers(newHandlersOnly) {
        newHandlersOnly = (newHandlersOnly === undefined) ? false : newHandlersOnly;
        if (this._dependencies.some(WeavePromise._dependencyIsBusy)) {
            if (this._handlers.length)
                setBusy.call(this, true);
            return;
        }

        // if there are no more handlers, remove the task
        if (this._handlers.length === 0)
            setBusy.call(this, false);

        if (WeaveAPI.SessionManager.objectWasDisposed(this.relevantContext)) {
            setBusy.call(this, false);
            return;
        }

        for (var i = 0; i < this._handlers.length; i++) {
            var handler = this._handlers[i];
            if (newHandlersOnly && handler.wasCalled)
                continue;
            if (this._result !== undefined)
                handler.onResult(this._result);
            else if (this._error !== undefined)
                handler.onError(this._error);
        }
    }

    p.then = function (onFulfilled, onRejected) {
        onFulfilled = (onFulfilled === undefined) ? null : onFulfilled;
        onRejected = (onRejected === undefined) ? null : onRejected;
        if (onFulfilled === null)
            onFulfilled = WeavePromise._noop;
        if (onRejected === null)
            onRejected = WeavePromise._noop;

        var next = new WeavePromise(this);
        next._result = undefined;
        this._handlers.push(new weavecore.Handler(onFulfilled, onRejected, next));

        if (this._result !== undefined || this._error !== undefined) {
            // callLater will not call the function if the context was disposed
            WeaveAPI.StageUtils.callLater(this.relevantContext, callHandlers.bind(this), [true]);
            setBusy.call(this, true);
        }

        return next;
    }

    p.depend = function () {
        var linkableObjects = Array.prototype.slice.call(arguments);
        if (linkableObjects.length) {
            setBusy.call(this, true);
        }
        linkableObjects.forEach(function (dependency) {
            WeaveAPI.SessionManager.getCallbackCollection(dependency).addGroupedCallback(this.relevantContext, callHandlers.bind(this), true);
        }.bind(this));
        return this;
    }

    WeavePromise._dependencyIsBusy = function (dependency, i, a) {
        return WeaveAPI.SessionManager.linkableObjectIsBusy(dependency);
    }

    p.getAsyncToken = function () {
        var asyncToken = new weavecore.AsyncToken();
        this.then(
            function (result) {
                asyncToken.applyResult(result, asyncToken);
            },
            function (error) {
                var fault = "Error: Broken promise\n" + "Content: " + error;
                asyncToken.applyFault(fault, asyncToken);
            }
        );
        return asyncToken;
    }

    p.dispose = function () {
        this._handlers.length = 0;
        setBusy.call(this, false);
    }

    weavecore.WeavePromise = WeavePromise;

}());

(function () {
    function Handler(onFulfilled, onRejected, next) {
        this.next = next;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
        /**
         * Used as a flag to indicate whether or not this handler has been called
         */
        this.wasCalled = false;
    }

    var p = Handler.prototype;

    p.onResult = function (result) {
        this.wasCalled = true;
        try {
            this.next.setResult(this.onFulfilled(result));
        } catch (e) {
            this.onError(e);
        }
    }

    p.onError = function (error) {
        this.wasCalled = true;
        try {
            this.next.setError(this.onRejected(error));
        } catch (e) {
            this.next.setError(e);
        }
    }

    weavecore.Handler = Handler;
}());


(function () {
    function AsyncToken() {
        Object.defineProperty(this, 'responders', {
            value: []
        });
    }

    var p = AsyncToken.prototype;

    p.addResponder = function (responder) {
        this.responders.push(responder);
    }

    p.applyResult = function (result) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].result(result, this.responders[i].token);
        }
    }

    p.applyFault = function (fault) {
        for (var i = 0; i < this.responders.length; i++) {
            this.responders[i].fault(fault, this.responders[i].token);
        }
    }

    weavecore.AsyncToken = AsyncToken;

}());


(function () {
    function AsyncResponder(result, fault, token) {

        this.result = result;
        this.fault = fault;
        this.token = token;

    }
    weavecore.AsyncResponder = AsyncResponder;

}());

/**
 * @module WeaveAPI
 */

//namesapce
if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}


WeaveAPI.debugID = function (object) {
    return WeaveAPI.DebugUtils.debugId(object);
}

/**
 * @module WeaveAPI
 */

//namesapce
if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
}




(function () {
    function Internal() {

    }

    /**
     * This is a two-dimensional dictionary, where _triggerCounterMap[linkableObject][observer]
     * equals the previous triggerCounter value from linkableObject observed by the observer.
     */
    Object.defineProperty(Internal, '_triggerCounterMap', {
        value: new Map()
    });

    /**
     * This function is used to detect if callbacks of a linkable object were triggered since the last time detectLinkableObjectChange
     * was called with the same parameters, likely by the observer.  Note that once this function returns true, subsequent calls will
     * return false until the callbacks are triggered again, unless clearChangedNow is set to false.  It may be a good idea to specify
     * a private object as the observer so no other code can call detectLinkableObjectChange with the same observer and linkableObject
     * parameters.
     * @param observer The object that is observing the change.
     * @param linkableObject The object that is being observed.
     * @param clearChangedNow If this is true, the trigger counter will be reset to the current value now so that this function will
     *        return false if called again with the same parameters before the next time the linkable object triggers its callbacks.
     * @return A value of true if the callbacks for the linkableObject have triggered since the last time this function was called
     *         with the same observer and linkableObject parameters.
     */
    Internal.detectLinkableObjectChange = function (observer, linkableObject, clearChangedNow) {
        clearChangedNow = (clearChangedNow === undefined) ? true : clearChangedNow;
        if (!Internal._triggerCounterMap[linkableObject])
            Internal._triggerCounterMap[linkableObject] = new Map();

        var previousCount = Internal._triggerCounterMap[linkableObject][observer]; // untyped to handle undefined value
        var newCount = WeaveAPI.SessionManager.getCallbackCollection(linkableObject).triggerCounter;
        if (previousCount !== newCount) // !== avoids casting to handle the case (0 !== undefined)
        {
            if (clearChangedNow)
                Internal._triggerCounterMap[linkableObject][observer] = newCount;
            return true;
        }
        return false;
    }

    window.WeaveAPI.Internal = Internal;
}());

WeaveAPI.detectLinkableObjectChange = function () {
    var args = Array.prototype.slice.call(arguments);
    var observer = args.shift();
    var linkableObjects = args;
    var changeDetected = false;
    // it's important not to short-circuit like a boolean OR (||) because we need to clear the 'changed' flag on each object.
    linkableObjects.forEach(function (linkableObject) {
        if (linkableObject && WeaveAPI.Internal.detectLinkableObjectChange(observer, linkableObject, true)) // clear 'changed' flag
            changeDetected = true;
    })
    return changeDetected;
}

// namespace

if (!this.weavecore)
    this.weavecore = {};

if (!this.WeaveAPI)
    this.WeaveAPI = {};

/**
 * This allows you to add callbacks that will be called when an event occurs on the stage.
 *
 * WARNING: These callbacks will trigger on every mouse and keyboard event that occurs on the stage.
 *          Developers should not add any callbacks that run computationally expensive code.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    // Internal class constructor

    Object.defineProperty(EventCallbackCollection, 'eventTypes', {
        value: ['tick']
    });

    function EventCallbackCollection(eventManager, eventType) {
        weavecore.CallbackCollection.call(this, this.setEvent.bind(this));
        this._eventManager = eventManager;
        this._eventType = eventType;

    }

    EventCallbackCollection.prototype = new weavecore.CallbackCollection();
    EventCallbackCollection.prototype.constructor = EventCallbackCollection;

    var p = EventCallbackCollection.prototype;

    /**
     * This is the _preCallback
     */
    p.setEvent = function setEvent(event) {
        this._eventManager.event = event;
    };

    /**
     * This function remembers the previous event value, runs callbacks using the new event value,
     * then restores the previous event value. This is necessary because it is possible for a popup
     * browser window to interrupt Flash with requests in the middle of an event.
     */
    p.runEventCallbacks = function (event) {
        var previousEvent = this._eventManager.event; // remember previous value
        this._runCallbacksImmediately(event); // make sure event is set before each immediate callback
        this._preCallback(previousEvent); // restore the previous value
    };

    /**
     * Call this when the stage is available to set up event listeners.
     */
    p.listenToStage = function () {
        // do not create event listeners for these meta events
        //if (eventType === POINT_CLICK_EVENT || eventType === THROTTLED_MOUSE_MOVE_EVENT)
        //return;

        //if (eventType === KeyboardEvent.KEY_DOWN && Capabilities.playerType === "Desktop")
        //cancelable = false;

        // Add a listener to the capture phase so the callbacks will run before the target gets the event.
        //stage.addEventListener(eventType, captureListener, true, 0, true); // use capture phase

        // If the target is the stage, the capture listener won't be called, so add
        // an additional listener that runs callbacks when the stage is the target.
        createjs.Ticker.addEventListener(this._eventType, this._tickerListener.bind(this)); // do not use capture phase

        // when callbacks are disposed, remove the listeners
        this.addDisposeCallback(null, function () {
            //stage.removeEventListener(eventType, captureListener, true);
            createjs.Ticker.removeEventListener(this._eventType, this._tickerListener.bind(this));
        });
    };

    p._tickerListener = function (event) {
        this._eventManager.eventTime = new Date().getTime();
        if (this._eventType === "tick") {
            if (this._eventManager.userActivity > 0 && !this._eventManager.mouseButtonDown)
                this._eventManager.userActivity--;
            this._eventManager.previousFrameElapsedTime = this._eventManager.eventTime - this._eventManager.currentFrameStartTime;
            this._eventManager.currentFrameStartTime = this._eventManager.eventTime;
            //this._eventManager.triggeredThrottledMouseThisFrame = false;
        }
        // finally, trigger callbacks for non-mouse-move events
        if (this._eventType === "tick") // altered temporarily
            this.runEventCallbacks(event);

    };

    weavecore.EventCallbackCollection = EventCallbackCollection;

    StageUtils.debug_async_time = false;
    StageUtils.debug_async_stack = false;
    StageUtils.debug_delayTasks = false; // set this to true to delay async tasks
    StageUtils.debug_callLater = false; // set this to true to delay async tasks


    /**
     * This will generate an iterative task function that is the combination of a list of tasks to be completed in order.
     * @param iterativeTasks An Array of iterative task functions.
     * @return A single iterative task function that invokes the other tasks to completion in order.
     *         The function will accept a stopTime parameter which when set to -1 will
     *         reset the task counter to zero so the compound task will start from the first task again.
     * @see #startTask()
     */
    StageUtils.generateCompoundIterativeTask = function () {
        var iterativeTasks = Array.prototype.slice.call(arguments);
        var iTask = 0;
        return function (stopTime) {
            if (stopTime < 0) // restart
            {
                iTask = 0;
                return 0;
            }
            if (iTask >= iterativeTasks.length)
                return 1;

            var i = iTask; // need to detect if iTask changes
            var iterate = iterativeTasks[iTask];
            var progress;
            if (iterate.length) {
                progress = iterate(stopTime);
            } else {
                while (iTask === i && (progress = iterate()) < 1 && getTimer() < stopTime) {}
            }
            // if iTask changed as a result of iterating, we need to restart
            if (iTask !== i)
                return 0;

            var totalProgress = (iTask + progress) / iterativeTasks.length;
            if (progress === 1)
                iTask++;
            return totalProgress;
        }
    }

    //constructor
    function StageUtils() {

        this.averageFrameTime = 0;

        Object.defineProperties(this, {
            eventManager: {
                value: new EventManager()
            },
            frameTimes: {
                value: []
            },
            _stackTraceMap: {
                value: new Map()
            },
            _taskElapsedTime: {
                value: new Map()
            },
            _taskStartTime: {
                value: new Map()
            },

        });

        Object.defineProperty(this, 'currentFrameElapsedTime', {
            get: function () {
                return getTimer() - this.eventManager.currentFrameStartTime;
            }
        });
        this._currentTaskStopTime = 0;

        /**
         * This is an Array of "callLater queues", each being an Array of function invocations to be done later.
         * The Arrays get populated by callLater().
         * There are four nested Arrays corresponding to the four priorities (0, 1, 2, 3) defined by static constants in WeaveAPI.
         */
        Object.defineProperties(this, {
            _priorityCallLaterQueues: {
                value: [[], [], [], []]
            },
            _priorityAllocatedTimes: {
                value: [Number.MAX_VALUE, 300, 200, 100]
            }
        });
        this._activePriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1; // task priority that is currently being processed
        this._activePriorityElapsedTime = 0;
        this._deactivatedMaxComputationTimePerFrame = 1000;
        this._nextCallLaterPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE; // private variable to control the priority of the next callLater() internally
        this.addEventCallback("tick", null, this._handleCallLater.bind(this));
        this.maxComputationTimePerFrame = 100;
        this.maxComputationTimePerFrame_noActivity = 250;

        this._debugTaskTimes = new Map();

    }

    var suP = StageUtils.prototype;
    suP.getMaxComputationTimePerFrame = function () {
        return this.maxComputationTimePerFrame;
    };

    suP.setMaxComputationTimePerFrame = function (value) {
        // this.eventManager.throttledMouseMoveInterval = value;
        this.maxComputationTimePerFrame = value;
    };

    suP.getTaskPriorityTimeAllocation = function (priority) {
        return this._priorityAllocatedTimes[priority];
    };

    suP.setTaskPriorityTimeAllocation = function (priority, milliseconds) {
        this._priorityAllocatedTimes[priority] = Math.max(milliseconds, 5);
    };

    StageUtils._time;
    StageUtils._times = [];

    suP.callLater = function (relevantContext, method, parameters) {
        if (method === null || method === undefined) {
            console.log('StageUtils.callLater(): received null "method" parameter');
            return;
        }

        this._priorityCallLaterQueues[this._nextCallLaterPriority].push(arguments);
        this._nextCallLaterPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE;

        if (StageUtils.debug_async_stack)
            this._stackTraceMap.set(arguments, new Error("This is the stack trace from when callLater() was called.").getStackTrace());
    };

    suP._handleCallLater = function () {
        if (this.maxComputationTimePerFrame === 0)
            this.maxComputationTimePerFrame = 100;

        var maxComputationTime;
        if (this.eventManager.useDeactivatedFrameRate)
            maxComputationTime = this._deactivatedMaxComputationTimePerFrame;
        else if (!this.eventManager.userActivity)
            maxComputationTime = this.maxComputationTimePerFrame_noActivity;
        else
            maxComputationTime = this.maxComputationTimePerFrame;
        if (!this.eventManager.event) {
            console.log("StageUtils.handleCallLater(): _event is null. This should never happen.");
            return;
        }
        if (this.eventManager.event.type === "tick") {
            //resetDebugTime();

            /*if (debug_fps)
            {
                frameTimes.push(previousFrameElapsedTime);
                if (StandardLib.sum(frameTimes) >= 1000)
                {
                    averageFrameTime = StandardLib.mean(frameTimes);
                    var fps = StandardLib.roundSignificant(1000 / averageFrameTime, 2);
                    trace(fps,'fps; max computation time',maxComputationTime);
                    frameTimes.length = 0;
                }
            }*/

            if (this.eventManager.previousFrameElapsedTime > 3000)
                console.log('Previous frame took', this.eventManager.previousFrameElapsedTime, 'ms');
        }

        //if (UIComponentGlobals.callLaterSuspendCount > 0)
        //return;

        // The variables countdown and lastPriority are used to avoid running newly-added tasks immediately.
        // This avoids wasting time on async tasks that do nothing and return early, adding themselves back to the queue.

        var args;
        var args2; // this is set to args[2]
        var stackTrace;
        var now;
        var allStop = this.eventManager.currentFrameStartTime + maxComputationTime;

        this._currentTaskStopTime = allStop; // make sure _iterateTask knows when to stop

        // first run the functions that should be called before anything else.
        /*if (pauseForGCIfCollectionImminent !== null)
        {
            var t = getTimer();
            pauseForGCIfCollectionImminent();
            t = getTimer() - t;
            if (t > maxComputationTimePerFrame)
                trace('paused',t,'ms for GC');
        }*/
        var queue = this._priorityCallLaterQueues[WeaveAPI.TASK_PRIORITY_IMMEDIATE];
        var countdown;
        for (countdown = queue.length; countdown > 0; countdown--) {
            /*if (debug_callLater)
                DebugTimer.begin();*/

            now = new Date().getTime();
            // stop when max computation time is reached for this frame
            if (now > allStop) {
                /*if (debug_callLater)
                    DebugTimer.cancel();*/
                return;
            }

            // args: (relevantContext:Object, method:Function, parameters:Array, priority:uint)
            args = queue.shift();
            stackTrace = this._stackTraceMap.get(args);

            // don't call the function if the relevantContext was disposed.
            if (!WeaveAPI.SessionManager.objectWasDisposed(args[0])) {
                args2 = args[2];
                if (args2 !== null && args2 && args2.length > 0) {
                    var rc = args2[0] ? args2[0] : null; //args2[0] constians the original context
                    args[1].apply(rc, args2);
                } else
                    args[1].call();
            }

            /*if (debug_callLater)
                DebugTimer.end(stackTrace);*/
        }

        //			trace('-------');

        var minPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1;
        var lastPriority = this._activePriority === minPriority ? this._priorityCallLaterQueues.length - 1 : this._activePriority - 1;
        var pStart = new Date().getTime();
        var pAlloc = this._priorityAllocatedTimes[this._activePriority];
        if (this.eventManager.useDeactivatedFrameRate)
            pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
        else if (!this.eventManager.userActivity)
            pAlloc = pAlloc * this.maxComputationTimePerFrame_noActivity / this.maxComputationTimePerFrame;
        var pStop = Math.min(allStop, pStart + pAlloc - this._activePriorityElapsedTime); // continue where we left off
        queue = this._priorityCallLaterQueues[this._activePriority];
        countdown = queue.length;
        while (true) {
            /*if (debug_callLater)
					DebugTimer.begin();*/

            now = new Date().getTime();
            if (countdown === 0 || now > pStop) {
                // add the time we just spent on this priority
                this._activePriorityElapsedTime += now - pStart;

                // if max computation time was reached for this frame or we have visited all priorities, stop now
                if (now > allStop || this._activePriority === lastPriority) {
                    /*if (debug_callLater)
							DebugTimer.cancel();
						if (debug_fps)
							trace('spent',currentFrameElapsedTime,'ms');*/
                    return;
                }

                // see if there are any entries left in the queues (except for the immediate queue)
                var remaining = 0;
                for (var i = minPriority; i < this._priorityCallLaterQueues.length; i++)
                    remaining += this._priorityCallLaterQueues[i].length;
                // stop if no more entries
                if (remaining === 0) {
                    /*if (debug_callLater)
							DebugTimer.cancel();*/
                    break;
                }

                // switch to next priority, reset elapsed time
                this._activePriority++;
                this._activePriorityElapsedTime = 0;
                if (this._activePriority === this._priorityCallLaterQueues.length)
                    this._activePriority = minPriority;
                pStart = now;
                pAlloc = this._priorityAllocatedTimes[this._activePriority];
                if (this.eventManager.useDeactivatedFrameRate)
                    pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
                else if (!this.eventManager.userActivity)
                    pAlloc = pAlloc * this.maxComputationTimePerFrame_noActivity / this.maxComputationTimePerFrame;
                pStop = Math.min(allStop, pStart + pAlloc);
                queue = this._priorityCallLaterQueues[this._activePriority];
                countdown = queue.length;

                // restart loop to check stopping condition
                /*if (debug_callLater)
						DebugTimer.cancel();*/
                continue;
            }

            countdown--;

            //				trace('p',_activePriority,pElapsed,'/',pAlloc);
            this._currentTaskStopTime = pStop; // make sure _iterateTask knows when to stop

            // call the next function in the queue
            // args: (relevantContext:Object, method:Function, parameters:Array, priority:uint)
            args = queue.shift();
            stackTrace = this._stackTraceMap.get(args); // check this for debugging where the call came from

            //				WeaveAPI.SessionManager.unassignBusyTask(args);

            // don't call the function if the relevantContext was disposed.
            if (!WeaveAPI.SessionManager.objectWasDisposed(args[0])) {
                // TODO: PROFILING: check how long this function takes to execute.
                // if it takes a long time (> 1000 ms), something's wrong...
                args2 = args[2];
                if (args2 !== null && args2.length > 0) {
                    var rc = args2[0] ? args2[0] : null; //args2[0] constians the original context
                    args[1].apply(rc, args2);
                } else
                    args[1].call();
            }

            /*if (debug_callLater)
					DebugTimer.end(stackTrace);*/
        }

    };

    suP.addEventCallback = function (eventType, relevantContext, callback, runCallbackNow) {
        // set default parameter value
        if (runCallbackNow === null || runCallbackNow === undefined) {
            runCallbackNow = false;
        }
        var cc = this.eventManager.callbackCollections[eventType];
        if (cc !== null && cc !== undefined) {
            cc.addImmediateCallback(relevantContext, callback, runCallbackNow);
        } else {
            console.log("(StageUtils) Unsupported event: ", eventType);
        }
    };

    suP.startTask = function (relevantContext, iterativeTask, priority, finalCallback, description) {

        finalCallback = (finalCallback === undefined) ? null : finalCallback;
        description = (description === undefined) ? null : description;

        // do nothing if task already active
        if (WeaveAPI.ProgressIndicator.hasTask(iterativeTask))
            return;

        if (StageUtils.debug_async_time) {
            if (this._debugTaskTimes.get(iterativeTask))
                console.log('interrupted', (new Date().getTime()) - this._debugTaskTimes.get(iterativeTask)[0], priority, this._debugTaskTimes.get(iterativeTask)[1], this._debugTaskTimes.delete(iterativeTask));
            this._debugTaskTimes.set(iterativeTask, [(new Date().getTime()), weavecore.DebugUtils.getCompactStackTrace(new Error())]);
        }

        if (priority >= this._priorityCallLaterQueues.length) {
            console.error("Invalid priority value: " + priority);
            priority = WeaveAPI.TASK_PRIORITY_NORMAL;
        }

        if (StageUtils.debug_async_stack) {
            this._stackTraceMap.set(iterativeTask, debugId(iterativeTask) + ' ' + weavecore.DebugUtils.getCompactStackTrace(new Error("Stack trace")));
            this._taskStartTime.set(iterativeTask, (new Date().getTime()));
            this._taskElapsedTime.set(iterativeTask, 0);
        }
        WeaveAPI.ProgressIndicator.addTask(iterativeTask, relevantContext, description);

        var useTimeParameter = iterativeTask.length > 0;

        // Set relevantContext as null for callLater because we always want _iterateTask to be called later.
        // This makes sure that the task is removed when the actual context is disposed.
        this._nextCallLaterPriority = priority;
        this.callLater(null, _iterateTask.bind(this), [relevantContext, iterativeTask, priority, finalCallback, useTimeParameter]);
        //_iterateTask(relevantContext, iterativeTask, priority, finalCallback);


    }

    function getTimer() {
        return new Date().getTime();
    }

    function _iterateTask(context, task, priority, finalCallback, useTimeParameter) {
        // remove the task if the context was disposed
        if (WeaveAPI.SessionManager.objectWasDisposed(context)) {
            var arr = this._debugTaskTimes.get(task);
            if (StageUtils.debug_async_time && arr)
                console.log('disposed', (new Date().getTime()) - arr[0], priority, arr[1], this._debugTaskTimes.delete(task));
            WeaveAPI.ProgressIndicator.removeTask(task);
            return;
        }

        var debug_time = StageUtils.debug_async_stack ? (new Date().getTime()) : -1;
        var stackTrace = StageUtils.debug_async_stack ? this._stackTraceMap.get(task) : null;

        var progress = undefined;
        // iterate on the task until _currentTaskStopTime is reached
        var time;
        while ((time = getTimer()) <= this._currentTaskStopTime) {
            // perform the next iteration of the task
            if (useTimeParameter)
                progress = task(this._currentTaskStopTime);
            else
                progress = task();

            if (progress === null || isNaN(progress) || progress < 0 || progress > 1) {
                console.error("Received unexpected result from iterative task (" + progress + ").  Expecting a number between 0 and 1.  Task cancelled.");
                if (StageUtils.debug_async_stack) {
                    console.log(stackTrace);
                    // this is incorrect behavior, but we can put a breakpoint here
                    if (useTimeParameter)
                        progress = task(this._currentTaskStopTime);
                    else
                        progress = task();
                }
                progress = 1;
            }
            if (StageUtils.debug_async_stack && this.currentFrameElapsedTime > 3000) {
                console.log(getTimer() - time, stackTrace);
                // this is incorrect behavior, but we can put a breakpoint here
                if (useTimeParameter)
                    progress = task(this._currentTaskStopTime);
                else
                    progress = task();
            }
            if (progress === 1) {
                var arr = this._debugTaskTimes.get(task);
                if (StageUtils.debug_async_time && arr)
                    trace('completed', getTimer() - arr[0], priority, arr[1], this._debugTaskTimes.delete(task));
                // task is done, so remove the task
                WeaveAPI.ProgressIndicator.removeTask(task);
                // run final callback after task completes and is removed
                if (finalCallback !== null)
                    context ? finalCallback.call(context) : finalCallback(); // to avoid this error in the finalcallback
                return;
            }

            // If the time parameter is accepted, only call the task once in succession.
            if (useTimeParameter)
                break;

            if (debug_delayTasks)
                break;
        }
        if (false && StageUtils.debug_async_stack) {
            var start = Number(this._taskStartTime.get(task));
            var elapsed = Number(this._taskElapsedTime.get(task)) + (time - debug_time);
            this._taskElapsedTime.set(task, elapsed);
            console.log(elapsed, '/', (time - start), '=', weavecore.StandardLib.roundSignificant(elapsed / (time - start), 2), stackTrace);
        }

        // max computation time reached without finishing the task, so update the progress indicator and continue the task later
        if (progress !== undefined)
            WeaveAPI.ProgressIndicator.updateTask(task, progress);

        // Set relevantContext as null for callLater because we always want _iterateTask to be called later.
        // This makes sure that the task is removed when the actual context is disposed.
        this._nextCallLaterPriority = priority;
        this.callLater(null, _iterateTask.bind(this), arguments);
    }


    weavecore.StageUtils = StageUtils;
    WeaveAPI.StageUtils = new StageUtils();


    function EventManager() {
        Object.defineProperty(this, 'callbackCollections', {
            value: {}
        });
        this.userActivity = 0; // greater than 0 when there was user activity since the last frame.
        this.event = null;
        this.eventTime = 0;
        this.shiftKey = false;
        this.altKey = false;
        this.ctrlKey = false;
        this.mouseButtonDown = false;

        this.currentFrameStartTime = new Date().getTime(); // this is the result of getTimer() on the last ENTER_FRAME event.
        this.previousFrameElapsedTime = 0; // this is the amount of time it took to process the previous frame.
        this.pointClicked = false;
        this.deactivated = true; // true when application is deactivated
        this.useDeactivatedFrameRate = false;

        this.triggeredThrottledMouseThisFrame = false; // set to false on enterFrame, set to true on throttled mouse move
        this.nextThrottledMouseMoveTime = 0; // time threshold before triggering throttled mouse move again
        this.throttledMouseMoveInterval = 100; // time threshold before triggering throttled mouse move again

        // create a new callback collection for each type of event
        for (var j = 0; j < EventCallbackCollection.eventTypes.length; j++) {
            var type = EventCallbackCollection.eventTypes[j];
            this.callbackCollections[type] = new EventCallbackCollection(this, type);
            // this.callbackCollections[type] = WeaveAPI.SessionManager.registerDisposableChild(WeaveAPI.globalHashMap, new EventCallbackCollection(this, type));
        }

        //add event listeners
        for (var eventtype in this.callbackCollections) {
            this.callbackCollections[eventtype].listenToStage();
        }
        this.event;
    }


    weavecore.EventManager = EventManager;



}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}
/**
 * LinkableVariable allows callbacks to be added that will be called when the value changes.
 * A LinkableVariable has an optional type restriction on the values it holds.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableVariable, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableVariable, 'CLASS_NAME', {
        value: 'LinkableVariable'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableVariable, 'SESSIONABLE', {
        value: true
    });

    /**
     * If a defaultValue is specified, callbacks will be triggered in a later frame unless they have already been triggered before then.
     * This behavior is desirable because it allows the initial value to be handled by the same callbacks that handles new values.
     * @param sessionStateType The type of values accepted for this sessioned property.
     * @param verifier A function that returns true or false to verify that a value is accepted as a session state or not.  The function signature should be  function(value:*):Boolean.
     * @param defaultValue The default value for the session state.
     * @param defaultValueTriggersCallbacks Set this to false if you do not want the callbacks to be triggered one frame later after setting the default value.
     */

    function LinkableVariable(sessionStateType, verifier, defaultValue, defaultValueTriggersCallbacks) {
        if (sessionStateType === undefined) sessionStateType = null;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;

        weavecore.CallbackCollection.call(this);

        /**
         * This function is used to prevent the session state from having unwanted values.
         * Function signature should be  function(value:*):Boolean
         * @private
         * @property _verifier
         * @type function
         */
        this._verifier = verifier;

        /**
         * This is true if the session state has been set at least once.
         */
        this._sessionStateWasSet = false;

        /**
         * This is true if the _sessionStateType is a primitive type.
         */
        this._primitiveType = false;

        /**
         * Type restriction passed in to the constructor.
         */
        this._sessionStateType = null;

        /**
         * Cannot be modified externally because it is not returned by getSessionState()
         */
        this._sessionStateInternal = undefined;

        /**
         * Available externally via getSessionState()
         */
        this._sessionStateExternal = undefined;

        this._locked = false;

        Object.defineProperty(this, 'locked', {
            get: function () {
                return this._locked;
            }
        });

        if (sessionStateType !== Object) {
            this._sessionStateType = sessionStateType;
            this._primitiveType = this._sessionStateType === "string" || this._sessionStateType === "number" || this._sessionStateType === "boolean";
        }
        if (defaultValue !== undefined) {
            this.setSessionState(defaultValue);

            // If callbacks were triggered, make sure callbacks are triggered again one frame later when
            // it is possible for other classes to have a pointer to this object and retrieve the value.
            if (defaultValueTriggersCallbacks && this._triggerCounter > weavecore.CallbackCollection.DEFAULT_TRIGGER_COUNT)
                WeaveAPI.StageUtils.callLater(this, _defaultValueTrigger.bind(this));
        }


    }

    function _defaultValueTrigger() {
        // unless callbacks were triggered again since the default value was set, trigger callbacks now
        if (!this._wasDisposed && this._triggerCounter === weavecore.CallbackCollection.DEFAULT_TRIGGER_COUNT + 1)
            this.triggerCallbacks();

    }

    /**
     * This function will verify if a given value is a valid session state for this linkable variable.
     * @param value The value to verify.
     * @return A value of true if the value is accepted by this linkable variable.
     */
    function verifyValue(value) {
        return this._verifier === null || this._verifier === undefined || this._verifier(value);
    }

    LinkableVariable.prototype = new weavecore.CallbackCollection();
    LinkableVariable.prototype.constructor = LinkableVariable;

    var p = LinkableVariable.prototype;

    /**
     * The type restriction passed in to the constructor.
     */
    p.getSessionStateType = function () {
        return this._sessionStateType;
    };

    p.getSessionState = function () {
        return this._sessionStateExternal;
    };

    p.setSessionState = function (value) {
        if (this._locked)
            return;

        // cast value now in case it is not the appropriate type
        if (this._sessionStateType !== null && this._sessionStateType !== undefined)
            value = value;

        // stop if verifier says it's not an accepted value
        if (this._verifier !== null && this._verifier !== undefined && !this._verifier(value))
            return;

        var wasCopied = false;
        var type = null;
        if (value !== null && value !== undefined) {
            type = typeof (value);

            if (type === 'object' && value.constructor !== Object && value.constructor !== Array) {
                // convert to dynamic Object prior to sessionStateEquals comparison
                value = Object.create(value);
                wasCopied = true;
            }
        }

        // If this is the first time we are calling setSessionState(), including
        // from the constructor, don't bother checking sessionStateEquals().
        // Otherwise, stop if the value did not change.
        if (this._sessionStateWasSet && this.sessionStateEquals(value))
            return;

        // If the value is a dynamic object, save a copy because we don't want
        // two LinkableVariables to share the same object as their session state.
        if (type === 'object') {
            if (!wasCopied) {
                if (value.constructor === Array) //TODO:Temp solution for array copy - its a shallow copy now
                    value = Object.getPrototypeOf(Object.create(value)).slice(0);
                else
                    value = Object.create(value);
            }

            weavecore.DynamicState.alterSessionStateToBypassDiff(value);


            // save external copy, accessible via getSessionState()
            this._sessionStateExternal = value;

            // save internal copy
            if (value.constructor === Array) // TODO:Temp solution for array copy - its a shallow copy now
                this._sessionStateInternal = Object.getPrototypeOf(Object.create(value)).slice(0);
            else
                this._sessionStateInternal = Object.create(value);

        } else {
            // save primitive value
            this._sessionStateExternal = this._sessionStateInternal = value;
        }

        // remember that we have set the session state at least once.
        this._sessionStateWasSet = true;

        this.triggerCallbacks();
    };

    /**
     * This function is used in setSessionState() to determine if the value has changed or not.
     * object that prototype this object may override this function.
     */
    p.sessionStateEquals = function (otherSessionState) {
        if (this._primitiveType)
            return this._sessionStateInternal === otherSessionState;

        return weavecore.StandardLib.compare(this._sessionStateInternal, otherSessionState, objectCompare.bind(this)) === 0;
    };

    function objectCompare(a, b) {
        if (weavecore.DynamicState.isDynamicState(a, true) && weavecore.DynamicState.isDynamicState(b, true) && a[weavecore.DynamicState.CLASS_NAME] === b[weavecore.DynamicState.CLASS_NAME] && a[weavecore.DynamicState.OBJECT_NAME] === b[weavecore.DynamicState.OBJECT_NAME]) {
            return weavecore.StandardLib.compare(a[weavecore.DynamicState.SESSION_STATE], b[weavecore.DynamicState.SESSION_STATE], objectCompare);
        }

    }


    /**
     * This function may be called to detect change to a non-primitive session state in case it has been modified externally.
     */
    p.detectChanges = function () {
        if (!this.sessionStateEquals(this._sessionStateExternal))
            this.triggerCallbacks();
    };

    p.lock = function () {
        this._locked = true;
    };





    p.dispose = function () {
        weavecore.CallbackCollection.prototype.dispose.call(this);
        this.setSessionState(null);
    };

    weavecore.LinkableVariable = LinkableVariable;
    weavecore.ClassUtils.registerClass('weavecore.LinkableVariable', LinkableVariable);

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'CLASS_NAME', {
        value: 'UntypedLinkableVariable'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(UntypedLinkableVariable, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This is a LinkableVariable that adds "get value" and "set value" functions for untyped values.
     * @class UntypedLinkableVariable
     * @constructor
     */
    function UntypedLinkableVariable(defaultValue, verifier, defaultValueTriggersCallbacks) {
        if (defaultValue === undefined) defaultValue = null;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;
        weavecore.LinkableVariable.call(this, null, verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);
        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (value) {
                this.setSessionState(value);
            }
        });


    }

    UntypedLinkableVariable.prototype = new weavecore.LinkableVariable();
    UntypedLinkableVariable.prototype.constructor = UntypedLinkableVariable;

    var p = UntypedLinkableVariable.prototype;

    weavecore.UntypedLinkableVariable = UntypedLinkableVariable;
    weavecore.ClassUtils.registerClass('weavecore.UntypedLinkableVariable', UntypedLinkableVariable);

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Number values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableNumber, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableNumber, 'CLASS_NAME', {
        value: 'LinkableNumber'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableNumber, 'SESSIONABLE', {
        value: true
    });

    function LinkableNumber(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters
        if (defaultValue === undefined) defaultValue = NaN;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;

        // Note: Calling  weavecore.LinkableVariable.call() will set all the default values for member variables defined in the super class,
        // which means we can't set _sessionStateInternal = NaN here.
        weavecore.LinkableVariable.call(this, "number", verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (val) {
                this.setSessionState(val);
            }
        });

    }

    LinkableNumber.prototype = new weavecore.LinkableVariable();
    LinkableNumber.prototype.constructor = LinkableNumber;

    var p = LinkableNumber.prototype;

    // override is important to avoid sending undefiend value
    // getSessionState usally called from Sessionmanager, main purpose is to create log entries..
    p.getSessionState = function () {
        // this make sure Number(undefined) will return NaN.
        return Number(this._sessionStateExternal)

    };

    p.setSessionState = function (val) {
        if (typeof (val) != "number") {
            if (val === null || val === '' || val === undefined) val = NaN;
            else val = Number(val);
        }
        weavecore.LinkableVariable.prototype.setSessionState.call(this, val);
    };

    p.sessionStateEquals = function (otherSessionState) {
        // We must check for null here because we can't set _sessionStateInternal = NaN in the constructor.
        if (this._sessionStateInternal === null || this._sessionStateInternal === undefined)
            this._sessionStateInternal = this._sessionStateExternal = NaN;
        if (isNaN(this._sessionStateInternal) && isNaN(otherSessionState))
            return true;
        return this._sessionStateInternal === otherSessionState;
    };

    weavecore.LinkableNumber = LinkableNumber;
    weavecore.ClassUtils.registerClass('weavecore.LinkableNumber', LinkableNumber);

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Boolean values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableBoolean, 'NS', {
        value: 'weavecore'
    });


    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableBoolean, 'CLASS_NAME', {
        value: 'LinkableBoolean'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableBoolean, 'SESSIONABLE', {
        value: true
    });

    function LinkableBoolean(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;

        weavecore.LinkableVariable.call(this, "boolean", verifier, defaultValue, defaultValueTriggersCallbacks);

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (val) {
                this.setSessionState(val);
            }
        });

    }

    LinkableBoolean.prototype = new weavecore.LinkableVariable();
    LinkableBoolean.prototype.constructor = LinkableBoolean;

    var p = LinkableBoolean.prototype;


    p.setSessionState = function (val) {
        if (typeof (val) === "string") {
            val = weavecore.ObjectUtil.stringCompare(val, "true", true) === 0;
        }
        weavecore.LinkableVariable.prototype.setSessionState.call(this, val ? true : false);
    };

    weavecore.LinkableBoolean = LinkableBoolean;
    weavecore.ClassUtils.registerClass('weavecore.LinkableBoolean', LinkableBoolean);

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to string values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableString, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableString, 'CLASS_NAME', {
        value: 'LinkableString'
    });


    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableString, 'SESSIONABLE', {
        value: true
    });

    function LinkableString(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters

        if (defaultValue === undefined) defaultValue = null;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;


        weavecore.LinkableVariable.call(this, "string", verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (val) {
                this.setSessionState(val);
            }
        });

    }

    LinkableString.prototype = new weavecore.LinkableVariable();
    LinkableString.prototype.constructor = LinkableString;

    var p = LinkableString.prototype;

    p.setSessionState = function (val) {
        if (val !== null)
            val = String(val);
        weavecore.LinkableVariable.prototype.setSessionState.call(this, val);
    };

    weavecore.LinkableString = LinkableString;
    weavecore.ClassUtils.registerClass('weavecore.LinkableString', LinkableString);

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ChildListCallbackInterface, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ChildListCallbackInterface, 'CLASS_NAME', {
        value: 'ChildListCallbackInterface'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ChildListCallbackInterface, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * Private Class for use with {{#crossLink "LinkableHashMap"}}{{/crossLink}}
     * @class ChildListCallbackInterface
     * @extends CallbackCollection
     * @private
     * @constructor
     */
    function ChildListCallbackInterface() {

        // specify the preCallback function in super() so list callback
        // variables will be set before each change callback.
        weavecore.CallbackCollection.call(this, this._setCallbackVariables);
        /**
         * returned by public getter
         * @private
         * @property _lastNameAdded
         * @default null
         * @type String
         **/
        this._lastNameAdded = null;
        /**
         * returned by public getter
         * @private
         * @property _lastObjectAdded
         * @default null
         * @type ILinkableObject
         **/
        this._lastObjectAdded = null;
        /**
         * returned by public getter
         * @private
         * @property _lastNameRemoved
         * @default null
         * @type String
         **/
        this._lastNameRemoved = null;
        /**
         * returned by public getter
         * @private
         * @property _lastObjectRemoved
         * @default null
         * @type ILinkableObject
         **/
        this._lastObjectRemoved = null;

        /**
         * This is the name of the object that was added prior to running callbacks.
         * @public
         * @property lastNameAdded
         * @readOnly
         * @type String
         */
        Object.defineProperty(this, 'lastNameAdded', {
            get: function () {
                return this._lastNameAdded;
            }
        });

        /**
         * This is the object that was added prior to running callbacks.
         * @public
         * @property lastObjectAdded
         * @readOnly
         * @type ILinkableObject
         */
        Object.defineProperty(this, 'lastObjectAdded', {
            get: function () {
                return this._lastObjectAdded;
            }
        });

        /**
         * This is the name of the object that was removed prior to running callbacks.
         * @public
         * @property lastNameRemoved
         * @readOnly
         * @type String
         */
        Object.defineProperty(this, 'lastNameRemoved', {
            get: function () {
                return this._lastNameRemoved;
            }
        });

        /**
         * This is the object that was removed prior to running callbacks.
         * @public
         * @property lastObjectRemoved
         * @readOnly
         * @type ILinkableObject
         */
        Object.defineProperty(this, 'lastObjectRemoved', {
            get: function () {
                return this._lastObjectRemoved;
            }
        });

    }

    ChildListCallbackInterface.prototype = new weavecore.CallbackCollection();
    ChildListCallbackInterface.prototype.constructor = ChildListCallbackInterface;

    var p = ChildListCallbackInterface.prototype;
    /**
     * This function will set the list callback variables:
     *     lastNameAdded, lastObjectAdded, lastNameRemoved, lastObjectRemoved, childListChanged
     * @method _setCallbackVariables
     * @private
     * @param {String} name This is the name of the object that was just added or removed from the hash map.
     * @param {ILinkableObject} objectAdded This is the object that was just added to the hash map.
     * @param {ILinkableObject} objectRemoved This is the object that was just removed from the hash map.
     */
    p._setCallbackVariables = function (name, objectAdded, objectRemoved) {
        this._lastNameAdded = objectAdded ? name : null;
        this._lastObjectAdded = objectAdded;
        this._lastNameRemoved = objectRemoved ? name : null;
        this._lastObjectRemoved = objectRemoved;
    };

    /**
     * This function will run callbacks immediately, setting the list callback variables before each one.
     * @method runCallbacks
     * @param {String} name
     * @param {ILinkableObject} objectAdded
     * @param {ILinkableObject} objectRemoved
     */
    p.runCallbacks = function (name, objectAdded, objectRemoved) {
        // remember previous values
        var _name = this._lastNameAdded || this._lastNameRemoved;
        var _added = this._lastObjectAdded;
        var _removed = this._lastObjectRemoved;

        this._runCallbacksImmediately(name, objectAdded, objectRemoved);

        // restore previous values (in case an external JavaScript popup caused us to interrupt something else)
        this._setCallbackVariables.call(this, _name, _added, _removed);
    };



    weavecore.ChildListCallbackInterface = ChildListCallbackInterface;
    weavecore.ClassUtils.registerClass('weavecore.ChildListCallbackInterface', ChildListCallbackInterface);

}());

if (typeof window === 'undefined') {
    this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Number values.
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ProgressIndicator, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ProgressIndicator, 'CLASS_NAME', {
        value: 'ProgressIndicator'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ProgressIndicator, 'SESSIONABLE', {
        value: true
    });


    Object.defineProperty(ProgressIndicator, 'debug', {
        value: false
    });

    function ProgressIndicator() {

        weavecore.ILinkableObject.call(this);

        this._taskCount = 0;
        this._maxTaskCount = 0;
        Object.defineProperties(this, {
            '_progress': {
                value: new Map()
            },
            '_description': {
                value: new Map()
            },
            '_stackTrace': {
                value: new Map()
            }
        });

    }

    ProgressIndicator.prototype = new weavecore.ILinkableObject();
    ProgressIndicator.prototype.constructor = ProgressIndicator;

    var p = ProgressIndicator.prototype;

    /**
     * For debugging, returns debugIds for active tasks.
     */
    p.debugTasks = function () {
        var result = [];
        this._progress.forEach(function (value, task) {
            result.push(WeaveAPI.debugId(task));
        }, this._progress);

        return result;
    }

    p.getDescriptions = function () {
        var result = [];
        this._progress.forEach(function (value, task) {
            var desc = this._description.get(task) || "Unnamed task";
            if (desc)
                result.push(WeaveAPI.debugId(task) + " (" + (100 * this._progress.get(task)) + "%) " + desc);

        }, this._progress);

        WeaveAPI.StandardLib.sort(result);
        return result;
    }


    /**
     * @inheritDoc
     */
    p.getTaskCount = function () {
        return this._taskCount;
    }

    /**
     * @inheritDoc
     */
    p.addTask = function (taskToken, busyObject, description) {
        busyObject = (busyObject === undefined) ? null : busyObject;
        description = (description === undefined) ? null : description;

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();

        if (taskToken instanceof weavecore.CustomPromise && this._progress.get(taskToken) === undefined)
            taskToken.addResponder({
                result: handleAsyncToken.bind(this),
                fault: handleAsyncToken.bind(this),
                token: taskToken
            });

        this._description.set(taskToken, description);

        // add task before WeaveAPI.SessionManager.assignBusyTask()
        this.updateTask(taskToken, NaN); // NaN is used as a special case when adding the task

        if (busyObject)
            WeaveAPI.SessionManager.assignBusyTask(taskToken, busyObject);

        cc.resumeCallbacks();
    }

    function handleAsyncToken(response, token) {
        this.removeTask(token);
    }

    /**
     * @inheritDoc
     */
    p.hasTask = function (taskToken) {
        return this._progress.get(taskToken) !== undefined;
    }

    /**
     * @inheritDoc
     */
    p.updateTask = function (taskToken, progress) {
        // if this token isn't in the Dictionary yet, increase count
        if (this._progress.get(taskToken) === undefined) {
            // expecting NaN from addTask()
            if (!isNaN(progress))
                console.error("updateTask() called, but task was not previously added with addTask()");
            if (ProgressIndicator.debug)
                this._stackTrace.set(taskToken, new Error("Stack trace").getStackTrace());

            // increase count when new task is added
            this._taskCount++;
            this._maxTaskCount++;
        }

        if (this._progress.get(taskToken) !== progress) {
            this._progress.set(taskToken, progress);
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        }
    }

    /**
     * @inheritDoc
     */
    p.removeTask = function (taskToken) {
        // if the token isn't in the dictionary, do nothing
        if (this._progress.get(taskToken) === undefined)
            return;

        var stackTrace = this._stackTrace.get(taskToken); // check this when debugging

        this._progress.delete(taskToken);
        this._description.delete(taskToken);
        this._stackTrace.delete(taskToken);
        this._taskCount--;
        // reset max count when count drops to 1
        if (this._taskCount == 1)
            this._maxTaskCount = this._taskCount;

        WeaveAPI.SessionManager.unassignBusyTask(taskToken);

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    /**
     * @inheritDoc
     */
    p.getNormalizedProgress = function () {
        // add up the percentages
        var sum = 0;
        this._progress.forEach(function (value, task) {
            var stackTrace = this._stackTrace.get(task); // check this when debugging
            var progress = this._progress.get(task);
            if (isFinite(progress))
                sum += progress;
        }, this._progress);

        // make any pending requests that no longer exist count as 100% done
        sum += _maxTaskCount - _taskCount;
        // divide by the max count to get overall percentage
        return sum / _maxTaskCount;
    }

    weavecore.ProgressIndicator = ProgressIndicator;
    weavecore.ClassUtils.registerClass('weavecore.ProgressIndicator', ProgressIndicator);
    WeaveAPI.ProgressIndicator = new ProgressIndicator();

}());

/**
 * @module weavecore
 */

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'CLASS_NAME', {
        value: 'LinkableWatcher'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This is used to dynamically attach a set of callbacks to different targets.
     * The callbacks of the LinkableWatcher will be triggered automatically when the
     * target triggers callbacks, changes, becomes null or is disposed.
     * Instead of calling this constructor directly, consider using one of the {{#crossLink "SessionManager"}}{{/crossLink}} functions
     * {{#crossLink "SessionManager/registerLinkableChild:method"}}{{/crossLink}} or  {{#crossLink "SessionManager/registerDisposableChild:method"}}{{/crossLink}} to make sure the watcher will get disposed automatically.
     * @class LinkableWatcher
     * @extends ILinkableObject
     * @constructor
     * @param {Class} typeRestriction Optionally restricts which type of targets this watcher accepts.
     * @param {Function} immediateCallback A function to add as an immediate callback.
     * @param {Function} groupedCallback A function to add as a grouped callback.
     */
    function LinkableWatcher(typeRestriction, immediateCallback, groupedCallback) {
        if (typeRestriction === undefined) typeRestriction = null;
        if (immediateCallback === undefined) immediateCallback = null;
        if (groupedCallback === undefined) groupedCallback = null;

        weavecore.ILinkableObject.call(this);

        this._typeRestriction = typeRestriction;

        if (immediateCallback !== null && immediateCallback !== undefined)
            WeaveAPI.SessionManager.getCallbackCollection(this).addImmediateCallback(null, immediateCallback);

        if (groupedCallback !== null && groupedCallback !== undefined)
            WeaveAPI.SessionManager.getCallbackCollection(this).addGroupedCallback(null, groupedCallback);

        this._target; // the current target or ancestor of the to-be-target
        this._foundTarget = true; // false when _target is not the desired target
        this._targetPath; // the path that is being watched
        this._pathDependencies = new weavecore.Dictionary2D(true, false); // Maps an ILinkableDynamicObject to its previous internalObject.

        Object.defineProperty(this, 'targetPath', {
            /**
             * This is the path that is currently being watched for linkable object targets.
             */
            get: function () {
                return this._targetPath ? this._targetPath.concat() : null;
            },
            /**
             * This will set a path which should be watched for new targets.
             * Callbacks will be triggered immediately if the path changes or points to a new target.
             */
            set: function (path) {
                // do not allow watching the globalHashMap
                if (path && path.length === 0)
                    path = null;
                if (weavecore.StandardLib.compare(this._targetPath, path) !== 0) {
                    var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
                    cc.delayCallbacks();

                    resetPathDependencies.call(this);
                    this._targetPath = path;
                    handlePath.call(this);
                    cc.triggerCallbacks.call(cc);

                    cc.resumeCallbacks.call(cc);
                }
            },
            configurable: true
        });

        Object.defineProperty(this, 'target', {
            /**
             * This is the linkable object currently being watched.
             * Setting this will unset the targetPath.
             */
            get: function () {
                return this._foundTarget ? this._target : null;
            },
            set: function (newTarget) {
                var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
                cc.delayCallbacks();
                this.targetPath = null;
                this.internalSetTarget(newTarget);
                cc.resumeCallbacks();
            },
            configurable: true
        });

    }

    LinkableWatcher.prototype = new weavecore.ILinkableObject();
    LinkableWatcher.prototype.constructor = LinkableWatcher;

    var p = LinkableWatcher.prototype;

    /**
     * This sets the new target to be watched without resetting targetPath.
     * Callbacks will be triggered immediately if the new target is different from the old one.
     */
    p.internalSetTarget = function (newTarget) {
        if (this._foundTarget && this._typeRestriction)
            newTarget = (newTarget && weavecore.ClassUitls.is(newTarget, this._typeRestriction)) ? newTarget : null;

        // do nothing if the targets are the same.
        if (this._target === newTarget)
            return;

        var sm = WeaveAPI.SessionManager;

        // unlink from old target
        if (this._target) {
            sm.getCallbackCollection(this._target).removeCallback(handleTargetTrigger.bind(this));
            sm.getCallbackCollection(this._target).removeCallback(handleTargetDispose.bind(this));
            // if we own the previous target, dispose it
            if (sm.getLinkableOwner(this._target) === this)
                sm.disposeObject(this._target);
            else
                sm.unregisterLinkableChild(this, this._target);
        }

        this._target = newTarget;

        // link to new target
        if (this._target) {
            // we want to register the target as a linkable child (for busy status)
            sm.registerLinkableChild(this, this._target);
            // we don't want the target triggering our callbacks directly
            sm.getCallbackCollection(this._target).removeCallback(sm.getCallbackCollection(this).triggerCallbacks);
            sm.getCallbackCollection(this._target).addImmediateCallback(this, handleTargetTrigger.bind(this), false, true);
            // we need to know when the target is disposed
            sm.getCallbackCollection(this._target).addDisposeCallback(this, handleTargetDispose.bind(this));
        }

        if (this._foundTarget)
            handleTargetTrigger.call(this);
    };


    function handleTargetTrigger() {
        if (this._foundTarget) {
            var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
            cc.triggerCallbacks.call(cc);
        } else
            handlePath.call(this);
    };



    function handleTargetDispose() {
        if (this._targetPath) {
            handlePath.call(this);
        } else {
            this._target = null;
            var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
            cc.triggerCallbacks.call(cc);

        }
    };

    function handlePath() {
        if (!this._targetPath) {
            this._foundTarget = true;
            this.internalSetTarget(null);
            return;
        }

        // traverse the path, finding ILinkableDynamicObject path dependencies along the way
        var sm = WeaveAPI.SessionManager;
        var node = WeaveAPI.globalHashMap;
        var subPath = [];
        for (var name of this._targetPath) {
            if (weavecore.ClassUtils.is(node, weavecore.ILinkableCompositeObject))
                addPathDependency.call(this, node, name);

            subPath[0] = name;
            var child = sm.getObject(node, subPath);
            if (child) {
                node = child;
            } else {
                // the path points to an object that doesn't exist yet
                if (node instanceof weavecore.LinkableHashMap) {
                    // watching childListCallbacks instead of the hash map accomplishes two things:
                    // 1. eliminate unnecessary calls to _handlePath()
                    // 2. avoid watching the root hash map (and registering the root as a child of the watcher)
                    node = node.childListCallbacks;
                }
                if (node instanceof weavecore.LinkableDynamicObject) {
                    // path dependency code will detect changes to this node, so we don't need to set the target
                    node = null;
                }
                var lostTarget = this._foundTarget;
                this._foundTarget = false;

                this.internalSetTarget(node);

                // must trigger here when we lose the target because internalSetTarget() won't trigger when _foundTarget is false
                if (lostTarget) {
                    var cc = sm.getCallbackCollection(this)
                    cc.triggerCallbacks.call(cc);
                }

                return;
            }
        }

        // we found a desired target if there is no type restriction or the object fits the restriction
        this._foundTarget = !this._typeRestriction || node instanceof this._typeRestriction;
        this.internalSetTarget(node);
    };

    function addPathDependency(parent, pathElement) {
        // if parent is an ILinkableHashMap and pathElement is a String, we don't need to add the dependency
        var lhm = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (lhm && typeof pathElement === "string")
            return;

        var ldo = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        if (ldo)
            pathElement = null;

        if (!this._pathDependencies.get(parent, pathElement)) {
            var child = WeaveAPI.SessionManager.getObject(parent, [pathElement]);
            this._pathDependencies.set(parent, pathElement, child);
            var dependencyCallbacks = getDependencyCallbacks(parent);
            dependencyCallbacks.addImmediateCallback(this, handlePathDependencies.bind(this));
            dependencyCallbacks.addDisposeCallback(this, handlePathDependencies.bind(this));
        }

    };

    function getDependencyCallbacks(parent) {
        var lhm = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (lhm)
            return lhm.childListCallbacks;
        return WeaveAPI.SessionManager.getCallbackCollection(parent);
    }


    function handlePathDependencies() {
        var sm = WeaveAPI.SessionManager;
        for (var parent of this._pathDependencies.dictionary.keys()) {
            for (var pathElement of this._pathDependencies.dictionary.get(parent).keys()) {
                var oldChild = this._pathDependencies.get(parent, pathElement);
                var newChild = sm.getObject(parent, [pathElement]);
                if (sm.objectWasDisposed(parent) || oldChild !== newChild) {
                    resetPathDependencies.call(this);
                    handlePath.call(this);
                    return;
                }
            }
        }

    };

    function resetPathDependencies() {
        for (var parent of this._pathDependencies.dictionary.keys())
            getDependencyCallbacks(parent).removeCallback(handlePathDependencies);
        this._pathDependencies = new weavecore.Dictionary2D(true, false);
    };


    p.dispose = function () {
        this._targetPath = null;
        this._target = null;
        // everything else will be cleaned up automatically
    };

    weavecore.LinkableWatcher = LinkableWatcher;
    weavecore.ClassUtils.registerClass('weavecore.LinkableWatcher', LinkableWatcher);

    /*
			// JavaScript test code for path dependency case
			var lhm = weave.path('lhm').remove().request('LinkableHashMap');
			
			var a = lhm.push('a').request('LinkableDynamicObject').state(lhm.getPath('b', null));
			
			a.addCallback(function () {
			if (a.getType(null))
			console.log('a.getState(null): ', JSON.stringify(a.getState(null)));
			else
			console.log('a has no internal object');
			}, false, true);
			
			var b = lhm.push('b').request('LinkableDynamicObject').state(lhm.getPath('c'));
			
			// a has no internal object
			
			var c = lhm.push('c').request('LinkableDynamicObject').request(null, 'LinkableString').state(null, 'c value');
			
			// a.getState(null): []
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":null}]
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":"c value"}]
			
			b.remove(null);
			
			// a has no internal object
			
			b.request(null, 'LinkableString').state(null, 'b value');
			
			// a.getState(null): null
			// a.getState(null): "b value"
		*/
}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableHashMap, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableHashMap, 'CLASS_NAME', {
        value: 'LinkableHashMap'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableHashMap, 'SESSIONABLE', {
        value: true
    });


    // constructor:
    /**
     * Allows dynamically creating instances of objects inheriting ILinkableObject at runtime.
     * The session state is an Array of {{#crossLink "DynamicState"}}{{/crossLink}} objects.
     * @class LinkableHashMap
     * @extends CallbackCollection
     * @constructor
     * @param {Class} typeRestriction If specified, this will limit the type of objects that can be added to this LinkableHashMap.
     */
    function LinkableHashMap(typeRestriction) {
        if (typeRestriction === undefined) typeRestriction = null;

        weavecore.CallbackCollection.call(this);

        /**
         * restricts the type of object that can be stored
         * @private
         * @property _typeRestriction
         * @type Class
         */
        this._typeRestriction;
        /**
         * qualified class name of _typeRestriction
         * @private
         * @property _typeRestrictionClassName
         * @type String
         */
        this._typeRestrictionClassName;

        if (typeRestriction !== null && typeRestriction !== undefined) {
            this._typeRestriction = typeRestriction;
            this._typeRestrictionClassName = typeRestriction.name;
        }

        /**
         * @private
         * @readOnly
         * @property _childListCallbacks
         * @type ChildListCallbackInterface
         */
        Object.defineProperty(this, '_childListCallbacks', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.ChildListCallbackInterface())
        });

        /**
         * an ordered list of names appearing in _nameToObjectMap
         * @private
         * @readOnly
         * @property _orderedNames
         * @type Array
         */
        Object.defineProperty(this, '_orderedNames', {
            value: []
        });

        /**
         * maps an identifying name to an object
         * @private
         * @readOnly
         * @property _nameToObjectMap
         * @type Object
         */
        Object.defineProperty(this, '_nameToObjectMap', {
            value: {}
        });

        /**
         * maps an object to an identifying name
         * @private
         * @readOnly
         * @property _objectToNameMap
         * @type Map
         */
        Object.defineProperty(this, '_objectToNameMap', {
            value: new Map()
        });

        /**
         * maps an identifying name to a value of true if that name is locked.
         * @private
         * @readOnly
         * @property _nameIsLocked
         * @type Object
         */
        Object.defineProperty(this, '_nameIsLocked', {
            value: {}
        });

        /**
         * maps a previously used name to a value of true.  used when generating unique names.
         * @private
         * @readOnly
         * @property _previousNameMap
         * @type Object
         */
        Object.defineProperty(this, '_previousNameMap', {
            value: {}
        });

        /**
         * The child type restriction, or null if there is none.
         * @public
         * @readOnly
         * @property typeRestriction
         * @type Class
         */
        Object.defineProperty(this, 'typeRestriction', {
            get: function () {
                return this._typeRestriction;
            }
        });

        /**
         * This is an interface for adding and removing callbacks that will get triggered immediately
         * when the list of child objects changes.
         * @public
         * @readOnly
         * @property childListCallbacks
         * @type ChildListCallbackInterface
         */
        Object.defineProperty(this, 'childListCallbacks', {
            get: function () {
                return this._childListCallbacks;
            }
        });


    }

    LinkableHashMap.prototype = new weavecore.CallbackCollection();
    LinkableHashMap.prototype.constructor = LinkableHashMap;

    var p = LinkableHashMap.prototype;

    /**
     * This function returns an ordered list of names in the hash map.
     * @method getNames
     * @param {Class} filter If specified, names of objects that are not of this type will be filtered out.
     * @return {Array} A copy of the ordered list of names of objects contained in this LinkableHashMap.
     */
    p.getNames = function (filter) {
        // set default value for parameter
        if (filter === undefined) filter = null;
        var result = [];
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            if (filter === null || this._nameToObjectMap[name] instanceof filter)
                result.push(name);
        }
        return result;
    };

    /**
     * This function returns an ordered list of objects in the hash map.
     * @method getObjects
     * @param {Class} filter If specified, objects that are not of this type will be filtered out.
     * @return {Array} An ordered Array of objects that correspond to the names returned by getNames(filter).
     */
    p.getObjects = function (filter) {
        // set default value for parameter
        if (filter === undefined) filter = null;
        var result = [];
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            var object = this._nameToObjectMap[name];
            if (filter === null || filter === undefined || object instanceof filter)
                result.push(object);
        }
        return result;
    };

    /**
     * This function gets the object associated with the specified name.
     * @method getObject
     * @param {String} name The identifying name to associate with an object.
     * @return {ILinkableObject} The object associated with the given name.
     */
    p.getObject = function (name) {
        return this._nameToObjectMap[name];
    };

    /**
     * This function gets the name of the specified object in the hash map.
     * @getName
     * @param {ILinkableObject} object An object contained in this LinkableHashMap.
     * @return {String} The name associated with the object, or null if the object was not found.
     */
    p.getName = function (object) {
        return this._objectToNameMap.get(object);
    };

    /**
     * This will reorder the names returned by getNames().
     * Any names appearing in newOrder that do not appear in getNames() will be ignored.
     * Callbacks will be called if the new name order differs from the old order.
     * @method setNameOrder
     * @param {Array} newOrder The new desired ordering of names.
     */
    p.setNameOrder = function (newOrder) {
        var changeDetected = false;
        var name;
        var i;
        var originalNameCount = this._orderedNames.length; // remembers how many names existed before appending
        var haveSeen = {}; // to remember which names have been seen in newOrder
        // append each name in newOrder to the end of _orderedNames
        for (i = 0; i < newOrder.length; i++) {
            name = newOrder[i];
            // ignore bogus names and append each name only once.
            if (this._nameToObjectMap[name] === undefined || haveSeen[name] !== undefined)
                continue;
            haveSeen[name] = true; // remember that this name was appended to the end of the list
            this._orderedNames.push(name); // add this name to the end of the list
        }
        // Now compare the ordered appended items to the end of the original list.
        // If the order differs, set _nameOrderChanged to true.
        // Meanwhile, set old name entries to null so they will be removed in the next pass.
        var appendedCount = this._orderedNames.length - originalNameCount;
        for (i = 0; i < appendedCount; i++) {
            var newIndex = originalNameCount + i;
            var oldIndex = this._orderedNames.indexOf(this._orderedNames[newIndex]);
            if (newIndex - oldIndex !== appendedCount)
                changeDetected = true;
            this._orderedNames[oldIndex] = null;
        }
        // remove array items that have been set to null
        var out = 0;
        for (i = 0; i < this._orderedNames.length; i++)
            if (this._orderedNames[i] !== null && this._orderedNames[i] !== undefined)
                this._orderedNames[out++] = this._orderedNames[i];
        this._orderedNames.length = out;
        // if the name order changed, run child list callbacks
        if (changeDetected)
            this._childListCallbacks.runCallbacks(null, null, null);
    };

    /**
     * This function creates an object in the hash map if it doesn't already exist.
     * If there is an existing object associated with the specified name, it will be kept if it
     * is the specified type, or replaced with a new instance of the specified type if it is not.
     * @method requestObject
     * @param {String} name The identifying name of a new or existing object.
     * @param {Class} classDef The Class of the desired object type.
     * @param {Boolean} lockObject If this is true, the object will be locked in place under the specified name.
     * @return {Object} The object under the requested name of the requested type, or null if an error occurred.
     */
    p.requestObject = function (name, classDef, lockObject) {
        var className = classDef ? classDef.NS + '.' + (classDef.CLASS_NAME ? classDef.CLASS_NAME : classDef.name) : null;
        var result = this._initObjectByClassName.call(this, name, className, lockObject);
        return classDef ? result : null;
    };

    /**
     * This function will copy the session state of an ILinkableObject to a new object under the given name in this LinkableHashMap.
     * @method requestObjectCopy
     * @param {String} newName A name for the object to be initialized in this LinkableHashMap.
     * @param {ILinkableObject} objectToCopy An object to copy the session state from.
     * @return {ILinkableObject} The new object of the same type, or null if an error occurred.
     */
    p.requestObjectCopy = function (name, objectToCopy) {
        if (objectToCopy === null || objectToCopy === undefined) {
            this.removeObject(name);
            return null;
        }

        this.delayCallbacks(); // make sure callbacks only trigger once
        var classDef = objectToCopy.constructor; //ClassUtils.getClassDefinition(className);
        var sessionState = WeaveAPI.SessionManager.getSessionState(objectToCopy);
        //  if the name refers to the same object, remove the existing object so it can be replaced with a new one.
        if (name === this.getName(objectToCopy))
            this.removeObject(name);
        var object = requestObject(name, classDef, false);
        if (object !== null && object !== undefined)
            WeaveAPI.SessionManager.setSessionState(object, sessionState);
        this.resumeCallbacks();

        return object;
    };

    /**
     * This function will rename an object by making a copy and removing the original.
     * @method renameObject
     * @param {String} oldName The name of an object to replace.
     * @param {String} newName The new name to use for the copied object.
     * @return {ILinkableObject} The copied object associated with the new name, or the original object if newName is the same as oldName.
     */
    p.renameObject = function (oldName, newName) {
        if (oldName !== newName) {
            this.delayCallbacks();

            // prepare a name order that will put the new name in the same place the old name was
            var newNameOrder = this._orderedNames.concat();
            var index = newNameOrder.indexOf(oldName);
            if (index >= 0)
                newNameOrder.splice(index, 1, newName);

            this.requestObjectCopy(newName, getObject(oldName));
            this.removeObject(oldName);
            this.setNameOrder(newNameOrder);

            this.resumeCallbacks();
        }
        return this.getObject(newName);
    };

    /**
     * If there is an existing object associated with the specified name, it will be kept if it
     * is the specified type, or replaced with a new instance of the specified type if it is not.
     * @method _initObjectByClassName
     * @private
     * @param {String} name The identifying name of a new or existing object.  If this is null, a new one will be generated.
     * @param {String} className The qualified class name of the desired object type.
     * @param {Boolean} lockObject If this is set to true, lockObject() will be called on the given name.
     * @return {ILinkableObject} The object associated with the given name, or null if an error occurred.
     */
    p._initObjectByClassName = function (name, className, lockObject) {
        if (className) {
            // if no name is specified, generate a unique one now.
            if (!name)
                name = this.generateUniqueName(className);
            if (className !== "delete") // to-do Add Support for class Utils - delete is temp solution
            {
                // If this name is not associated with an object of the specified type,
                // associate the name with a new object of the specified type.
                console.log(className);
                var classDef = eval(className);
                //var classDef = window['weavecore'][className]; //TODO:remove hardcoded weavecore with namespace
                var object = this._nameToObjectMap[name];
                if (!object || object.constructor !== classDef)
                    this._createAndSaveNewObject.call(this, name, classDef, lockObject);
                else if (lockObject)
                    this._lockObject(name);

            } else {
                this.removeObject(name);
            }
        } else {
            this.removeObject(name);
        }
        return this._nameToObjectMap[name];
    };

    /**
     * @method _createAndSaveNewObject
     * @private
     * @param {String} name The identifying name to associate with a new object.
     * @param {Class} classDef The Class definition used to instantiate a new object.
     * @param {Boolean} lockObject If this is set to true, lockObject() will be called on the given name.
     */
    p._createAndSaveNewObject = function (name, classDef, lockObject) {
        if (this._nameIsLocked[name])
            return;

        // remove any object currently using this name
        this.removeObject(name);
        // create a new object
        var object = new classDef();
        // register the object as a child of this LinkableHashMap
        WeaveAPI.SessionManager.registerLinkableChild(this, object);
        // save the name-object mappings
        this._nameToObjectMap[name] = object;
        this._objectToNameMap.set(object, name);
        // add the name to the end of _orderedNames
        this._orderedNames.push(name);
        // remember that this name was used.
        this._previousNameMap[name] = true;

        if (lockObject)
            this._lockObject(name);

        // make sure the callback variables signal that the object was added
        this._childListCallbacks.runCallbacks(name, object, null);
    };

    /**
     * This function will lock an object in place for a given identifying name.
     * If there is no object using the specified name, this function will have no effect.
     * @method _lockObject
     * @private
     * @param {String} name The identifying name of an object to lock in place.
     */
    p._lockObject = function (name) {
        if (name !== null && name !== undefined && this._nameToObjectMap[name] !== null && this._nameToObjectMap[name] !== undefined)
            this._nameIsLocked[name] = true;
    };

    /**
     * This function will return true if the specified object was previously locked.
     * @method objectIsLocked
     * @param {String} name The name of an object.
     * @return {Boolean}
     */
    p.objectIsLocked = function (name) {
        return this._nameIsLocked[name] ? true : false;
    };

    /**
     * This function removes an object from the hash map.
     * @method removeObject
     * @param {String} name The identifying name of an object previously saved with setObject().
     */
    p.removeObject = function (name) {
        if (!name || this._nameIsLocked[name])
            return;

        var object = this._nameToObjectMap[name];
        if (object === null || object === undefined)
            return; // do nothing if the name isn't mapped to an object.

        //console.log(LinkableHashMap, "removeObject",name,object);
        // remove name & associated object
        delete this._nameToObjectMap[name];
        this._objectToNameMap.delete(object);
        var index = this._orderedNames.indexOf(name);
        this._orderedNames.splice(index, 1);

        // make sure the callback variables signal that the object was removed
        this._childListCallbacks.runCallbacks(name, null, object);

        // dispose the object AFTER the callbacks know that the object was removed
        WeaveAPI.SessionManager.disposeObject(object);
    };

    /**
     * This function attempts to removes all objects from this LinkableHashMap.
     * Any objects that are locked will remain.
     * @method removeAllObjects
     */
    p.removeAllObjects = function () {
        this.delayCallbacks();
        var orderedNamesCopy = this._orderedNames.concat();
        for (var i = 0; i < orderedNamesCopy.length; i++) {
            this.removeObject(orderedNamesCopy[i]);
        }
        this.resumeCallbacks();
    };

    /**
     * This function removes all objects from this LinkableHashMap.
     * adds implementaion to {{#crossLink "CallbackCollection/dispose:method"}}{{/crossLink}}
     * @method dispose
     */
    p.dispose = function dispose() {

        weavecore.CallbackCollection.prototype.dispose.call(this);

        // first, remove all objects that aren't locked
        this.removeAllObjects();

        // remove all locked objects
        var orderedNamesCopy = this._orderedNames.concat();
        for (var i = 0; i < orderedNamesCopy.length; i++) {
            var name = orderedNamesCopy[i];
            this._nameIsLocked[name] = undefined; // make sure removeObject() will carry out its action
            this.removeObject(name);
        }
    };

    /**
     * This will generate a new name for an object that is different from all the names of objects previously used in this LinkableHashMap.
     * @method generateUniqueName
     * @param {String} baseName The name to start with.  If the name is already in use, an integer will be appended to create a unique name.
     */
    p.generateUniqueName = function (baseName) {
        var count = 1;
        var name = baseName;
        while (this._previousNameMap[name] !== undefined)
            name = baseName + (++count);
        return name;
    };

    /**
     * This gets the session state of this composite object.
     * @method getSessionState
     * @return {Array} An Array of {{#crossLink "DynamicState"}}{{/crossLink}} objects which compose the session state for this object.
     */
    p.getSessionState = function () {
        var result = new Array(this._orderedNames.length);
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            var object = this._nameToObjectMap[name];
            result[i] = weavecore.DynamicState.create(
                name,
                object.constructor.NS + '.' + object.constructor.CLASS_NAME,
                WeaveAPI.SessionManager.getSessionState(object)
            );
        }
        return result;
    };

    /**
     * This sets the session state of this composite object.
     * @method setSessionState
     * @param {Array} newState An Array of child name Strings or {{#crossLink "DynamicState"}}{{/crossLink}} objects containing the new values and types for child ILinkableObjects.
     * @param {Boolean} removeMissingDynamicObjects If true, this will remove any child objects that do not appear in the session state.
     *     As a special case, a null session state will result in no change regardless of the removeMissingDynamicObjects value.
     */
    p.setSessionState = function (newStateArray, removeMissingDynamicObjects) {
        // special case - no change
        if (newStateArray === null || newStateArray === undefined)
            return;

        this.delayCallbacks();

        // first pass: make sure the types match and sessioned properties are instantiated.
        var i;
        var delayed = [];
        var callbacks;
        var objectName;
        var className;
        var typedState;
        var remainingObjects = removeMissingDynamicObjects ? {} : null; // maps an objectName to a value of true
        var newObjects = {}; // maps an objectName to a value of true if the object is newly created as a result of setting the session state
        var newNameOrder = []; // the order the object names appear in the vector
        if (newStateArray !== null && newStateArray !== undefined) {
            // first pass: delay callbacks of all children
            for (var m = 0; m < this._orderedNames.length; m++) {
                objectName = this._orderedNames[m]
                callbacks = WeaveAPI.SessionManager.getCallbackCollection(this._nameToObjectMap[objectName]);
                delayed.push(callbacks)
                callbacks.delayCallbacks();
            }
            // initialize all the objects before setting their session states because they may refer to each other.
            for (i = 0; i < newStateArray.length; i++) {
                typedState = newStateArray[i];
                if (!weavecore.DynamicState.isDynamicState(typedState, true))
                    continue;
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                className = typedState[weavecore.DynamicState.CLASS_NAME];
                // ignore objects that do not have a name because they may not load the same way on different application instances.
                if (objectName === null || objectName === undefined)
                    continue;
                // if className is not specified, make no change
                if (className === null || className === undefined)
                    continue;
                // initialize object and remember if a new one was just created
                if (this._nameToObjectMap[objectName] !== this._initObjectByClassName.call(this, objectName, className))
                    newObjects[objectName] = true;
            }

            // next pass: delay callbacks of all children (again, because there may be new children)
            for (var n = 0; n < this._orderedNames.length; n++) {
                objectName = this._orderedNames[n]
                callbacks = WeaveAPI.SessionManager.getCallbackCollection(this._nameToObjectMap[objectName]);
                delayed.push(callbacks)
                callbacks.delayCallbacks();
            }

            // next pass: copy the session state for each property that is defined.
            // Also remember the ordered list of names that appear in the session state.
            for (i = 0; i < newStateArray.length; i++) {
                typedState = newStateArray[i];
                if (typeof (typedState) === "string") {
                    objectName = typedState;
                    if (removeMissingDynamicObjects)
                        remainingObjects[objectName] = true;
                    newNameOrder.push(objectName);
                    continue;
                }

                if (!weavecore.DynamicState.isDynamicState(typedState, true))
                    continue;
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                if (objectName === null || objectName === undefined)
                    continue;
                var object = this._nameToObjectMap[objectName];
                if (object === null || object === undefined)
                    continue;
                // if object is newly created, we want to apply an absolute session state
                WeaveAPI.SessionManager.setSessionState(object, typedState[weavecore.DynamicState.SESSION_STATE], newObjects[objectName] || removeMissingDynamicObjects);
                if (removeMissingDynamicObjects)
                    remainingObjects[objectName] = true;
                newNameOrder.push(objectName);
            }
        }
        if (removeMissingDynamicObjects) {
            // third pass: remove objects based on the Boolean flags in remainingObjects.
            var orderedNamesCopy = this._orderedNames.concat();
            for (var j = 0; j < orderedNamesCopy.length; j++) {
                objectName = orderedNamesCopy[j];
                if (remainingObjects[objectName] !== true) {
                    //trace(LinkableHashMap, "missing value: "+objectName);
                    this.removeObject(objectName);
                }
            }
        }
        // update name order AFTER objects have been added and removed.
        this.setNameOrder(newNameOrder);

        for (var k = 0; k < delayed.length; k++) {
            callbacks = delayed[k]
            if (!WeaveAPI.SessionManager.objectWasDisposed(callbacks))
                callbacks.resumeCallbacks();
        }

        this.resumeCallbacks();
    };

    weavecore.LinkableHashMap = LinkableHashMap;
    weavecore.ClassUtils.registerClass('weavecore.LinkableHashMap', LinkableHashMap);
    weavecore.ClassUtils.registerImplementation('weavecore.LinkableHashMap', 'weavecore.ILinkableCompositeObject');

    // namespace
    if (typeof window === 'undefined') {
        this.WeaveAPI = this.WeaveAPI || {};
        this.WeaveAPI.globalHashMap = new LinkableHashMap();
    } else {
        window.WeaveAPI = window.WeaveAPI || {};
        window.WeaveAPI.globalHashMap = new LinkableHashMap();
    }
}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFunction, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFunction, 'CLASS_NAME', {
        value: 'LinkableFunction'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFunction, 'SESSIONABLE', {
        value: true
    });

    /**
     * This is used as a placeholder to prevent re-compiling erroneous code.
     */
    Object.defineProperties(LinkableFunction, {
        'macros': {
            value: new weavecore.LinkableHashMap(LinkableFunction) //This is a list of macros that can be used in any LinkableFunction expression.
        },
        'macroLibraries': { //This is a list of libraries to include in the static compiler for macros.
            value: WeaveAPI.SessionManager.registerLinkableChild(WeaveAPI.globalHashMap, new weavecore.LinkableVariable(null, LinkableFunction.verifyLibraries))
        }
    });

    LinkableFunction._macroProxy = null; //* This is a proxy object for use as a symbol table for the compiler.

    LinkableFunction.debug = false;
    /**
     * This is the static compiler to be used by every LinkableFunction.
     */
    LinkableFunction._compiler = null;
    LinkableFunction._allLinkableFunctions = new Map(); // the keys in this are LinkableFunction instances

    LinkableFunction.RETURN_UNDEFINED = function () {
        return undefined;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    // static section



    /**
     * This function checks if a macro exists.
     * @param macroName The name of a macro to check.
     * @return A value of true if the specified macro exists, or false if it does not.
     */
    LinkableFunction._hasMacro = function (macroName) {
        return LinkableFunction.macros.getObject(macroName) !== null;
    }

    /**
     * This function evaluates a macro specified in the macros hash map,
     * catching and reporting any errors that are thrown.
     * @param macroName The name of the macro to evaluate.
     * @return The result of evaluating the macro.
     */
    LinkableFunction.evaluateMacro = function (macroName) {
        var lf = LinkableFunction.macros.getObject(macroName);
        lf = (lf && lf instanceof LinkableFunction) ? lf : null
        if (!lf)
            return undefined;
        if (lf._triggerCount !== lf.triggerCounter)
            lf.validate();
        if (lf._isFunctionDefinition)
            return lf;
        return lf.apply();
    }
    LinkableFunction.callMacro = function () {
        var params = Array.prototype.slice.call(arguments);
        var macroName = params.shift();
        // error catching/reporting is handled automatically for LinkableFunctions in the macros list.
        var lf = LinkableFunction.macros.getObject(macroName);
        return lf ? lf.apply(null, params) : undefined;
    }
    LinkableFunction.applyMacro = function () {
        var params = Array.prototype.slice.call(arguments);
        var macroName = params.shift();
        // error catching/reporting is handled automatically for LinkableFunctions in the macros list.
        var lf = LinkableFunction.macros.getObject(macroName);
        return lf ? lf.apply(null, params) : undefined;
    }





    LinkableFunction.verifyLibraries = function (state) {
        var array = state;

        // backwards compatibility for String
        if (typeof state === "string")
            array = WeaveAPI.CSVParser.parseCSVRow(state);

        // modify session state using deprecated class replacements
        if (array)
            array = array.map(function (name, i, a) {
                /*if (ClassUtils.isClassDeprecated(name))
                	return getQualifiedClassName(ClassUtils.getClassDefinition(name));*/
                return name;
            });

        // if we don't have any changes, use the original array
        if (weavecore.StandardLib.compare(array, state) === 0)
            return true;

        // use the new array
        LinkableFunction.macroLibraries.setSessionState(array);
        return false;
    }

    /**
     * This function will add a library to the static list of macro libraries if it is not already added.
     * @param libraryQName A library to add to the list of static libraries.
     */
    LinkableFunction.includeMacroLibrary = function (libraryQName) {
        var array = LinkableFunction.macroLibraries.getSessionState() || [];
        if (array.indexOf(libraryQName) < 0) {
            array.push(libraryQName);
            LinkableFunction.macroLibraries.setSessionState(array);
        }
    }



    /**
     * This function returns a new compiler initialized with the libraries specified by the public static libraries variable.
     * @param reportErrors If this is true, errors will be reported through WeaveAPI.ErrorManager.
     * @return A new initialized compiler.
     */
    LinkableFunction._getNewCompiler = function (reportErrors) {
        var compiler = new weavecore.Compiler();
        try {
            compiler.includeLibraries.apply(null, LinkableFunction.macroLibraries.getSessionState());
        } catch (e) {
            /*if (reportErrors)
            	reportError(e);*/
            conole.error(e)
        }
        return compiler;
    }

    /**
     * Tests if an expression is a single, valid symbol name.
     */
    LinkableFunction.isValidSymbolName = function (expression) {
        if (!LinkableFunction._compiler)
            LinkableFunction._compiler = LinkableFunction._getNewCompiler(true);
        return LinkableFunction._compiler.isValidSymbolName(expression);
    }

    // constructor:
    /**
     * LinkableFunction allows a function to be defined by a String that can use macros defined in the static macros hash map.
     * Libraries listed in macroLibraries variable will be included when compiling the function.
     * @class LinkableFunction
     * @constructor
     */
    /**
     * @param defaultValue The default function definition.
     * @param ignoreRuntimeErrors If this is true, errors thrown during evaluation of the function will be caught and values of undefined will be returned.
     * @param useThisScope When true, variable lookups will be evaluated as if the function were in the scope of the thisArg passed to the apply() function.
     * @param paramNames An Array of parameter names that can be used in the function definition.
     */
    function LinkableFunction(defaultValue, ignoreRuntimeErrors, useThisScope, paramNames) {
        if (defaultValue === undefined) defaultValue = null;
        if (ignoreRuntimeErrors === undefined) ignoreRuntimeErrors = false;
        if (useThisScope === undefined) useThisScope = false;
        if (paramNames === undefined) paramNames = null;
        weavecore.LinkableString.call(weavecore.StandardLib.unIndent(defaultValue));

        this._catchErrors = false;
        this._ignoreRuntimeErrors = ignoreRuntimeErrors;
        this._useThisScope = useThisScope;
        this._compiledMethod = null;
        this._paramNames = paramNames && paramNames.concat();;
        this._isFunctionDefinition = false;
        this._triggerCount = 0;

        Object.defineProperty(this, "length", {
            get: function () { //* This gets the length property of the generated Function.
                if (this._triggerCount !== this.triggerCounter)
                    this.validate();
                return this._compiledMethod.length;
            }
        });

        LinkableFunction.macroLibraries.addImmediateCallback(this, this.triggerCallbacks, false, true);
        WeaveAPI.SessionManager.getCallbackCollection(LinkableFunction.macros).addImmediateCallback(this, handleMacros.bind(this), false, true);





    }

    LinkableFunction.prototype = new weavecore.LinkableString();
    LinkableFunction.prototype.constructor = LinkableFunction;

    var p = LinkableFunction.prototype;

    function handleMacros() {
        if (WeaveAPI.SessionManager.getLinkableOwner(this) !== LinkableFunction.macros)
            this.triggerCallbacks();
    }



    /**
     * This will attempt to compile the function.  An Error will be thrown if this fails.
     */
    p.validate = function () {
        if (this._triggerCount !== this.triggerCounter) {
            // if this LinkableFunction is in the macros list, errors should be caught and reported.
            if (LinkableFunction.macros.getName(this))
                this._catchErrors = true;

            this._triggerCount = this.triggerCounter;
            // in case compile fails, prevent re-compiling erroneous code
            this._compiledMethod = LinkableFunction.RETURN_UNDEFINED;
            this._isFunctionDefinition = false;

            if (LinkableFunction._macroProxy === null)
                LinkableFunction._macroProxy = new weavecore.ProxyObject(LinkableFunction._hasMacro, LinkableFunction.evaluateMacro, null, LinkableFunction.callMacro); // allows evaluating macros but not setting them

            if (WeaveAPI.detectLinkableObjectChange(LinkableFunction._getNewCompiler, LinkableFunction.macroLibraries))
                LinkableFunction._compiler = LinkableFunction._getNewCompiler(true);

            var object = LinkableFunction._compiler.compileToObject(this.value);
            this._isFunctionDefinition = LinkableFunction._compiler.compiledObjectIsFunctionDefinition(object);
            this._compiledMethod = LinkableFunction._compiler.compileObjectToFunction(object, LinkableFunction._macroProxy, errorHandler.bind(this), this._useThisScope, this._paramNames);
        }
    }

    function errorHandler(e) {
        if (LinkableFunction.debug)
            console.error(e);

        if (this._ignoreRuntimeErrors || LinkableFunction.debug)
            return true;

        if (this._catchErrors) {
            console.error(e);
            return false;
        }

        throw e;
    }



    /**
     * This will evaluate the function with the specified parameters.
     * @param thisArg The value of 'this' to be used when evaluating the function.
     * @param argArray An Array of arguments to be passed to the compiled function.
     * @return The result of evaluating the function.
     */
    p.apply = function (thisArg, argArray) {
        if (this._triggerCount != this.triggerCounter)
            this.validate();
        return this._compiledMethod.apply(thisArg, argArray);
    }

    /**
     * This will evaluate the function with the specified parameters.
     * @param thisArg The value of 'this' to be used when evaluating the function.
     * @param args Arguments to be passed to the compiled function.
     * @return The result of evaluating the function.
     */
    p.call = function () {
        var args = Array.prototype.slice.call(arguments);
        var thisArg = args.shift();
        if (this._triggerCount !== this.triggerCounter)
            this.validate();
        return this._compiledMethod.apply(thisArg, args);
    }

    weavecore.LinkableFunction = LinkableFunction;
    weavecore.ClassUtils.registerClass('weavecore.LinkableFunction', LinkableFunction);

}());

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    "use strict";


    // constructor:
    /**
     * @class LinkablePromise
     * @param {Function} A function to invoke, which must take zero parameters and may return an AsyncToken.
     * @param {Object} A description of the task as a String, or a function to call which returns a descriptive string.
     * @param {Boolean}
     * @constructor
     */

    function LinkablePromise(task, description, validateNow) {
        description = (description ? description : null);
        validateNow = (validateNow !== undefined ? validateNow : false);

        weavecore.ILinkableObject.call(this);

        this._lazy = true;
        this._invalidated = true;
        this._selfTriggeredCount = 0;

        this._result;
        this._error;

        this._task = task;
        this._description = description;
        this._callbackCollection = WeaveAPI.SessionManager.getCallbackCollection(this);
        this._callbackCollection.addImmediateCallback(null, _immediateCallback.bind(this));
        this._callbackCollection.addGroupedCallback(null, _groupedCallback.bind(this), validateNow);
        if (validateNow) {
            this._lazy = false;
            _immediateCallback.call(this);
        }

        /**
         * The result of calling the invoke function.
         * When this value is accessed, validate() will be called.
         * @public
         * @property result
         * @readOnly
         * @type Object
         */
        Object.defineProperty(this, 'result', {
            get: function () {
                this.validate()
                return this._result;
            }
        });

        /**
         * The error that occurred calling the invoke function.
         * When this value is accessed, validate() will be called.
         * @public
         * @property error
         * @readOnly
         * @type Object
         */
        Object.defineProperty(this, 'error', {
            get: function () {
                this.validate()
                return this._error;
            }
        });

    }

    LinkablePromise.prototype = new weavecore.ILinkableObject();
    LinkablePromise.prototype.constructor = LinkablePromise;

    // Prototypes
    var p = LinkablePromise.prototype;

    p.validate = function () {
        if (!this._lazy)
            return;

        this._lazy = false;

        if (this._invalidated)
            this._callbackCollection.triggerCallbacks();

    }

    function _immediateCallback() {
        // stop if self-triggered
        if (this._callbackCollection.triggerCounter === this._selfTriggeredCount)
            return;

        // reset variables
        this._invalidated = true;
        // _asyncToken = null;
        this._result = null;
        this._error = null;

        //  Progress Indicator we are no longer waiting for the async task
        WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // stop if lazy
        if (this._lazy)
            return;

        // stop if still busy because we don't want to invoke the task if an external dependency is not ready
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this)) {
            // make sure _groupedCallback() will not invoke the task.
            // this is ok to do since callbacks will be triggered again when the dependencies are no longer busy.
            this._invalidated = false;
            return;
        }


        var _tmp_description = null;
        if (this._description instanceof Function)
            _tmp_description = this._description();
        else
            _tmp_description = this._description;

        //Progress Indicator mark as busy starting now because we plan to start the task inside _groupedCallback()
        WeaveAPI.ProgressIndicator.addTask(_groupedCallback, this, _tmp_description);
    }

    function _groupedCallback() {
        try {
            if (this._lazy || !this._invalidated)
                return;

            // _invalidated is true prior to invoking the task
            var invokeResult = this._task.apply(null);

            // if _invalidated has been set to false, it means _immediateCallback() was triggered from the task and it's telling us we should stop now.
            if (!this._invalidated)
                return;

            // set _invalidated to false now since we invoked the task
            this._invalidated = false;

            if (invokeResult instanceof weavecore.CustomPromise)
                invokeResult.addResponder({
                    result: _handleResult.bind(this),
                    fault: _handleFault.bind(this),
                    token: invokeResult
                });
            else if (invokeResult instanceof Promise) {
                invokeResult.then(_handleResult.bind(this), _handleFault.bind(this));
            } else {
                this._result = invokeResult;
                WeaveAPI.StageUtils.callLater(this, _handleResult.bind(this));
            }


        } catch (invokeError) {
            this._invalidated = false;
            this._error = invokeError;
            WeaveAPI.StageUtils.callLater(this, _handleFault.bind(this));
        }
    }

    function _handleResult(result) {
        result = (result === undefined ? null : result);

        if (this._invalidated)
            return;

        // ProgressIndicator no longer busy
        WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // if there is an result, save the result
        if (result)
            this._result = result;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }

    function _handleFault(fault) {
        fault = (fault === undefined ? null : fault);

        if (this._invalidated)
            return;

        //Progress Indicator no longer busy
        WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // if there is an fault, save the error
        if (fault)
            this._error = fault;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }



    /**
     * Registers dependencies of the LinkablePromise.
     * @method depend
     * @param dependencies {Array} Array of dependencies, Taken form JS Arguments Parameter
     */
    p.depend = function () {

        if (arguments) {
            for (var i = 0; i < arguments.length; i++) {
                var dependency = arguments[i];
                WeaveAPI.SessionManager.registerLinkableChild(this, dependency);
            }

        }

        return this;
    }

    p.dispose = function () {
        WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);
        this._lazy = true;
        this._invalidated = true;
        this._result = null;
        this._error = null;
    }

    weavecore.LinkablePromise = LinkablePromise;
    weavecore.ClassUtils.registerClass('weavecore.LinkablePromise', LinkablePromise);


}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableString that handles the process of managing a promise for file content from a URL.
 * @author pkovac
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFile, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFile, 'CLASS_NAME', {
        value: 'LinkableFile'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableFile, 'SESSIONABLE', {
        value: true
    });

    function LinkableFile(defaultValue, taskDescription) {
        // set default values for Parameters
        if (defaultValue === undefined) defaultValue = null;
        if (taskDescription === undefined) taskDescription = null;

        // Note: Calling  weavecore.LinkableVariable.call() will set all the default values for member variables defined in the super class,
        // which means we can't set _sessionStateInternal = NaN here.
        weavecore.LinkableVariable.call(this);

        this._contentPromise = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkablePromise(requestContent.bind(this), taskDescription));
        this._url = WeaveAPI.SessionManager.registerLinkableChild(this._contentPromise, new weavecore.LinkableString(defaultValue));

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._url.value;
            },
            set: function (new_value) {
                this._url.value = new_value;
            }

        });

        Object.defineProperty(this, 'result', {
            get: function () {
                return this._contentPromise.result;
            }

        });

        Object.defineProperty(this, 'error', {
            get: function () {
                return this._contentPromise.error;
            }

        });

    }

    function requestContent() {
        if (!this._url.value)
            return null;
        return WeaveAPI.URLRequestUtils.getPromise(this._contentPromise, this._url.value, null, null, null, 'binary', true);
    }

    LinkableFile.prototype = new weavecore.LinkableVariable();
    LinkableFile.prototype.constructor = LinkableFile;

    var p = LinkableFile.prototype;

    p.setSessionState = function (value) {
        this._url.setSessionState(value);
    }

    p.getSessionState = function () {
        return this._url.getSessionState();
    }




    weavecore.LinkableFile = LinkableFile;
    weavecore.ClassUtils.registerClass('weavecore.LinkableFile', LinkableFile);

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 *  Contains a list of properties for use with a TextFormat object.
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'NS', {
        value: 'weavecore'
    });


    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'CLASS_NAME', {
        value: 'LinkableTextFormat'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'SESSIONABLE', {
        value: true
    });





    function LinkableTextFormat() {

        weavecore.ILinkableObject.call(this);

        Object.defineProperties(this, {
            'font': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(LinkableTextFormat.DEFAULT_FONT, function (value) {
                    return value ? true : false;
                }))
            },
            'size': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_SIZE, function (value) {
                    return value > 2;
                }))
            },
            'color': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_COLOR, isFinite))
            },
            'bold': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            },
            'italic': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            },
            'underline': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            }
        });





    }

    LinkableTextFormat.prototype = new weavecore.ILinkableObject();
    LinkableTextFormat.prototype.constructor = LinkableTextFormat;

    var p = LinkableTextFormat.prototype;

    /**
     * Copy the properties from a TextFormat object to the linkable properties of this object.
     * @param source A TextFormat to copy properties from.
     */
    p.copyFrom = function (source) {
        font.value = source.font;
        size.value = source.size;
        color.value = source.color;
        bold.value = source.bold;
        italic.value = source.italic;
        underline.value = source.underline;
    }

    /**
     * Copy the linkable properties from this object to the properties of a TextFormat object.
     * @param source A TextFormat to copy properties from.
     */
    p.copyTo = function (destination) {
        destination.font = font.value;
        destination.size = size.value;
        destination.color = color.value;
        destination.bold = bold.value;
        destination.italic = italic.value;
        destination.underline = underline.value;
    }

    Object.defineProperties(LinkableTextFormat, {
        'defaultTextFormat': {
            value: new LinkableTextFormat()
        },
        'DEFAULT_COLOR': {
            value: 0x000000
        },
        'DEFAULT_SIZE': {
            value: 11
        },
        'DEFAULT_FONT': {
            value: "Sophia Nubian"
        }
    });

    weavecore.LinkableTextFormat = LinkableTextFormat;
    weavecore.ClassUtils.registerClass('weavecore.LinkableTextFormat', LinkableTextFormat);

}());


/*public function copyToStyle(destination:UIComponent):void
{
	destination.setStyle("fontFamily", font.value);
	destination.setStyle("fontSize", size.value);
	destination.setStyle("color", color.value);
	destination.setStyle("fontWeight", bold.value ? FontWeight.BOLD : FontWeight.NORMAL);
	destination.setStyle("fontStyle", italic.value ? FontPosture.ITALIC : FontPosture.NORMAL);
	destination.setStyle("textDecoration", underline.value ? "underline" : "none");
}


public function bindStyle(relevantContext:Object, destination:UIComponent):void
{
	getCallbackCollection(this).addGroupedCallback(
		relevantContext,
		function():void { copyToStyle(destination); },
		true
	);
}*/

/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableDynamicObject, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableDynamicObject, 'CLASS_NAME', {
        value: 'LinkableDynamicObject'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableDynamicObject, 'SESSIONABLE', {
        value: true
    });


    Object.defineProperty(LinkableDynamicObject, 'ARRAY_CLASS_NAME', {
        value: "Array"
    });



    // constructor:
    /**
     * This object links to an internal ILinkableObject.
     * The internal object can be either a local one or a global one identified by a global name.
     * @class LinkableDynamicObject
     * @extends LinkableWatcher
     * @constructor
     * @param {Class} typeRestriction If specified, this will limit the type of objects that can be added to this LinkableHashMap.
     */
    function LinkableDynamicObject(typeRestriction) {
        if (typeRestriction === undefined) typeRestriction = null;
        // this is a constraint on the type of object that can be linked
        this._typeRestrictionClassName;
        //this._typeRestriction = typeRestriction;
        // when this is true, the linked object cannot be changed
        this._locked = false;

        weavecore.LinkableWatcher.call(this, typeRestriction);
        if (typeRestriction)
            this._typeRestrictionClassName = typeRestriction.NS + '.' + typeRestriction.CLASS_NAME;

        // the callback collection for this object
        // private const
        Object.defineProperty(this, '_cc', {
            value: WeaveAPI.SessionManager.registerDisposableChild(this, new weavecore.CallbackCollection())
        });



        /**
         * @inheritDoc
         */
        Object.defineProperty(this, 'internalObject', {
            get: function () {
                return this.target;
            }
        });

        // override public
        Object.defineProperty(this, 'targetPath', {
            get: function () {
                return this.__proto__.targetPath
            },

            set: function (path) {
                if (this._locked)
                    return;
                this.__proto__.targetPath = path;
            },
            configurable: true
        });

        // override public
        Object.defineProperty(this, 'target', {
            get: function () {
                return this.__proto__.target;
            },

            set: function (newTarget) {
                if (this._locked)
                    return;

                if (!newTarget) {
                    this.__proto__.target = null;
                    return;
                }

                this._cc.delayCallbacks();

                // if the target can be found by a path, use the path
                var sm = WeaveAPI.SessionManager;
                var path = sm.getPath(WeaveAPI.globalHashMap, newTarget);
                if (path) {
                    this.targetPath = path;
                } else {
                    // it's ok to assign a local object that we own or that doesn't have an owner yet
                    // otherwise, unset the target
                    var owner = sm.getLinkableOwner(newTarget);
                    if (owner === this || !owner)
                        this.__proto__.target = newTarget;
                    else
                        this.__proto__.target = null;
                }

                this._cc.resumeCallbacks();
            },
            configurable: true
        });


        Object.defineProperty(this, 'globalName', {
            /**
             * This is the name of the linked global object, or null if the internal object is local.
             */
            get: function () {
                if (this._targetPath && this._targetPath.length == 1)
                    return this._targetPath[0];
                return null;
            },
            /**
             * This function will change the internalObject if the new globalName is different, unless this object is locked.
             * If a new global name is given, the session state of the new global object will take precedence.
             * @param newGlobalName This is the name of the global object to link to, or null to unlink from the current global object.
             */
            set: function (newGlobalName) {
                if (this._locked)
                    return;

                // change empty string to null
                if (!newGlobalName)
                    newGlobalName = null;

                var oldGlobalName = this.globalName;
                if (oldGlobalName === newGlobalName)
                    return;

                this._cc.delayCallbacks();

                if (newGlobalName === null || newGlobalName === undefined) {
                    // unlink from global object and copy session state into a local object
                    this.requestLocalObjectCopy(this.internalObject);
                } else {
                    // when switcing from a local object to a global one that doesn't exist yet, copy the local object
                    if (this.target && !this.targetPath && !WeaveAPI.globalHashMap.getObject(newGlobalName))
                        WeaveAPI.globalHashMap.requestObjectCopy(newGlobalName, this.internalObject);

                    // link to new global name
                    this.targetPath = [newGlobalName];
                }

                this._cc.resumeCallbacks();
            }
        });

        /**
         * @inheritDoc
         */
        Object.defineProperty(this, 'locked', {
            get: function () {
                return this._locked;
            }

        });

        Object.defineProperty(this, 'triggerCounter', {
            get: function () {
                this._cc.triggerCounter;
            }

        });

        Object.defineProperty(this, 'callbacksAreDelayed', {
            get: function () {
                this._cc.callbacksAreDelayed;
            }

        });





    }

    LinkableDynamicObject.prototype = new weavecore.LinkableWatcher();
    LinkableDynamicObject.prototype.constructor = LinkableDynamicObject;

    var p = LinkableDynamicObject.prototype;


    p.lock = function () {
        this._locked = true;
    };

    /**
     * @inheritDoc
     */
    //public

    p.getSessionState = function () {
        var obj = this.targetPath || this.target;
        if (!obj)
            return [];

        var className = obj.constructor.NS + obj.constructor.CLASS_NAME;
        var sessionState = obj || WeaveAPI.SessionManager.getSessionState(obj);
        return [weavecore.DynamicState.create(null, className, sessionState)];
    };

    /**
     * @inheritDoc
     */
    //public

    p.setSessionState = function (newState, removeMissingDynamicObjects) {
        //console.log(debugId(this), removeMissingDynamicObjects ? 'diff' : 'state', Compiler.stringify(newState, null, '\t'));

        // special case - no change
        if (newState === null || newState === undefined)
            return;

        try {
            // make sure callbacks only run once
            this._cc.delayCallbacks();

            // stop if there are no items
            if (!newState.length) {
                if (removeMissingDynamicObjects)
                    this.target = null;
                return;
            }

            // if it's not a dynamic state array, treat it as a path
            if (!weavecore.DynamicState.isDynamicStateArray(newState, true)) {
                this.targetPath = newState;
                return;
            }

            // if there is more than one item, it's in a deprecated format
            /*if (newState.length > 1) {
                handleDeprecatedSessionState(newState, removeMissingDynamicObjects);
                return;
            }*/

            var dynamicState = newState[0];
            var className = dynamicState[weavecore.DynamicState.CLASS_NAME];
            var objectName = dynamicState[weavecore.DynamicState.OBJECT_NAME];
            var sessionState = dynamicState[weavecore.DynamicState.SESSION_STATE];

            // backwards compatibility
            /*if (className == 'weave.core::GlobalObjectReference' || className == 'GlobalObjectReference') {
                className = ARRAY_CLASS_NAME;
                sessionState = [objectName];
            }*/

            if (className === LinkableDynamicObject.ARRAY_CLASS_NAME || (!className && this.targetPath))
                this.targetPath = sessionState;
            else if (className === SessionManager.DIFF_DELETE)
                this.target = null;
            else {
                var prevTarget = this.target;
                // if className is not specified, make no change unless removeMissingDynamicObjects is true
                if (className || removeMissingDynamicObjects)
                    setLocalObjectType.call(this, className);
                //TODO:Remove hardcoded NameSpace
                //var classDef = eval("weavecore." + className);
                var classDef = window[className];
                if ((!className && this.target) || (classDef && this.target instanceof classDef))
                    WeaveAPI.SessionManager.setSessionState(this.target, sessionState, prevTarget !== this.target || removeMissingDynamicObjects);
            }
        } finally {
            // allow callbacks to run once now
            this._cc.resumeCallbacks();
        }
    };





    // override protected

    p.internalSetTarget = function (newTarget) {
        // don't allow recursive linking
        if (newTarget === this || WeaveAPI.SessionManager.getLinkableDescendants(newTarget, LinkableDynamicObject).indexOf(this) >= 0)
            newTarget = null;

        weavecore.LinkableWatcher.prototype.internalSetTarget(newTarget);
    };



    //private
    //to-do
    // replace weavecore with ns and figure out best way to deal this
    function setLocalObjectType(className) {
        // stop if locked
        if (this._locked)
            return;

        this._cc.delayCallbacks();

        this.targetPath = null;

        var classDef = weavecore.ClassUtils.hasClassDefinition(className) ? weavecore.ClassUtils.getClassDefinition(className) : null;
        classDef = classDef ? classDef : eval(className);
        if ((classDef.prototype instanceof weavecore.ILinkableObject || classDef.SESSIONABLE) && (this._typeRestriction === null || this._typeRestriction === undefined || weavecore.ClassUtils.classExtends(className, this._typeRestrictionClassName))) {

            var obj = this.target;
            if (!obj || obj.constructor !== classDef || !(obj instanceof classDef))
                this.__proto__.target = new classDef();
        } else {
            this.__proto__.target = null;
        }

        this._cc.resumeCallbacks();
    };

    /**
     * @inheritDoc
     */


    p.requestLocalObject = function (objectType, lockObject) {
        this._cc.delayCallbacks();

        //To-do
        // this will fail if we minify the weavecore, as constructor name wont be same in minified version
        // we nee dot get namespace of that object here too
        // temp solution store  Ns name in the object instance as String
        if (objectType)
            setLocalObjectType.call(this, objectType.NS + '.' + objectType.CLASS_NAME);
        else
            this.target = null;

        if (lockObject)
            this._locked = true;

        this._cc.resumeCallbacks();

        if (objectType)
            return (this.target && this.target instanceof objectType) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestGlobalObject = function (name, objectType, lockObject) {
        if (!name)
            return this.requestLocalObject(objectType, lockObject);

        if (!this._locked) {
            this._cc.delayCallbacks();

            this.targetPath = [name];
            WeaveAPI.globalHashMap.requestObject(name, objectType, lockObject);
            if (lockObject)
                this._locked = true;

            this._cc.resumeCallbacks();
        }

        if (objectType)
            return (this.target && this.target instanceof objectType) ? this.target : null;

        return this.target;
    };

    /**
     * @inheritDoc
     */
    p.requestLocalObjectCopy = function (objectToCopy) {
        this._cc.delayCallbacks(); // make sure callbacks only trigger once
        var classDef = objectToCopy ? objectToCopy.constructor : null;
        var object = this.requestLocalObject(classDef, false);
        if (object !== null && object !== undefined && objectToCopy !== null && objectToCopy !== undefined) {
            var state = WeaveAPI.SessionManager.getSessionState(objectToCopy);
            WeaveAPI.SessionManager.setSessionState(object, state, true);
        }
        this._cc.resumeCallbacks();
    };


    p.removeObject = function () {
        if (!this._locked)
            this.__proto__.target = null;
    };

    p.dispose = function () {
        // explicitly dispose the CallbackCollection before anything else
        this._cc.dispose();
        weavecore.LinkableWatcher.prototype.dispose();
    };

    ////////////////////////////////////////////////////////////////////////
    // ICallbackCollection interface included for backwards compatibility
    /** @inheritDoc */
    p.addImmediateCallback = function (relevantContext, callback, runCallbackNow, alwaysCallLast) {
        runCallbackNow = (runCallbackNow === undefined) ? false : runCallbackNow;
        alwaysCallLast = (alwaysCallLast === undefined) ? false : alwaysCallLast;
        this._cc.addImmediateCallback(relevantContext, callback, runCallbackNow, alwaysCallLast);
    };

    /** @inheritDoc */
    p.addGroupedCallback = function (relevantContext, groupedCallback, triggerCallbackNow) {
        triggerCallbackNow = (triggerCallbackNow === undefined) ? false : triggerCallbackNow;
        this._cc.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow);
    };

    /** @inheritDoc */
    p.addDisposeCallback = function (relevantContext, callback) {
        this._cc.addDisposeCallback(relevantContext, callback);
    };

    /** @inheritDoc */
    p.removeCallback = function (callback) {
        this._cc.removeCallback(callback);
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.triggerCallbacks = function () {
        this._cc.triggerCallbacks();
    };

    /** @inheritDoc */
    /** @inheritDoc */
    p.delayCallbacks = function () {
        this._cc.delayCallbacks();
    };

    /** @inheritDoc */
    p.resumeCallbacks = function () {
        this._cc.resumeCallbacks();
    };

    weavecore.LinkableDynamicObject = LinkableDynamicObject;
    weavecore.ClassUtils.registerClass('weavecore.LinkableDynamicObject', LinkableDynamicObject);
    weavecore.ClassUtils.registerImplementation('weavecore.LinkableDynamicObject', 'weavecore.ILinkableCompositeObject');


}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * A set of static functions intended for use as a JavaScript API.
 *
 * The user interface in Weave is initially generated from a saved session state.
 * User interactions affect the session state, and changes in the session state affect
 * the display at runtime.  The API provides a window into the session state so most
 * interactions that can be made through the GUI can also be made through JavaScript calls.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ExternalSessionStateInterface, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ExternalSessionStateInterface, 'CLASS_NAME', {
        value: 'ExternalSessionStateInterface'
    });

    /**
     * Stores information for removeCallback() and removeAllCallbacks()
     */
    ExternalSessionStateInterface._d2d_callback_target = new weavecore.Dictionary2D();
    ExternalSessionStateInterface._funcToWrapper = new Map();
    ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = null;


    // need to nmke them static ans this referenc elost when called from jsonCall
    /**
     * This object maps an expression name to the saved expression function.
     */
    Object.defineProperties(ExternalSessionStateInterface, {
        '_compiler': {
            value: new weavecore.Compiler()
        },
        '_variables': {
            value: {} //This object maps an expression name to the saved expression function.
        }

    });

    function ExternalSessionStateInterface() {



    }

    var p = ExternalSessionStateInterface.prototype;

    /**
     * @inheritDoc
     */
    p.getSessionState = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            var state = WeaveAPI.SessionManager.getSessionState(object);
            _convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
            return state;
        }

        externalWarning("No ILinkableObject from which to get session state at path {0}", weavecore.Compiler.stringify(objectPath));
        return null;
    }

    /**
     * This function modifies a session state, converting any nested XML objects to Strings.
     * @param state A session state that may contain nested XML objects.
     */
    function _convertSessionStateToPrimitives(state) {
        var stateType = typeof state;
        if (stateType === 'string' || stateType === 'number' || stateType === 'boolean') {
            return;
        }
        for (var key in state) {
            var value = state[key];
            _convertSessionStateToPrimitives(value);
        }
    }

    p.setSessionState = function (objectPath, newState, removeMissingObjects) {
        // default parameter values
        removeMissingObjects = (removeMissingObjects === undefined) ? true : removeMissingObjects;
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            WeaveAPI.SessionManager.setSessionState(object, newState, removeMissingObjects);
            return true;
        }

        externalError("No ILinkableObject for which to set session state at path {0}", weavecore.Compiler.stringify(objectPath));
        return false;
    }

    p.getObjectType = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object)
            return object.constructor.NS + '.' + object.constructor.CLASS_NAME;

        // no warning since getObjectType() may be used to check whether or not an object exists.
        return null;
    }

    p.getChildNames = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);
        if (object) {
            if (object instanceof weavecore.LinkableHashMap)
                return object.getNames();
            if (object instanceof weavecore.LinkableDynamicObject)
                return [null];
            return WeaveAPI.SessionManager.getLinkablePropertyNames(object, true);
        }

        externalError("No ILinkableObject for which to get child names at path {0}", weavecore.Compiler.stringify(objectPath));
        return null;
    }

    p.setChildNameOrder = function (hashMapPath, orderedChildNames) {
        var hashMap = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, hashMapPath);
        hashMap = (hashMap && hashMap instanceof weavecore.LinkableHashMap) ? hashMap : null;
        if (hashMap) {
            // it's ok if there are no names specified, because that wouldn't accomplish anything anyway
            if (orderedChildNames)
                hashMap.setNameOrder(orderedChildNames);
            return true;
        }

        externalError("No ILinkableHashMap for which to reorder children at path {0}", weavecore.Compiler.stringify(hashMapPath));
        return false;
    }

    p.requestObject = function (objectPath, objectType) {
        // get class definition
        var classQName = objectType;
        var classDef = weavecore.ClassUtils.getClassDefinition(objectType);
        if (classDef === null) {
            externalError("No class definition for {0}", weavecore.Compiler.stringify(classQName));
            return false;
        }
        /* if (ClassUtils.isClassDeprecated(classQName))
             externalWarning("{0} is deprecated.", objectType);*/

        // stop if there is no path specified
        if (!objectPath || !objectPath.length) {
            if (Object(WeaveAPI.globalHashMap).constructor === classDef)
                return true;

            externalError("Cannot request an object at the root path");
            return false;
        }
        // Get parent object first in case there is some backwards compatibility code that gets
        // executed when it is accessed (registering deprecated class definitions, for example).
        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, parentPath);

        // request the child object
        var hashMap = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        var dynamicObject = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        var child = null;
        if (hashMap) {
            if (typeof (childName) === 'number')
                childName = hashMap.getNames()[childName];
            child = hashMap.requestObject((childName === null) ? null : String(childName), classDef, false); //String(null) returns "null"
        } else if (dynamicObject)
            child = dynamicObject.requestGlobalObject((childName === null) ? null : String(childName), classDef, false); //String(null) returns "null"
        else
            child = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPath);

        if (child && child.constructor === classDef)
            return true;

        externalError("Request for {0} failed at path {1}", objectType, weavecore.Compiler.stringify(objectPath));
        return false;
    }

    p.removeObject = function (objectPath) {
        if (!objectPath || !objectPath.length) {
            externalError("Cannot remove root object");
            return false;
        }

        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, parentPath);

        var hashMap = (parent && parent instanceof weavecore.LinkableHashMap) ? parent : null;
        if (hashMap) {
            if (typeof (childName) === 'number')
                childName = hashMap.getNames()[childName];

            if (hashMap.objectIsLocked(String(childName))) {
                externalError("Object is locked and cannot be removed (path: {0})", weavecore.Compiler.stringify(objectPath));
                return false;
            }

            hashMap.removeObject(childName);
            return true;
        }

        var dynamicObject = (parent && parent instanceof weavecore.LinkableDynamicObject) ? parent : null;
        if (dynamicObject) {
            if (dynamicObject.locked) {
                externalError("Object is locked and cannot be removed (path: {0})", weavecore.Compiler.stringify(objectPath));
                return false;
            }

            dynamicObject.removeObject();
            return true;
        }

        if (parent)
            externalError("Parent object does not support dynamic children, so cannot remove child at path {0}", weavecore.Compiler.stringify(objectPath));
        else
            externalError("No parent from which to remove a child at path {0}", weavecore.Compiler.stringify(objectPath));
        return false;
    }




    /*function convertSessionStateObjectToXML(sessionState: Object, tagName: String = null): String {
        var result: XML = WeaveXMLEncoder.encode(sessionState, tagName || "sessionState");
        return result.toXMLString();
    }

    function convertSessionStateXMLToObject(sessionStateXML: String): Object {
        var xml: XML = XML(sessionStateXML);
        var state: Object = WeaveXMLDecoder.decode(xml);
        this._convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
        return state;
    }*/



    /**
     * Gets an object from a path or a variable name and sets getObjectFromPathOrVariableName_error.
     * If the path was invalid or the variable uninitialized, getObjectFromPathOrVariableName_error will be set with an appropriate error message.
     * @param objectPathOrVariableName Either an Array for a path or a String for a variable name.
     * @return The object at the specified path, the value of the specified variable, or null if the parameter was null.
     */
    //private
    function _getObjectFromPathOrVariableName(objectPathOrVariableName) {
        ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = null;

        if (objectPathOrVariableName === null || objectPathOrVariableName === undefined)
            return null;

        if (objectPathOrVariableName.constructor === Array) {
            var object = WeaveAPI.SessionManager.getObject(WeaveAPI.globalHashMap, objectPathOrVariableName);
            if (object)
                return object;

            ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = "No ILinkableObject at path " + weavecore.Compiler.stringify(objectPathOrVariableName);;
            return null;
        }

        var variableName = String(objectPathOrVariableName);
        if (variableName) {
            if (ExternalSessionStateInterface._variables.hasOwnProperty(variableName))
                return ExternalSessionStateInterface._variables[variableName];

            ExternalSessionStateInterface._getObjectFromPathOrVariableName_error = "Undefined variable " + weavecore.Compiler.stringify(variableName);;
            return null;
        }

        return null;
    }

    /**
     * @inheritDoc
     */
    p.evaluateExpression = function (scopeObjectPathOrVariableName, expression, variables, staticLibraries, assignVariableName) {
        variables = (variables === undefined) ? null : variables;
        staticLibraries = (staticLibraries === undefined) ? null : staticLibraries;
        assignVariableName = (assignVariableName === undefined) ? null : assignVariableName;

        try {
            if (staticLibraries)
                ExternalSessionStateInterface._compiler.includeLibraries.apply(null, staticLibraries);

            var isAssignment = (assignVariableName !== null); // allows '' to be used to ignore resulting value
            if (assignVariableName && !ExternalSessionStateInterface._compiler.isValidSymbolName(assignVariableName))
                throw new Error("Invalid variable name: " + weavecore.Compiler.encodeString(assignVariableName));

            // To avoid "variable is undefined" errors, treat variables[''] as an Array of keys and set any missing properties to undefined
            if (variables && variables[''])
                variables[''].forEach(function (key) {
                    if (!variables.hasOwnProperty(key))
                        variables[key] = undefined;
                });

            var thisObject = _getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error)
                throw new Error(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
            var compiledObject = ExternalSessionStateInterface._compiler.compileToObject(expression);
            var isFuncDef = ExternalSessionStateInterface._compiler.compiledObjectIsFunctionDefinition(compiledObject);
            // passed-in variables take precedence over stored ActionScript weave._variables
            var compiledMethod = ExternalSessionStateInterface._compiler.compileObjectToFunction(
                compiledObject, [variables, ExternalSessionStateInterface._variables],
                WeaveAPI.ErrorManager.reportError.bind(WeaveAPI.ErrorManager),
                thisObject !== null,
                null,
                null,
                true,
                thisObject
            );
            var result = isFuncDef ? compiledMethod : compiledMethod.apply(thisObject);
            if (isAssignment)
                ExternalSessionStateInterface._variables[assignVariableName] = result;
            else
                return result;
        } catch (e) {
            externalError(e.message);
        }
        return undefined;
    }




    p.addCallback = function (scopeObjectPathOrVariableName, callback, triggerCallbackNow, immediateMode, delayWhileBusy) {
        // set default values
        triggerCallbackNow = (triggerCallbackNow === undefined) ? false : triggerCallbackNow;
        immediateMode = (immediateMode === undefined) ? false : immediateMode;
        delayWhileBusy = (delayWhileBusy === undefined) ? true : delayWhileBusy;

        try {
            if (scopeObjectPathOrVariableName === null || scopeObjectPathOrVariableName === undefined) {
                externalError("addCallback(): No path or variable name given");
                return false;
            }

            var object = _getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            object = (object && object instanceof weavecore.ILinkableObject) ? object : null;
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error) {
                externalError(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                externalError('No ILinkableObject to which to add a callback at path or variable ', weavecore.Compiler.stringify(scopeObjectPathOrVariableName));
                return false;
            }
            if (delayWhileBusy) {

                if (!ExternalSessionStateInterface._funcToWrapper.get(callback)) {
                    ExternalSessionStateInterface._funcToWrapper.set(callback, generateBusyWaitWrapper(callback))
                }
                callback = (ExternalSessionStateInterface._funcToWrapper.get(callback) && ExternalSessionStateInterface._funcToWrapper.get(callback) instanceof Function) ? ExternalSessionStateInterface._funcToWrapper.get(callback) : null;
            }
            ExternalSessionStateInterface._d2d_callback_target.set(callback, object, true);
            if (immediateMode)
                WeaveAPI.SessionManager.getCallbackCollection(object).addImmediateCallback(null, callback, triggerCallbackNow);
            else
                WeaveAPI.SessionManager.getCallbackCollection(object).addGroupedCallback(null, callback, triggerCallbackNow);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            WeaveAPI.ErrorManager.reportError(e);
        }
        return false;
    }

    function generateBusyWaitWrapper(callback) {
        var wrapper = function () {
            var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(wrapper).keys();
            for (var i = 0; i < keys.length; i++) {
                var target = keys[i];
                if (WeaveAPI.SessionManager.linkableObjectIsBusy(target))
                    return;
            }
            callback();
        };
        return wrapper;
    }

    /**
     * @inheritDoc
     */
    p.removeCallback = function (objectPathOrVariableName, callback, everywhere) {
        //set parameter's default values
        everywhere = (everywhere === undefined) ? false : everywhere;
        var wrapper = ExternalSessionStateInterface._funcToWrapper.get(callback);
        if (wrapper !== null && !this.removeCallback(objectPathOrVariableName, wrapper, everywhere))
            return false;
        if (everywhere) {
            var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback).keys();
            for (var i = 0; i < keys.length; i++) {
                var target = keys[i];
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
            }
            ExternalSessionStateInterface._d2d_callback_target.dictionary.delete(callback);
            ExternalSessionStateInterface._funcToWrapper.delete(callback);
            return true;
        }

        try {
            if (objectPathOrVariableName === null || objectPathOrVariableName === undefined) {
                externalWarning("removeCallback(): No path or variable name given");
                return false;
            }

            var object = _getObjectFromPathOrVariableName(objectPathOrVariableName);
            object = (object && object instanceof weavecore.ILinkableObject) ? object : null;
            if (ExternalSessionStateInterface._getObjectFromPathOrVariableName_error) {
                externalError(ExternalSessionStateInterface._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                console.log('No ILinkableObject from which to remove a callback at path or variable ', objectPathOrVariableName);
                return false;
            }

            ExternalSessionStateInterface._d2d_callback_target.remove(callback, object);
            WeaveAPI.SessionManager.getCallbackCollection(object).removeCallback(callback);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            WeaveAPI.ErrorManager.reportError(e);
        }
        return false;
    }

    /**
     * @inheritDoc
     */
    p.removeAllCallbacks = function () {
        var keys = ExternalSessionStateInterface._d2d_callback_target.dictionary.keys();
        keys.forEach(function (callback) {
            var targets = ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback).keys();
            targets.forEach(function (target) {
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
            });
        });


        ExternalSessionStateInterface._d2d_callback_target = new weavecore.Dictionary2D(true, true);
    }

    function externalError() {
        var args = Array.prototype.slice.call(arguments);
        var format = args.shift();
        var str = weavecore.StandardLib.substitute(format, args);
        // temporary solution for Flash not escaping double-quotes when generating JavaScript throw statement
        str = weavecore.StandardLib.replace(str, '"', "'");
        throw new Error(str);
    }



    function externalWarning() {
        var args = Array.prototype.slice.call(arguments);
        var format = args.shift();
        externalError(weavecore.StandardLib.substitute("Warning: " + format, args));
    }

    weavecore.ExternalSessionStateInterface = ExternalSessionStateInterface;

}());

if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This class saves the session history of an ILinkableObject.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    /**
     * This is an entry in the session history log.  It contains both undo and redo session state diffs.
     * The triggerDelay is the time it took for the user to make a change since the last synchronization.
     * This time difference does not include the time it took to set the session state.  This way, when
     * the session state is replayed at a reasonable speed regardless of the speed of the computer.
     * @param id
     * @param forward The diff for applying redo.
     * @param backward The diff for applying undo.
     * @param triggerDelay The length of time between the last synchronization and the diff.
     */
    function LogEntry(id, forward, backward, triggerDelay, diffDuration) {
        this.id = id;
        this.forward = forward; // the diff for applying redo
        this.backward = backward; // the diff for applying undo
        this.triggerDelay = triggerDelay; // the length of time between the last synchronization and the diff
        this.diffDuration = diffDuration; // the length of time in which the diff took place
    }

    /**
     * This will convert an Array of generic objects to an Array of LogEntry objects.
     * Generic objects are easier to create backwards compatibility for.
     */
    LogEntry.convertGenericObjectsToLogEntries = function (array, defaultTriggerDelay) {
        for (var i = 0; i < array.length; i++) {
            var o = array[i];
            if (!(o instanceof LogEntry))
                array[i] = new LogEntry(o.id, o.forward, o.backward, o.triggerDelay || defaultTriggerDelay, o.diffDuration);
        }
        return array;
    };


    function getTimer() {
        var start = new Date().getTime();
        return start;
    }

    function SessionStateLog(subject, syncDelay) {
        // set default values
        if (syncDelay === undefined)
            syncDelay = 0;
        this._subject = subject; // the object we are monitoring
        this._syncDelay = syncDelay; // the number of milliseconds to wait before automatically synchronizing
        this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject); // remember the initial state

        /**
         * When this is set to true, changes in the session state of the subject will be automatically logged.
         */
        SessionStateLog.prototype.enableLogging = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(true), this.synchronizeNow.bind(this));


        WeaveAPI.SessionManager.registerDisposableChild(this._subject, this); // make sure this is disposed when _subject is disposed

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this._subject);
        cc.addImmediateCallback(this, this._immediateCallback.bind(this));
        cc.addGroupedCallback(this, this._groupedCallback.bind(this));

        this._undoHistory = []; // diffs that can be undone
        this._redoHistory = []; // diffs that can be redone
        this._nextId = 0; // gets incremented each time a new diff is created
        this._undoActive = false; // true while an undo operation is active
        this._redoActive = false; // true while a redo operation is active

        this._syncTime = getTimer(); // this is set to getTimer() when synchronization occurs
        this._triggerDelay = -1; // this is set to (getTimer() - _syncTime) when immediate callbacks are triggered for the first time since the last synchronization occurred
        this._saveTime = 0; // this is set to getTimer() + _syncDelay to determine when the next diff should be computed and logged
        this._savePending = false; // true when a diff should be computed

        Object.defineProperty(SessionStateLog, 'debug', {
            value: false,
            writable: true
        });
        Object.defineProperty(SessionStateLog, 'enableHistoryRewrite', {
            value: true,
            writable: true
        });

        /**
         * @TODO create an interface for the objects in this Array
         */
        Object.defineProperty(this, 'undoHistory', {
            get: function () {
                return this._undoHistory;
            }
        });

        /**
         * @TODO create an interface for the objects in this Array
         */
        Object.defineProperty(this, 'redoHistory', {
            get: function () {
                return this._redoHistory;
            }
        });

    }

    SessionStateLog.prototype = new weavecore.LinkableVariable();
    SessionStateLog.prototype.constructor = SessionStateLog;

    var p = SessionStateLog.prototype;


    /**
     * @inheritDoc
     */
    p.dispose = function () {
        if (this._undoHistory === null || this._undoHistory === undefined)
            console.log("SessionStateLog.dispose() called more than once");

        this._subject = null;
        this._undoHistory = null;
        this._redoHistory = null;
    };

    /**
     * This function will save any pending diff in session state.
     * Use this function only when necessary (for example, when writing a collaboration service that must synchronize).
     */
    p.synchronizeNow = function () {
        this._saveDiff.call(this, true);
    };



    /**
     * This gets called as an immediate callback of the subject.
     */
    p._immediateCallback = function () {
        if (!this.enableLogging.value)
            return;

        // we have to wait until grouped callbacks are called before we save the diff
        this._saveTime = Number.MAX_VALUE;

        // make sure only one call to saveDiff() is pending
        if (!this._savePending) {
            this._savePending = true;
            this._saveDiff.call(this);
        }


        if (SessionStateLog.debug && (this._undoActive || this._redoActive)) {
            var state = WeaveAPI.SessionManager.getSessionState(this._subject);
            var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
            console.log('immediate diff:', forwardDiff);
        }
    };

    /**
     * This gets called as a grouped callback of the subject.
     */
    p._groupedCallback = function () {
        if (!this.enableLogging.value)
            return;

        // Since grouped callbacks are currently running, it means something changed, so make sure the diff is saved.
        this._immediateCallback();
        // It is ok to save a diff some time after the last time grouped callbacks are called.
        // If callbacks are triggered again before the next frame, the immediateCallback will reset this value.
        this._saveTime = getTimer() + this._syncDelay;

        if (SessionStateLog.debug && (this._undoActive || this._redoActive)) {
            var state = WeaveAPI.SessionManager.getSessionState(this._subject);
            var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
            console.log('grouped diff:', forwardDiff);
        }
    };

    /**
     * This will save a diff in the history, if there is any.
     * @param immediately Set to true if it should be saved immediately, or false if it can wait.
     */
    p._saveDiff = function (immediately) {
        //console.log("save difference is called");
        if (immediately === undefined) {
            immediately = false;
        }
        if (!this.enableLogging.value) {
            this._savePending = false;
            return;
        }

        var currentTime = getTimer();

        // remember how long it's been since the last synchronization
        if (this._triggerDelay < 0)
            this._triggerDelay = currentTime - this._rsyncTime;

        if (!immediately && getTimer() < this._saveTime) {
            // console.log("save difference is Paused");
            // we have to wait until the next frame to save the diff because grouped callbacks haven't finished.
            WeaveAPI.StageUtils.callLater(this, this._saveDiff.bind(this));
            return;
        }

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks.call(cc);

        // console.log("save difference is executed");

        var state = WeaveAPI.SessionManager.getSessionState(this._subject);
        var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
        if (forwardDiff !== undefined) {
            var diffDuration = currentTime - (this._rsyncTime + this._triggerDelay);
            var backwardDiff = WeaveAPI.SessionManager.computeDiff(state, this._prevState);
            var oldEntry;
            var newEntry;
            if (this._undoActive) {
                // To prevent new undo history from being added as a result of applying an undo, overwrite first redo entry.
                // Keep existing delay/duration.
                oldEntry = this._redoHistory[0];
                newEntry = new LogEntry(this._nextId++, backwardDiff, forwardDiff, oldEntry.triggerDelay, oldEntry.diffDuration);
                if (this.enableHistoryRewrite) {
                    this._redoHistory[0] = newEntry;
                } else if (weavecore.StandardLib.compare(oldEntry.forward, newEntry.forward) !== 0) {
                    this._redoHistory.unshift(newEntry);
                }
            } else {
                newEntry = new LogEntry(this._nextId++, forwardDiff, backwardDiff, this._triggerDelay, diffDuration);
                if (this._redoActive) {
                    // To prevent new undo history from being added as a result of applying a redo, overwrite last undo entry.
                    // Keep existing delay/duration.
                    oldEntry = this._undoHistory.pop();
                    newEntry.triggerDelay = oldEntry.triggerDelay;
                    newEntry.diffDuration = oldEntry.diffDuration;

                    if (!this.enableHistoryRewrite && weavecore.StandardLib.compare(oldEntry.forward, newEntry.forward) === 0)
                        newEntry = oldEntry; // keep old entry
                }
                // save new undo entry
                this._undoHistory.push(newEntry);
            }

            if (SessionStateLog.debug)
                debugHistory.call(this, newEntry);

            this._rsyncTime = currentTime; // remember when diff was saved
            cc.triggerCallbacks.call(cc);
        }

        // always reset sync time after undo/redo even if there was no new diff
        if (this._undoActive || this._redoActive)
            this._rsyncTime = currentTime;
        this._prevState = state;
        this._undoActive = false;
        this._redoActive = false;
        this._savePending = false;
        this._triggerDelay = -1;

        cc.resumeCallbacks.call(cc);
    };



    /**
     * This will undo a number of steps from the saved history.
     * @param numberOfSteps The number of steps to undo.
     */
    p.undo = function (numberOfSteps) {
        if (isNaN(numberOfSteps))
            numberOfSteps = 1;
        this.applyDiffs.call(this, -numberOfSteps);
    };

    /**
     * This will redo a number of steps that have been previously undone.
     * @param numberOfSteps The number of steps to redo.
     */
    p.redo = function (numberOfSteps) {
        if (isNaN(numberOfSteps))
            numberOfSteps = 1;
        this.applyDiffs.call(this, numberOfSteps);
    };

    /**
     * This will clear all undo and redo history.
     * @param directional Zero will clear everything. Set this to -1 to clear all undos or 1 to clear all redos.
     */
    p.clearHistory = function (directional) {
        if (directional === undefined) directional = 0;
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();

        this.synchronizeNow();

        if (directional <= 0) {
            if (this._undoHistory.length > 0)
                cc.triggerCallbacks("Log: Clear History Undo > 0");
            this._undoHistory.length = 0;
        }
        if (directional >= 0) {
            if (this._redoHistory.length > 0)
                cc.triggerCallbacks("Log: Clear History Redo > 0");
            this._redoHistory.length = 0;
        }

        cc.resumeCallbacks();
    };

    /**
     * This will apply a number of undo or redo steps.
     * @param delta The number of steps to undo (negative) or redo (positive).
     */
    p.applyDiffs = function (delta) {
        var stepsRemaining = Math.min(Math.abs(delta), delta < 0 ? this._undoHistory.length : this._redoHistory.length);
        if (stepsRemaining > 0) {
            var logEntry;
            var diff;
            var debug = SessionStateLog.debug && stepsRemaining === 1;

            // if something changed and we're not currently undoing/redoing, save the diff now
            if (this._savePending && !this._undoActive && !this._redoActive)
                this.synchronizeNow();

            var combine = stepsRemaining > 2;
            var baseDiff = null;
            WeaveAPI.SessionManager.getCallbackCollection(this._subject).delayCallbacks.call(this._subject);
            // when logging is disabled, revert to previous state before applying diffs
            if (!this.enableLogging.value) {
                var state = WeaveAPI.SessionManager.getSessionState(this._subject);
                // baseDiff becomes the change that needs to occur to get back to the previous state
                baseDiff = WeaveAPI.SessionManager.computeDiff(state, this._prevState);
                if (baseDiff !== null && baseDiff !== undefined)
                    combine = true;
            }
            while (stepsRemaining-- > 0) {
                if (delta < 0) {
                    logEntry = this._undoHistory.pop();
                    this._redoHistory.unshift(logEntry);
                    diff = logEntry.backward;
                } else {
                    logEntry = this._redoHistory.shift();
                    this._undoHistory.push(logEntry);
                    diff = logEntry.forward;
                }
                if (debug)
                    console.log('apply ' + (delta < 0 ? 'undo' : 'redo'), logEntry.id + ':', diff);

                if (stepsRemaining === 0 && this.enableLogging.value) {
                    // remember the session state right before applying the last step so we can rewrite the history if necessary
                    this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject);
                }

                if (combine) {
                    baseDiff = WeaveAPI.SessionManager.combineDiff(baseDiff, diff);
                    if (stepsRemaining <= 1) {
                        WeaveAPI.SessionManager.setSessionState(this._subject, baseDiff, false);
                        combine = false;
                    }
                } else {
                    WeaveAPI.SessionManager.setSessionState(this._subject, diff, false);
                }

                if (debug) {
                    var newState = WeaveAPI.SessionManager.getSessionState(this._subject);
                    var resultDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, newState);
                    console.log('resulting diff:', resultDiff);
                }
            }

            WeaveAPI.SessionManager.getCallbackCollection(this._subject).resumeCallbacks.call(this._subject);

            this._undoActive = delta < 0 && this._savePending;
            this._redoActive = delta > 0 && this._savePending;
            if (!this._savePending) {
                this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject);
            }
            var slcc = WeaveAPI.SessionManager.getCallbackCollection(this);
            slcc.triggerCallbacks.call(slcc);
        }
    };



    function debugHistory(logEntry) {
        var h = this._undoHistory.concat();
        for (var i = 0; i < h.length; i++)
            h[i] = h[i].id;
        var f = this._redoHistory.concat();
        for (i = 0; i < f.length; i++)
            f[i] = f[i].id;
        if (logEntry) {
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            console.log('NEW HISTORY (backward) ' + logEntry.id + ':', logEntry.backward);
            console.log("===============================================================");
            console.log('NEW HISTORY (forward) ' + logEntry.id + ':', logEntry.forward);
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        }
        console.log('undo [' + h + ']', 'redo [' + f + ']');
    }

    /**
     * This will generate an untyped session state object that contains the session history log.
     * @return An object containing the session history log.
     */
    p.getSessionState = function () {
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();
        this.synchronizeNow.call(this);

        // The "version" property can be used to detect old session state formats and should be incremented whenever the format is changed.
        var state = {
            "version": 0,
            "currentState": this._prevState,
            "undoHistory": this._undoHistory.concat(),
            "redoHistory": this._redoHistory.concat(),
            "nextId": this._nextId
                // not including enableLogging
        };

        cc.resumeCallbacks();
        return state;
    };

    /**
     * This will load a session state log from an untyped session state object.
     * @param input The ByteArray containing the output from seralize().
     */
    p.setSessionState = function (state) {
        // make sure callbacks only run once while we set the session state
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();
        this.enableLogging.delayCallbacks();
        try {
            var version = state.version;
            switch (version) {
            case 0:
                {
                    // note: some states from version 0 may include enableLogging, but here we ignore it					
                    this._prevState = state.currentState;
                    this._undoHistory = LogEntry.convertGenericObjectsToLogEntries(state.undoHistory, this._syncDelay);
                    this._redoHistory = LogEntry.convertGenericObjectsToLogEntries(state.redoHistory, this._syncDelay);
                    this._nextId = state.nextId;

                    break;
                }
            default:
                console.log("Weave history format version " + version + " is unsupported.");
            }

            // reset these flags so nothing unexpected happens in later frames
            this._undoActive = false;
            this._redoActive = false;
            this._savePending = false;
            this._saveTime = 0;
            this._triggerDelay = -1;
            this._rsyncTime = getTimer();

            WeaveAPI.SessionManager.setSessionState(this._subject, this._prevState);
        } finally {
            this.enableLogging.resumeCallbacks();
            cc.triggerCallbacks("Log: Setsessionstate");
            cc.resumeCallbacks();
        }
    };
    weavecore.SessionStateLog = SessionStateLog;
    weavecore.ClassUtils.registerClass('weavecore.SessionStateLog', SessionStateLog);

}());

/* ***** BEGIN LICENSE BLOCK *****
 *
 * This file is part of Weave.
 *
 * The Initial Developer of Weave is the Institute for Visualization
 * and Perception Research at the University of Massachusetts Lowell.
 * Portions created by the Initial Developer are Copyright (C) 2008-2015
 * the Initial Developer. All Rights Reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * The Weave instance.
 * @namespace weave
 * @name weave
 */
//"use strict";

if (typeof window === 'undefined') {
    this.weave = this.weave || {};
} else {
    window.weave = window.weave || {};
}



//WeaveAPI.addJsonExtension();



//register all weave-method
(function () {
    var es = new weavecore.ExternalSessionStateInterface();
    keys = Object.keys(es.__proto__);
    keys.forEach(function (key) {
        if (key !== 'constructor' && es[key] instanceof Function)
            weavecore.JavaScript.registerMethod.call(weave, key, es[key]);
    });

}());


var asFunction_lookup = {};
/**
 * Provides backwards compatibility for callbacks given as strings.
 * Also sets callback['this'] = thisArg, if provided, which is used by Weave when calling the function.
 */
function asFunction(callback, thisArg) {
    if (typeof callback === 'string')
        callback = asFunction_lookup[callback] || (asFunction_lookup[callback] = function () {
            return window.eval('(' + callback + ')()');
        });
    if (thisArg !== undefined)
        callback['this'] = thisArg;
    return callback;
}

var _addCallback = weave.addCallback;

weave.addCallback = function (target, callback, triggerNow, immediateMode, delayWhileBusy) {
    callback = asFunction(callback, Array.isArray(target) ? weave.path(target) : weave.path());
    /*if (!immediateMode)
        callback = WeaveAPI.StageUtils.callLater(this, callback);*/
    return _addCallback.apply(this, Array.prototype.slice.call(arguments));
};

var _removeCallback = weave.removeCallback;

weave.removeCallback = function (target, callback, everywhere) {
    return _removeCallback.call(this, target, asFunction(callback), everywhere);
};

var _loadFile = weave.loadFile;

weave.loadFile = function (url, callback, noCacheHack) {
    return _loadFile.call(this, url, asFunction(callback), noCacheHack);
};

/**
 * Creates a WeavePath object.  WeavePath objects are immutable after they are created.
 * This is a shortcut for "new weave.WeavePath(basePath)".
 * @param basePath An optional Array (or multiple parameters) specifying the path to an object in the session state.
 *                 A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A WeavePath object.
 * @see  weave.WeavePath
 */
weave.path = function ( /*...basePath*/ ) {
    var basePath = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
    return new weave.WeavePath(basePath);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * WeavePath constructor.  WeavePath objects are immutable after they are created.
 * @class WeavePath
 * @param basePath An optional Array (or multiple parameters) specifying the path to an object in the session state.
 *                 A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A WeavePath object.
 */
weave.WeavePath = function ( /*...basePath*/ ) {
    // "private" instance variables
    this._path = this._A(arguments, 1);
    this._parent = null; // parent WeavePath returned by pop()
};



// "private" shared properties

/**
 * Stores JavaScript variables common to all WeavePath objects.
 * Used by vars(), exec(), and getValue()
 * @private
 */
weave.WeavePath.prototype._vars = {};

/**
 * Remembers which JavaScript variables should be unset after the next call to exec() or getValue().
 * @private
 */
weave.WeavePath.prototype._tempVars = {};

/**
 * Cleans up temporary variables.
 * @private
 */
weave.WeavePath.prototype._deleteTempVars = function () {
    var vars = weave.WeavePath.prototype._vars;
    var tempVars = weave.WeavePath.prototype._tempVars;
    for (var key in tempVars)
        if (tempVars[key])
            delete vars[key];
    weave.WeavePath.prototype._tempVars = {};
};

/**
 * Private function for internal use.
 *
 * Converts an arguments object to an Array.
 * @param args An arguments object.
 * @param option An integer flag for special behavior.
 *   - If set to 1, it handles arguments like (...LIST) where LIST can be either an Array or multiple arguments.
 *   - If set to 2, it handles arguments like (...LIST, REQUIRED_PARAM) where LIST can be either an Array or multiple arguments.
 * @private
 */
weave.WeavePath.prototype._A = function (args, option) {
    if (args.length === option && Array.isArray(args[0]))
        return [].concat(args[0], Array.prototype.slice.call(args, 1));
    return Array.prototype.slice.call(args);
};



// public shared properties

/**
 * A pointer to the Weave instance.
 */
weave.WeavePath.prototype.weave = weave;



// public chainable methods

/**
 * Creates a new WeavePath relative to the current one.
 * @param relativePath An Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return A new WeavePath object which remembers the current WeavePath as its parent.
 */
weave.WeavePath.prototype.push = function ( /*...relativePath*/ ) {
    var args = this._A(arguments, 1);
    var newWeavePath = new this.weave.WeavePath(this._path.concat(args));
    newWeavePath._parent = this;
    return newWeavePath;
};

/**
 * Returns to the previous WeavePath that spawned the current one with push().
 * @return The parent WeavePath object.
 */
weave.WeavePath.prototype.pop = function () {
    if (this._parent)
        return this._parent;
    else
        this._failMessage('pop', 'stack is empty');
    return null;
};

/**
 * Requests that an object be created if it doesn't already exist at the current path (or relative path, if specified).
 * This function can also be used to assert that the object at the current path is of the type you expect it to be.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param objectType The name of an ActionScript class in Weave.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.request = function ( /*...relativePath, objectType*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('request', args)) {
        var type = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.requestObject(pathcopy, type) || this._failPath('request', pathcopy);
    }
    return this;
};

/**
 * Removes a dynamically created object.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.remove = function ( /*...relativePath*/ ) {
    var pathcopy = this._path.concat(this._A(arguments, 1));
    weave.removeObject(pathcopy) || this._failPath('remove', pathcopy);
    return this;
};

/**
 * Reorders the children of an ILinkableHashMap at the current path.
 * @param orderedNames An Array (or multiple parameters) specifying ordered child names.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.reorder = function ( /*...orderedNames*/ ) {
    var args = this._A(arguments, 1);
    if (this._assertParams('reorder', args)) {
        this.weave.setChildNameOrder(this._path, args) || this._failMessage('reorder', 'path does not refer to an ILinkableHashMap: ' + this._path);
    }
    return this;
};

/**
 * Sets the session state of the object at the current path or relative to the current path.
 * Any existing dynamically created objects that do not appear in the new state will be removed.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param state The session state to apply.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.state = function ( /*...relativePath, state*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('state', args)) {
        var state = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.setSessionState(pathcopy, state, true) || this._failObject('state', pathcopy);
    }
    return this;
};

/**
 * Applies a session state diff to the object at the current path or relative to the current path.
 * Existing dynamically created objects that do not appear in the new state will remain unchanged.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param diff The session state diff to apply.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.diff = function ( /*...relativePath, diff*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('diff', args)) {
        var diff = args.pop();
        var pathcopy = this._path.concat(args);
        this.weave.setSessionState(pathcopy, diff, false) || this._failObject('diff', pathcopy);
    }
    return this;
};

/**
 * Adds a callback to the object at the current path.
 * When the callback is called, a WeavePath object initialized at the current path will be used as the 'this' context.
 * If the same callback is added to multiple paths, only the last path will be used as the 'this' context.
 * @param callback The callback function.
 * @param triggerCallbackNow Optional parameter, when set to true will trigger the callback now.
 * @param immediateMode Optional parameter, when set to true will use an immediate callback instead of a grouped callback.
 * @param delayWhileBusy Optional parameter, specifies whether to delay the callback while the object is busy. Default is true.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.addCallback = function (callback, triggerCallbackNow, immediateMode, delayWhileBusy) {
    if (this._assertParams('addCallback', arguments)) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this._path);
        this.weave.addCallback.apply(this.weave, args) || this._failObject('addCallback', this._path);
    }
    return this;
};

/**
 * Removes a callback from the object at the current path or from everywhere.
 * @param callback The callback function.
 * @param everywhere Optional parameter, if set to true will remove the callback from every object to which it was added.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.removeCallback = function (callback, everywhere) {
    if (this._assertParams('removeCallback', arguments)) {
        this.weave.removeCallback(this._path, callback, everywhere) || this._failObject('removeCallback', this._path);
    }
    return this;
};

/**
 * Specifies additional variables to be used in subsequent calls to exec() and getValue().
 * The variables will be made globally available for any WeavePath object created from the same Weave instance.
 * @param newVars An object mapping variable names to values.
 * @param temporary Optional parameter. If set to true, these variables will be unset after the next call to exec() or getValue()
 *                  no matter how either function is called, including from inside custom WeavePath functions.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.vars = function (newVars, temporary) {
    for (var key in newVars) {
        this._tempVars[key] = !!temporary;
        this._vars[key] = newVars[key];
    }
    return this;
};

/**
 * Specifies additional libraries to be included in subsequent calls to exec() and getValue().
 * @param libraries An Array (or multiple parameters) specifying ActionScript class names to include as libraries.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.libs = function ( /*...libraries*/ ) {
    var args = this._A(arguments, 1);
    if (this._assertParams('libs', args)) {
        // include libraries for future evaluations
        this.weave.evaluateExpression(null, null, null, args);
    }
    return this;
};

/**
 * Evaluates an ActionScript expression using the current path, vars, and libs.
 * The 'this' context within the script will be the object at the current path.
 * @param script The script to be evaluated by Weave under the scope of the object at the current path.
 * @param callback_or_variableName Optional callback function or variable name.
 * - If given a callback function, the function will be passed the result of
 *   evaluating the expression, setting the 'this' value to the current WeavePath object.
 * - If given a variable name, the result will be stored as a variable
 *   as if it was passed as an object property to WeavePath.vars().  It may then be used
 *   in future calls to WeavePath.exec() or retrieved with WeavePath.getValue().
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.exec = function (script, callback_or_variableName) {
    var type = typeof callback_or_variableName;
    var callback = type === 'function' ? callback_or_variableName : null;
    // Passing "" as the variable name avoids the overhead of converting the ActionScript object to a JavaScript object.
    var variableName = type === 'string' ? callback_or_variableName : "";
    this._vars[''] = Object.keys(this._vars); // include a list of keys in property '' so undefined variables will be preserved
    var result = this.weave.evaluateExpression(this._path, script, this._vars, null, variableName);
    this._deleteTempVars();
    // if an AS var was saved, delete the corresponding JS var if present to avoid overriding it in future expressions
    if (variableName)
        delete this._vars[variableName];
    if (callback)
        callback.apply(this, [result]);

    return this;
};

/**
 * Calls a function using the current WeavePath object as the 'this' value.
 * @param func The function to call.
 * @param args An optional list of arguments to pass to the function.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.call = function (func /*[, ...args]*/ ) {
    if (this._assertParams('call', arguments)) {
        var a = this._A(arguments);
        a.shift().apply(this, a);
    }
    return this;
};

/**
 * Applies a function to each item in an Array or an Object.
 * @param items Either an Array or an Object to iterate over.
 * @param visitorFunction A function to be called for each item in items. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  item, key, items.
 *                        If items is an Array, the key will be an integer. If items is an Object, the key will be a String.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEach = function (items, visitorFunction) {
    if (this._assertParams('forEach', arguments, 2)) {
        if (Array.isArray(items) && Array.prototype.forEach)
            items.forEach(visitorFunction, this);
        else
            for (var key in items) visitorFunction.call(this, items[key], key, items);
    }
    return this;
};

/**
 * Calls a function for each child of the current WeavePath or the one specified by a relativePath. The function receives child names.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param visitorFunction A function to be called for each child object. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  name, index, names.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEachName = function ( /*...relativePath, visitorFunction*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('forEachName', args)) {
        var visitorFunction = args.pop();
        this.getNames(args).forEach(visitorFunction, this);
    }
    return this;
};

/**
 * Calls a function for each child of the current WeavePath or the one specified by a relativePath. The function receives child WeavePath objects.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param visitorFunction A function to be called for each child object. The function will be called using the current
 *                        WeavePath object as the 'this' value and will receive three parameters:  child, index, children.
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.forEachChild = function ( /*...relativePath, visitorFunction*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('forEachChild', args)) {
        var visitorFunction = args.pop();
        this.getChildren(args).forEach(visitorFunction, this);
    }
    return this;
};

/**
 * Calls weaveTrace() in Weave to print to the log window.
 * @param args A list of parameters to pass to weaveTrace().
 * @return The current WeavePath object.
 */
weave.WeavePath.prototype.trace = function ( /* ...args */ ) {
    var args = this._A(arguments);
    this.weave.evaluateExpression(null, "weaveTrace.apply(null, args)", {
        "args": args
    }, null, "");
    return this;
};


// non-chainable methods

/**
 * Returns a copy of the current path Array or the path Array of a descendant object.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names to be appended to the result.
 * @return An Array of successive child names used to identify an object in a Weave session state.
 */
weave.WeavePath.prototype.getPath = function ( /*...relativePath*/ ) {
    return this._path.concat(this._A(arguments, 1));
};

/**
 * Gets an Array of child names under the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return An Array of child names.
 */
weave.WeavePath.prototype.getNames = function ( /*...relativePath*/ ) {
    return this.weave.getChildNames(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets an Array of child WeavePath objects under the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return An Array of child WeavePath objects.
 */
weave.WeavePath.prototype.getChildren = function ( /*...relativePath*/ ) {
    var relativePath = this._A(arguments, 1);
    return this.weave.getChildNames(this._path.concat(relativePath))
        .map(function (name) {
            return new this.weave.WeavePath(this._path.concat(relativePath, name));
        }, this);
};

/**
 * Gets the type (qualified class name) of the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The qualified class name of the object at the current or descendant path, or null if there is no object.
 */
weave.WeavePath.prototype.getType = function ( /*...relativePath*/ ) {
    return this.weave.getObjectType(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets the session state of an object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @return The session state of the object at the current or descendant path.
 */
weave.WeavePath.prototype.getState = function ( /*...relativePath*/ ) {
    return this.weave.getSessionState(this._path.concat(this._A(arguments, 1)));
};

/**
 * Gets the changes that have occurred since previousState for the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param previousState The previous state for comparison.
 * @return A session state diff.
 */
weave.WeavePath.prototype.getDiff = function ( /*...relativePath, previousState*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('getDiff', args)) {
        var previousState = args.pop();
        var pathcopy = this._path.concat(args);
        var script = "return WeaveAPI.SessionManager.computeDiff(previousState, WeaveAPI.SessionManager.getSessionState(this));";
        return this.weave.evaluateExpression(pathcopy, script, {
            "previousState": previousState
        });
    }
    return null;
};

/**
 * Gets the changes that would have to occur to get to another state for the object at the current path or relative to the current path.
 * @param relativePath An optional Array (or multiple parameters) specifying descendant names relative to the current path.
 *                     A child index number may be used in place of a name in the path when its parent object is a LinkableHashMap.
 * @param otherState The other state for comparison.
 * @return A session state diff.
 */
weave.WeavePath.prototype.getReverseDiff = function ( /*...relativePath, otherState*/ ) {
    var args = this._A(arguments, 2);
    if (this._assertParams('getReverseDiff', args)) {
        var otherState = args.pop();
        var pathcopy = this._path.concat(args);
        var script = "return WeaveAPI.SessionManager.computeDiff(WeaveAPI.SessionManager.getSessionState(this), otherState);";
        return this.weave.evaluateExpression(pathcopy, script, {
            "otherState": otherState
        });
    }
    return null;
};

/**
 * Returns the value of an ActionScript expression or variable using the current path, vars, and libs.
 * The 'this' context within the script will be set to the object at the current path.
 * @param script_or_variableName The script to be evaluated by Weave, or simply a variable name.
 * @return The result of evaluating the script or variable.
 */
weave.WeavePath.prototype.getValue = function (script_or_variableName) {
    this._vars[''] = Object.keys(this._vars); // include a list of keys in property '' so undefined variables will be preserved
    var result = this.weave.evaluateExpression(this._path, script_or_variableName, this._vars);
    this._deleteTempVars();
    return result;
};

/**
 * Provides a human-readable string containing the path.
 */
weave.WeavePath.prototype.toString = function () {
    var pathStr = typeof JSON !== 'undefined' && JSON.stringify ? JSON.stringify(this._path) : this._path.toString();
    return "WeavePath(" + pathStr + ")";
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// helper functions
weave.WeavePath.prototype._assertParams = function (methodName, args, minLength) {
    if (!minLength)
        minLength = 1;
    if (args.length < minLength) {
        var msg = 'requires at least ' + ((minLength === 1) ? 'one parameter' : (minLength + ' parameters'));
        this._failMessage(methodName, msg);
        return false;
    }
    return true;
};

weave.WeavePath.prototype._failPath = function (methodName, path) {
    this._failMessage(methodName, 'command failed', path);
};

weave.WeavePath.prototype._failObject = function (methodName, path) {
    this._failMessage(methodName, 'object does not exist', path);
};

weave.WeavePath.prototype._failMessage = function (methodName, message, path) {
    var str = 'WeavePath.' + methodName + '(): ' + message;
    if (path) {
        var pathStr = typeof JSON !== 'undefined' && JSON.stringify ? JSON.stringify(path) : path;
        str += ' (path: ' + pathStr + ')';
    }
    throw new Error(str);
};



//WeaveAPI.addJsonExtension (exec)
(function () {
    weavecore.JavaScript.extendJson(WeaveAPI._jsonReplacer, WeaveAPI._jsonReviver, WeaveAPI._needsReviving);
    var JSON_EXTENSIONS = weavecore.JavaScript.JSON_EXTENSIONS;
    var WP = "WeavePath";

    function replacer(key, value) {
        if (value instanceof weave[WP]) {
            var obj = {};
            obj[WP] = value.getPath();
            return obj;
        }
        return value;
    }

    function reviver(key, value) {
        if (value != null && typeof value === "object" && value.hasOwnProperty(WP) && Array.isArray(value[WP])) {
            for (key in value)
                if (key != WP)
                    return value;
            return weave.path(value[WP]);
        }
        return value;
    }

    weave[JSON_EXTENSIONS].push({
        "description": "ILinkableObject/WeavePath",
        "replacer": replacer,
        "reviver": reviver
    });

})();
