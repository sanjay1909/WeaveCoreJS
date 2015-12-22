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

    var p = LogEntry.prototype;


    /**
     * @export
     * @type {number}
     */
    p.id;


    /**
     * @export
     * @type {Object}
     */
    p.forward;


    /**
     * @export
     * @type {Object}
     */
    p.backward;


    /**
     * @export
     * @type {number}
     */
    p.triggerDelay;


    /**
     * @export
     * @type {number}
     */
    p.diffDuration;

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
    weavecore.LogEntry = LogEntry

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LogEntry',
            qName: 'weavecore.LogEntry'
        }]
    };

}())
