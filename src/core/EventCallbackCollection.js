(function () {
    // Internal class constructor

    Object.defineProperty(EventCallbackCollection, 'eventTypes', {
        value: ['tick']
    });

    function EventCallbackCollection(eventManager, eventType) {
        EventCallbackCollection.base(this, 'constructor', this.setEvent);
        this._eventManager = eventManager;
        this._eventType = eventType;

        this._tickerListener = goog.bind(_tickerListener, this);

    }

    goog.inherits(EventCallbackCollection, weavecore.CallbackCollection);



    var p = EventCallbackCollection.prototype;

    p._eventManager;
    p._eventType;
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
        createjs.Ticker.addEventListener(this._eventType, this._tickerListener); // do not use capture phase

        // when callbacks are disposed, remove the listeners
        this.addDisposeCallback(null, function () {
            //stage.removeEventListener(eventType, captureListener, true);
            createjs.Ticker.removeEventListener(this._eventType, this._tickerListener);
        });
    };

    function _tickerListener(event) {
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

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'EventCallbackCollection',
            qName: 'weavecore.EventCallbackCollection'
        }]
    };

}())
