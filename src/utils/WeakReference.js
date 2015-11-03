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
        this.dictionary = new WeakMap();

        /**
         * A weak reference to an object.
         */
        Object.defineProperty(this, 'value', {
            get: function () {
                for (var key of this.dictionary.keys())
                    return key;
                return null;
            },
            set: function (newValue) {
                for (var key of this.dictionary.keys()) {
                    // do nothing if value didn't change
                    if (key === newValue)
                        return;
                    this.dictionary.delete(key);
                }
                if (newValue !== null) {

                    if (newValue instanceof Function && newValue.constructor.name !== 'Function')
                        this.dictionary.set(newValue, newValue); // change to null when flash player bug is fixed
                    else
                        this.dictionary.set(newValue, null);
                }
            }

        });

    }

}());
