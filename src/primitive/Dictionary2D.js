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

    /**
     * @private
     */
    Dictionary2D.throwWeakIterationError = function () {
        throw new Error("WeakMap cannot be iterated over");
    };

    function Dictionary2D(weakPrimaryKeys, weakSecondaryKeys, defaultType) {
        weakPrimaryKeys = typeof weakPrimaryKeys !== 'undefined' ? weakPrimaryKeys : false;
        weakSecondaryKeys = typeof weakSecondaryKeys !== 'undefined' ? weakSecondaryKeys : false;
        defaultType = typeof defaultType !== 'undefined' ? defaultType : null;

        this.map = weakPrimaryKeys ? new Map() : new Map();
        this.weak1 = weakPrimaryKeys;
        this.weak2 = weakSecondaryKeys;
        this.defaultType = defaultType;
    }

    var p = Dictionary2D.prototype;


    /**
     * @export
     * @type {Object}
     */
    p.map;


    /**
     * @private
     * @type {boolean}
     */
    p.weak1;


    /**
     * @private
     * @type {boolean}
     */
    p.weak2;


    /**
     * @private
     * @type {Object}
     */
    p.defaultType;

    /**
     * @private
     * @type {*}
     */
    p._key2ToRemove;

    /**
     * @asparam key1 The first map key.
     * @asparam key2 The second map key.
     * @asreturn The value.
     * @export
     * @param {Object} key1
     * @param {Object} key2
     * @return {*}
     */
    p.get = function (key1, key2) {
        var value;
        var map2 = this.map.get(key1);
        if (map2)
            value = map2.get(key2);
        if (value === undefined && this.defaultType) {
            value = new this.defaultType();
            this.set(key1, key2, value);
        }
        return value;
    };

    /**
     * This will add or replace an entry in the map.
     * @asparam key1 The first map key.
     * @asparam key2 The second map key.
     * @asparam value The value.
     * @export
     * @param {Object} key1
     * @param {Object} key2
     * @param {Object} value
     */
    p.set = function (key1, key2, value) {
        var map2 = this.map.get(key1);
        if (map2 === null || map2 === undefined) {
            map2 = this.weak2 ? new Map() : new Map();
            this.map.set(key1, map2);
        }
        map2.set(key2, value);
    };

    /**
     * @export
     * @return {Array}
     */
    p.primaryKeys = function () {
        if (this.weak1)
            Dictionary2D.throwWeakIterationError();
        return weavecore.JS.mapKeys(this.map);
    };

    /**
     * @export
     * @param {Object} key1
     * @return {Array}
     */
    p.secondaryKeys = function (key1) {
        if (this.weak2)
            Dictionary2D.throwWeakIterationError();
        return weavecore.JS.mapKeys(this.map.get(key1));
    };

    /**
     * This removes all values associated with the given primary key.
     * @asparam key1 The first dictionary key.
     * @export
     * @param {Object} key1
     */
    p.removeAllPrimary = function (key1) {
        this.map.delete(key1);
    };

    /**
     * This removes all values associated with the given secondary key.
     * @asparam key2 The second dictionary key.
     * @asprivate
     * @export
     * @param {Object} key2
     */
    p.removeAllSecondary = function (key2) {
        if (this.weak1)
            Dictionary2D.throwWeakIterationError();
        this._key2ToRemove = key2;
        this.map.forEach(this.removeAllSecondary_each, this);
    };

    /**
     * @private
     * @param {*} map2
     * @param {*} key1
     */
    p.removeAllSecondary_each = function (map2, key1) {
        map2['delete'](this._key2ToRemove);
    };

    /**
     * This removes a value associated with the given primary and secondary keys.
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @return The value that was in the dictionary.
     */
    p.remove = function (key1, key2) {
        var value;
        var map2 = this.map.get(key1);
        if (map2) {
            value = map2.get(key2);
            map2.delete(key2);
            if (this.weak2 || map2.size)
                return value;
            this.map.delete(key1);
        }

        return value;
    };




    /**
     * @private
     * @type {Function}
     */
    p.forEach_fn;


    /**
     * @private
     * @type {Object}
     */
    p.forEach_this;


    /**
     * @private
     * @type {Object}
     */
    p.forEach_key1;


    /**
     * @private
     * @type {Object}
     */
    p.forEach_map2;


    /**
     * Iterates over pairs of keys and corresponding values.
     * @asparam key1_key2_value A function which may return true to stop iterating.
     * @asparam thisArg The 'this' argument for the function.
     * @export
     * @param {Function} key1_key2_value
     * @param {Object} thisArg
     */
    p.forEach = function (key1_key2_value, thisArg) {
        if (this.weak1 || this.weak2)
            Dictionary2D.throwWeakIterationError();
        this.forEach_fn = key1_key2_value;
        this.forEach_this = thisArg;
        this.map.forEach(this.forEach1, this);
        this.forEach_fn = null;
        this.forEach_this = null;
        this.forEach_key1 = null;
        this.forEach_map2 = null;
    };

    /**
     * @private
     * @param {*} map2
     * @param {*} key1
     */
    p.forEach1 = function (map2, key1) {
        if (this.forEach_fn == null)
            return;
        this.forEach_key1 = key1;
        this.forEach_map2 = map2;
        map2.forEach(this.forEach2, this);
    };


    /**
     * @private
     * @param {*} value
     * @param {*} key2
     */
    p.forEach2 = function (value, key2) {
        if (this.forEach_fn !== null && this.forEach_fn.call(this.forEach_this, this.forEach_key1, key2, value))
            this.forEach_fn = null;
    };

    weavecore.Dictionary2D = Dictionary2D;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'Dictionary2D',
            qName: 'weavecore.Dictionary2D'
        }]
    };

}());
