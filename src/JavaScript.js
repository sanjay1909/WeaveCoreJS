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
        'DEBOUNCE': { //The name of the property used to store a function that will cache a debounced version of a function to be used when reviving functions from JSON.
            value: "_debounce"
        },
        'JSON_SUFFIX': { //A random String which is highly unlikely to appear in any String value.  Used as a suffix for <code>NaN, -Infinity, Infinity</code>.
            value: ';' + Math.random() + ';' + new Date()
        }

    });

    Object.defineProperty(JavaScript, 'POLYFILLS', {
        value: `
			if (!Array.isArray)
				Array.isArray = function(arg) { return Object.prototype.toString.call(arg) === '[object Array]'; };

			if (!Array.prototype.map)
				Array.prototype.map = function(callback, thisArg) {
					var T, A, k;
					if (this == null)
						throw new TypeError(" this is null or not defined");
					var O = Object(this);
					var len = O.length >>> 0;
					if (typeof callback !== "function")
						throw new TypeError(callback + " is not a function");
					if (arguments.length > 1)
						T = thisArg;
					A = new Array(len);
					k = 0;
					while (k < len) {
						var kValue, mappedValue;
						if (k in O) {
							kValue = O[k];
							mappedValue = callback.call(T, kValue, k, O);
							A[k] = mappedValue;
						}
						k++;
					}
					return A;
				};

			if (!Object.keys)
				Object.keys = (function () {
					'use strict';
					var hasOwnProperty = Object.prototype.hasOwnProperty,
					hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
					dontEnums = [
						'toString',
						'toLocaleString',
						'valueOf',
						'hasOwnProperty',
						'isPrototypeOf',
						'propertyIsEnumerable',
						'constructor'
					],
					dontEnumsLength = dontEnums.length;

					return function (obj) {
						if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null))
							throw new TypeError('Object.keys called on non-object');

						var result = [], prop, i;

						for (prop in obj)
							if (hasOwnProperty.call(obj, prop))
								result.push(prop);

						if (hasDontEnumBug)
							for (i = 0; i < dontEnumsLength; i++)
								if (hasOwnProperty.call(obj, dontEnums[i]))
									result.push(dontEnums[i]);
						return result;
					};
				}());

			if (!Function.prototype.bind)
				Function.prototype.bind = function (oThis) {
					if (typeof this !== "function")
						throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");

					var aArgs = Array.prototype.slice.call(arguments, 1),
						fToBind = this,
						fNOP = function () {},
						fBound = function () {
							return fToBind.apply(this instanceof fNOP && oThis
								? this
								: oThis,
								aArgs.concat(Array.prototype.slice.call(arguments)));
						};

					fNOP.prototype = this.prototype;
					fBound.prototype = new fNOP();

					return fBound;
				};
		 `
    });

    Object.defineProperty(JavaScript, 'LODASH_DEBOUNCE', {
        value: `
			/**
			 * lodash 4.0.0-pre <https://lodash.com/>
			 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
			 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
			 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
			 * Available under MIT license <https://lodash.com/license>
			 */

			/**
			 * Checks if value is the [language type](https://es5.github.io/#x8) of Object.
			 * (e.g. arrays, functions, objects, regexes, new Number(0), and new String(''))
			 *
			 * @static
			 * @memberOf _
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns true if value is an object, else false.
			 * @example
			 *
			 * _.isObject({});
			 * // => true
			 *
			 * _.isObject([1, 2, 3]);
			 * // => true
			 *
			 * _.isObject(_.noop);
			 * // => true
			 *
			 * _.isObject(null);
			 * // => false
			 */
			function isObject(value) {
			  // Avoid a V8 JIT bug in Chrome 19-20.
			  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
			  var type = typeof value;
			  return !!value && (type == 'object' || type == 'function');
			}

			/**
			 * Creates a debounced function that delays invoking func until after wait
			 * milliseconds have elapsed since the last time the debounced function was
			 * invoked. The debounced function comes with a cancel method to cancel
			 * delayed func invocations and a flush method to immediately invoke them.
			 * Provide an options object to indicate that func should be invoked on the
			 * leading and/or trailing edge of the wait timeout. Subsequent calls to the
			 * debounced function return the result of the last func invocation.
			 *
			 * **Note:** If leading and trailing options are true, func is invoked
			 * on the trailing edge of the timeout only if the the debounced function is
			 * invoked more than once during the wait timeout.
			 *
			 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
			 * for details over the differences between _.debounce and _.throttle.
			 *
			 * @static
			 * @memberOf _
			 * @category Function
			 * @param {Function} func The function to debounce.
			 * @param {number} [wait=0] The number of milliseconds to delay.
			 * @param {Object} [options] The options object.
			 * @param {boolean} [options.leading=false] Specify invoking on the leading
			 *  edge of the timeout.
			 * @param {number} [options.maxWait] The maximum time func is allowed to be
			 *  delayed before it's invoked.
			 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
			 *  edge of the timeout.
			 * @returns {Function} Returns the new debounced function.
			 * @example
			 *
			 * // avoid costly calculations while the window size is in flux
			 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
			 *
			 * // invoke sendMail when the click event is fired, debouncing subsequent calls
			 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
			 *   'leading': true,
			 *   'trailing': false
			 * }));
			 *
			 * // ensure batchLog is invoked once after 1 second of debounced calls
			 * var source = new EventSource('/stream');
			 * jQuery(source).on('message', _.debounce(batchLog, 250, {
			 *   'maxWait': 1000
			 * }));
			 *
			 * // cancel a debounced call
			 * var todoChanges = _.debounce(batchLog, 1000);
			 * Object.observe(models.todo, todoChanges);
			 *
			 * Object.observe(models, function(changes) {
			 *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
			 *     todoChanges.cancel();
			 *   }
			 * }, ['delete']);
			 *
			 * // ...at some point models.todo is changed
			 * models.todo.completed = true;
			 *
			 * // ...before 1 second has passed models.todo is deleted
			 * // which cancels the debounced todoChanges call
			 * delete models.todo;
			 */
			function debounce(func, wait, options) {
			  var args,
			      maxTimeoutId,
			      result,
			      stamp,
			      thisArg,
			      timeoutId,
			      trailingCall,
			      lastCalled = 0,
			      leading = false,
			      maxWait = false,
			      trailing = true;

			  if (typeof func != 'function') {
			    throw new TypeError(FUNC_ERROR_TEXT);
			  }
			  wait = wait < 0 ? 0 : (+wait || 0);
			  if (isObject(options)) {
			    leading = !!options.leading;
			    maxWait = 'maxWait' in options && Math.max(+options.maxWait || 0, wait);
			    trailing = 'trailing' in options ? !!options.trailing : trailing;
			  }

			  function cancel() {
			    if (timeoutId) {
			      clearTimeout(timeoutId);
			    }
			    if (maxTimeoutId) {
			      clearTimeout(maxTimeoutId);
			    }
			    lastCalled = 0;
			    args = maxTimeoutId = thisArg = timeoutId = trailingCall = undefined;
			  }

			  function complete(isCalled, id) {
			    if (id) {
			      clearTimeout(id);
			    }
			    maxTimeoutId = timeoutId = trailingCall = undefined;
			    if (isCalled) {
			      lastCalled = Date.now();
			      result = func.apply(thisArg, args);
			      if (!timeoutId && !maxTimeoutId) {
			        args = thisArg = undefined;
			      }
			    }
			  }

			  function delayed() {
			    var remaining = wait - (Date.now() - stamp);
			    if (remaining <= 0 || remaining > wait) {
			      complete(trailingCall, maxTimeoutId);
			    } else {
			      timeoutId = setTimeout(delayed, remaining);
			    }
			  }

			  function flush() {
			    if ((timeoutId && trailingCall) || (maxTimeoutId && trailing)) {
			      result = func.apply(thisArg, args);
			    }
			    cancel();
			    return result;
			  }

			  function maxDelayed() {
			    complete(trailing, timeoutId);
			  }

			  function debounced() {
			    args = arguments;
			    stamp = Date.now();
			    thisArg = this;
			    trailingCall = trailing && (timeoutId || !leading);

			    if (maxWait === false) {
			      var leadingCall = leading && !timeoutId;
			    } else {
			      if (!maxTimeoutId && !leading) {
			        lastCalled = stamp;
			      }
			      var remaining = maxWait - (stamp - lastCalled),
			          isCalled = remaining <= 0 || remaining > maxWait;

			      if (isCalled) {
			        if (maxTimeoutId) {
			          maxTimeoutId = clearTimeout(maxTimeoutId);
			        }
			        lastCalled = stamp;
			        result = func.apply(thisArg, args);
			      }
			      else if (!maxTimeoutId) {
			        maxTimeoutId = setTimeout(maxDelayed, remaining);
			      }
			    }
			    if (isCalled && timeoutId) {
			      timeoutId = clearTimeout(timeoutId);
			    }
			    else if (!timeoutId && wait !== maxWait) {
			      timeoutId = setTimeout(delayed, wait);
			    }
			    if (leadingCall) {
			      isCalled = true;
			      result = func.apply(thisArg, args);
			    }
			    if (isCalled && !timeoutId && !maxTimeoutId) {
			      args = thisArg = undefined;
			    }
			    return result;
			  }
			  debounced.cancel = cancel;
			  debounced.flush = flush;
			  return debounced;
			}
		  `
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
            var DEBOUNCE = JavaScript.DEBOUNCE;

            //PolyFills - CODE
            if (!Array.isArray)
                Array.isArray = function (arg) {
                    return Object.prototype.toString.call(arg) === '[object Array]';
                };

            if (!Array.prototype.map)
                Array.prototype.map = function (callback, thisArg) {
                    var T, A, k;
                    if (this == null)
                        throw new TypeError(" this is null or not defined");
                    var O = Object(this);
                    var len = O.length >>> 0;
                    if (typeof callback !== "function")
                        throw new TypeError(callback + " is not a function");
                    if (arguments.length > 1)
                        T = thisArg;
                    A = new Array(len);
                    k = 0;
                    while (k < len) {
                        var kValue, mappedValue;
                        if (k in O) {
                            kValue = O[k];
                            mappedValue = callback.call(T, kValue, k, O);
                            A[k] = mappedValue;
                        }
                        k++;
                    }
                    return A;
                };

            if (!Object.keys)
                Object.keys = (function () {
                    'use strict';
                    var hasOwnProperty = Object.prototype.hasOwnProperty,
                        hasDontEnumBug = !({
                            toString: null
                        }).propertyIsEnumerable('toString'),
                        dontEnums = [
						'toString',
						'toLocaleString',
						'valueOf',
						'hasOwnProperty',
						'isPrototypeOf',
						'propertyIsEnumerable',
						'constructor'
					],
                        dontEnumsLength = dontEnums.length;

                    return function (obj) {
                        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null))
                            throw new TypeError('Object.keys called on non-object');

                        var result = [],
                            prop, i;

                        for (prop in obj)
                            if (hasOwnProperty.call(obj, prop))
                                result.push(prop);

                        if (hasDontEnumBug)
                            for (i = 0; i < dontEnumsLength; i++)
                                if (hasOwnProperty.call(obj, dontEnums[i]))
                                    result.push(dontEnums[i]);
                        return result;
                    };
                }());

            if (!Function.prototype.bind)
                Function.prototype.bind = function (oThis) {
                    if (typeof this !== "function")
                        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");

                    var aArgs = Array.prototype.slice.call(arguments, 1),
                        fToBind = this,
                        fNOP = function () {},
                        fBound = function () {
                            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                                aArgs.concat(Array.prototype.slice.call(arguments)));
                        };

                    fNOP.prototype = this.prototype;
                    fBound.prototype = new fNOP();

                    return fBound;
                };

            //LODASH - DEBOUNCE -code
            /**
             * lodash 4.0.0-pre <https://lodash.com/>
             * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
             * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
             * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
             * Available under MIT license <https://lodash.com/license>
             */

            /**
             * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
             * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
             *
             * @static
             * @memberOf _
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an object, else `false`.
             * @example
             *
             * _.isObject({});
             * // => true
             *
             * _.isObject([1, 2, 3]);
             * // => true
             *
             * _.isObject(_.noop);
             * // => true
             *
             * _.isObject(null);
             * // => false
             */
            function isObject(value) {
                // Avoid a V8 JIT bug in Chrome 19-20.
                // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
                var type = typeof value;
                return !!value && (type == 'object' || type == 'function');
            }

            /**
             * Creates a debounced function that delays invoking `func` until after `wait`
             * milliseconds have elapsed since the last time the debounced function was
             * invoked. The debounced function comes with a `cancel` method to cancel
             * delayed `func` invocations and a `flush` method to immediately invoke them.
             * Provide an options object to indicate that `func` should be invoked on the
             * leading and/or trailing edge of the `wait` timeout. Subsequent calls to the
             * debounced function return the result of the last `func` invocation.
             *
             * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
             * on the trailing edge of the timeout only if the the debounced function is
             * invoked more than once during the `wait` timeout.
             *
             * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
             * for details over the differences between `_.debounce` and `_.throttle`.
             *
             * @static
             * @memberOf _
             * @category Function
             * @param {Function} func The function to debounce.
             * @param {number} [wait=0] The number of milliseconds to delay.
             * @param {Object} [options] The options object.
             * @param {boolean} [options.leading=false] Specify invoking on the leading
             *  edge of the timeout.
             * @param {number} [options.maxWait] The maximum time `func` is allowed to be
             *  delayed before it's invoked.
             * @param {boolean} [options.trailing=true] Specify invoking on the trailing
             *  edge of the timeout.
             * @returns {Function} Returns the new debounced function.
             * @example
             *
             * // avoid costly calculations while the window size is in flux
             * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
             *
             * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
             * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
             *   'leading': true,
             *   'trailing': false
             * }));
             *
             * // ensure `batchLog` is invoked once after 1 second of debounced calls
             * var source = new EventSource('/stream');
             * jQuery(source).on('message', _.debounce(batchLog, 250, {
             *   'maxWait': 1000
             * }));
             *
             * // cancel a debounced call
             * var todoChanges = _.debounce(batchLog, 1000);
             * Object.observe(models.todo, todoChanges);
             *
             * Object.observe(models, function(changes) {
             *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
             *     todoChanges.cancel();
             *   }
             * }, ['delete']);
             *
             * // ...at some point `models.todo` is changed
             * models.todo.completed = true;
             *
             * // ...before 1 second has passed `models.todo` is deleted
             * // which cancels the debounced `todoChanges` call
             * delete models.todo;
             */
            function debounce(func, wait, options) {
                var args,
                    maxTimeoutId,
                    result,
                    stamp,
                    thisArg,
                    timeoutId,
                    trailingCall,
                    lastCalled = 0,
                    leading = false,
                    maxWait = false,
                    trailing = true;

                if (typeof func != 'function') {
                    throw new TypeError(FUNC_ERROR_TEXT);
                }
                wait = wait < 0 ? 0 : (+wait || 0);
                if (isObject(options)) {
                    leading = !!options.leading;
                    maxWait = 'maxWait' in options && Math.max(+options.maxWait || 0, wait);
                    trailing = 'trailing' in options ? !!options.trailing : trailing;
                }

                function cancel() {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    if (maxTimeoutId) {
                        clearTimeout(maxTimeoutId);
                    }
                    lastCalled = 0;
                    args = maxTimeoutId = thisArg = timeoutId = trailingCall = undefined;
                }

                function complete(isCalled, id) {
                    if (id) {
                        clearTimeout(id);
                    }
                    maxTimeoutId = timeoutId = trailingCall = undefined;
                    if (isCalled) {
                        lastCalled = Date.now();
                        result = func.apply(thisArg, args);
                        if (!timeoutId && !maxTimeoutId) {
                            args = thisArg = undefined;
                        }
                    }
                }

                function delayed() {
                    var remaining = wait - (Date.now() - stamp);
                    if (remaining <= 0 || remaining > wait) {
                        complete(trailingCall, maxTimeoutId);
                    } else {
                        timeoutId = setTimeout(delayed, remaining);
                    }
                }

                function flush() {
                    if ((timeoutId && trailingCall) || (maxTimeoutId && trailing)) {
                        result = func.apply(thisArg, args);
                    }
                    cancel();
                    return result;
                }

                function maxDelayed() {
                    complete(trailing, timeoutId);
                }

                function debounced() {
                    args = arguments;
                    stamp = Date.now();
                    thisArg = this;
                    trailingCall = trailing && (timeoutId || !leading);

                    if (maxWait === false) {
                        var leadingCall = leading && !timeoutId;
                    } else {
                        if (!maxTimeoutId && !leading) {
                            lastCalled = stamp;
                        }
                        var remaining = maxWait - (stamp - lastCalled),
                            isCalled = remaining <= 0 || remaining > maxWait;

                        if (isCalled) {
                            if (maxTimeoutId) {
                                maxTimeoutId = clearTimeout(maxTimeoutId);
                            }
                            lastCalled = stamp;
                            result = func.apply(thisArg, args);
                        } else if (!maxTimeoutId) {
                            maxTimeoutId = setTimeout(maxDelayed, remaining);
                        }
                    }
                    if (isCalled && timeoutId) {
                        timeoutId = clearTimeout(timeoutId);
                    } else if (!timeoutId && wait !== maxWait) {
                        timeoutId = setTimeout(delayed, wait);
                    }
                    if (leadingCall) {
                        isCalled = true;
                        result = func.apply(thisArg, args);
                    }
                    if (isCalled && !timeoutId && !maxTimeoutId) {
                        args = thisArg = undefined;
                    }
                    return result;
                }
                debounced.cancel = cancel;
                debounced.flush = flush;
                return debounced;
            }

            // Weave - CODE
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
            flash[DEBOUNCE] = function (func, wait) {
                if (func.hasOwnProperty('cancel') && func.hasOwnProperty('flush') && func.hasOwnProperty(JSON_FUNCTION_PREFIX))
                    return func;
                var id = flash[JSON_REPLACER]('', func);
                var debounced = debounce(func, wait);
                debounced['this'] = func['this'];
                debounced[JSON_FUNCTION_PREFIX] = id;
                return lookup[id] = debounced;
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
