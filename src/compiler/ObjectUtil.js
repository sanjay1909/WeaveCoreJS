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


    /**
     *
     */
    /*ObjectUtil.copy = function (object) {

        if (object === null || typeof object !== 'object') // primitive value
            return object;

        else if (object.constructor === Array) { //TODO:Temp solution for array copy - its a shallow copy now)
            var arrayCopy = []
            if (object.length > 0)
                arrayCopy = Object.getPrototypeOf(Object.create(object)).slice(0);
            return arrayCopy;
        } else { // make copies of non-primitives
            var jsonString = JSON.stringify(object);
            var copy = JSON.parse(jsonString);
            return copy;
        }
    }*/

    /**
     * Makes a deep copy of an object.
     * @export
     * @param {Object} object
     * @return {Object}
     */
    ObjectUtil.copy = function (object) {
        if (object === null || typeof (object) !== 'object')
            return object;
        var copy = object.constructor === Array ? [] : {};
        for (var key in object)
            copy[key] = ObjectUtil.copyObject(object[key]);
        return copy;
    };

    weavecore.ObjectUtil = ObjectUtil;

}());
