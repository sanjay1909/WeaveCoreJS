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
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'NS', {
        value: 'weavecore'
    });


    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'CLASS_NAME', {
        value: 'LinkableTextFormat'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableTextFormat, 'SESSIONABLE', {
        value: true
    });





    function LinkableTextFormat() {

        weavecore.ILinkableObject.call(this);

        Object.defineProperties(this, {
            'font': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(LinkableTextFormat.DEFAULT_FONT, function (value) {
                    return value ? true : false;
                }))
            },
            'size': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_SIZE, function (value) {
                    return value > 2;
                }))
            },
            'color': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(LinkableTextFormat.DEFAULT_COLOR, isFinite))
            },
            'bold': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            },
            'italic': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            },
            'underline': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false))
            }
        });





    }

    LinkableTextFormat.prototype = new weavecore.ILinkableObject();
    LinkableTextFormat.prototype.constructor = LinkableTextFormat;

    var p = LinkableTextFormat.prototype;

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

    weavecore.LinkableTextFormat = LinkableTextFormat;
    weavecore.ClassUtils.registerClass('weavecore.LinkableTextFormat', LinkableTextFormat);

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
