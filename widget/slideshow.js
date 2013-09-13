// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/slideshow",
	"dojo/text!./views/slideshow.html",
	"dojo/on",
	"dojo/_base/array",
	"dojo/Deferred",
	"dojo/promise/all",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template, on,
	array, Deferred, defAll, lang
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"src": null,
		"_imageData": [],
		"_context": null,
		"height": 350,
		"width": 350,
		"stripes": 10,
		"interval": 900,
		"speed": 100,
		"_stripeWidths":null,
		"_timer": null,
		"_pos": 0,
		"_tPos": 0,
		"_cImageNo":0,
		
		_setSrcAttr: function(src){
			this.src = src;
			this._loadImages(src);
		},
		
		_setWidthAttr: function(width){
			this.width = width;
			this._setStripeWidths();
		},
		
		_setStripeWidths: function(){
			this._stripeWidths =  new Array();
			
			var stripeWidth = parseInt((this.width/this.stripes), 10);
			var stripeWidthSpare = (this.width%this.stripes);
			for(var i=0; i<this.stripes; i++){
				this._stripeWidths[i] = stripeWidth;
				if(i<stripeWidthSpare){
					this._stripeWidths[i]++;
				}
			}
		},
		
		_setCanvasAttr: function(canvas){
			this._context = canvas.getContext("2d");
			this.canvas = canvas;
		},
		
		_loadImages: function(src){
			var defs = new Array();
			
			array.forEach(src, function(cSrc, n){
				this._imageData[n] = new Image();
				this._imageData[n].src = cSrc;
				
				var def = new Deferred;
				defs.push(def);
				on(this._imageData[n], 'load', function(){
					def.resolve();
				});
			}, this);
			
			defAll(defs).then(lang.hitch(this, this._imagesLoaded));
		},
		
		_imagesLoaded: function(response){
			this._displayImage();
		},
		
		_displayImage: function(){
			this._pos = 0;
			this._tPos = 0;
			
			this._drawStripe(this._cImageNo);
			
			this._cImageNo++;
			if(this._cImageNo >= this._stripeWidths.length){
				this._cImageNo = 0;
			}
		},
		
		_drawStripe: function(cImageNo){
			if(this._timer !== null){
				clearTimeout(this._timer);
			}
			
			for(var i=0; i<this.stripes; i++){
				if(this._pos < this._stripeWidths[i]){
					var ccPos = 0;
					for(var ii=0; ii<i; ii++){
						ccPos += this._stripeWidths[ii];
					}
					
					this._context.drawImage(
						this._imageData[cImageNo],
						this._pos+ccPos,0,1,this.height,
						50+this._pos+ccPos,50,1,this.height
					);
					this._tPos++;
				}
			}
			this._pos++;
				
			if(this._tPos < this.width){
				this._timer = setTimeout(
					lang.hitch(this, this._drawStripe, cImageNo),
					this.speed
				);
			}else{
				this._timer = setTimeout(
					lang.hitch(this, this._displayImage),
					this.interval
				);
			}
		}
	});
	
	return construct;
});