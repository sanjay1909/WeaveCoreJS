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
