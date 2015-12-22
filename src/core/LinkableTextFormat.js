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



    function LinkableTextFormat() {
        this.font = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(LinkableTextFormat.DEFAULT_FONT, function (value) {
            return value ? true : false;
        }));
        this.size = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_SIZE, function (value) {
            return value > 2;
        }));
        this.color = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_COLOR, isFinite));
        this.bold = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false));
        this.italic = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false));
        this.underline = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false));

    }


    var p = LinkableTextFormat.prototype;

    p.font;
    p.size;
    p.color;
    p.bold;
    p.italic;
    p.underline;




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




    weavecore.LinkableTextFormat = LinkableTextFormat;

    /**
     * Metadata
     *
     * @type {Object.<string, Array.<Object>>}
     */
    p.CLASS_INFO = {
        names: [{
            name: 'LinkableTextFormat',
            qName: 'weavecore.LinkableTextFormat'
        }],
        interfaces: [weavecore.ILinkableObject]
    };

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
