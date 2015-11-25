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
