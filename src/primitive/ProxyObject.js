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
