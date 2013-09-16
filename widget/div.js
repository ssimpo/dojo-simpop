define([
    "dojo/_base/declare",
    "lib/pnglib",
    "simpo/colour",
    "dijit/_WidgetBase",
	"dojo/Evented",
	"dojo/dom-style"
], function(
    declare, pnglib, colour, _Widget, Evented, domStyle
){
	"use strict";
	
    var construct = declare([_Widget, Evented], {
        postCreate: function() {
            this._init();
        },
		
		_init: function(){
			var colourObj = new colour(domStyle.get(this.domNode,'backgroundColor'));
            var alpha = domStyle.get(this.domNode,'opacity');
            
            if (alpha != 1) {
                var png = new pnglib({'width':1, 'height':1, 'depth':1});
                alpha = parseInt((alpha * 100) * (255/100));
                png.color(colourObj.r,colourObj.g,colourObj.b,alpha);
                var dataUrl = 'url(data:image/png;base64,'+png.getBase64()+')';
                
                domStyle.set(this.domNode,"opacity",1);
                domStyle.set(this.domNode,"backgroundColor","transparent");
                domStyle.set(this.domNode,"backgroundImage",dataUrl);
                domStyle.set(this.domNode,"backgroundRepeat","repeat");
            }
		}
    });
    
    return construct;
});