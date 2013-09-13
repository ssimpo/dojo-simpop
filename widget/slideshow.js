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
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/dom-style"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template, on,
	array, Deferred, defAll, lang, domConstr, domStyle
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
		"type":"blinds",
		"squaresSize":30,
		"_squaresCentre":null,
		
		_setSrcAttr: function(src){
			this.src = src;
			this._loadImages(src);
		},
		
		_setWidthAttr: function(width){
			this.width = width;
			this._setStripeWidths();
		},
		
		_setSquaresSizeAttr: function(value){
			this.squaresSize = value;
			this._setSquarePoints();
		},
		
		_setSquarePoints: function(){
			this._squaresCentre = new Array();
			var centreX = parseInt((this.squaresSize/2), 10);
			var centreY = centreX;
			
			while((currentCentreY-centreY)<=this.height){
				var currentCentreX = (col*this.squaresSize)+centreX;
				if(currentCentreX > this.width){
					col = 0;
					currentCentreX = (col*this.squaresSize)+centreX;
					row ++;
				}
				var currentCentreY = (row*this.squaresSize)+centreY;
				
				this._squaresCentre[i] = new Array(currentCentreX, currentCentreY);
			}
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
			this._createCanvas();
			this._displayImage();
		},
		
		_createCanvas: function(){
			var canvas = domConstr.create("canvas", {
				"width":this.width,
				"height":this.height
			}, this.container);
			this._context = canvas.getContext("2d");
		},
		
		_displayImage: function(){
			this._pos = 0;
			this._tPos = 0;
			
			if(this.type == "blinds"){
				this._drawStripe(this._cImageNo);
			}else if(this.type == "squares"){
				this._drawSquare(this._cImageNo);
			}
			
			this._cImageNo++;
			if(this._cImageNo >= this._stripeWidths.length){
				this._cImageNo = 0;
			}
		},
		
		_drawSquare: function(imageNo){
			if(this._timer !== null){
				clearTimeout(this._timer);
			}
			
			
			this._squaresCentre.forEach(function(squareXY, n){
				
			},this);
			
		},
		
		_drawStripeLine: function(imageNo, ccPos){
			this._context.drawImage(
				this._imageData[imageNo],
				this._pos+ccPos,0,1,this.height,
				this._pos+ccPos,0,1,this.height
			);
		},
		
		_calculateCanvasPosition: function(stripeNo){
			var pos = 0;
			for(var i=0; i<stripeNo; i++){
				pos += this._stripeWidths[i];
			}
			
			return pos;
		},
		
		_drawStripe: function(imageNo){
			if(this._timer !== null){
				clearTimeout(this._timer);
			}
			
			for(var i=0; i<this.stripes; i++){
				if(this._pos < this._stripeWidths[i]){
					var ccPos = this._calculateCanvasPosition(i);
					this._drawStripeLine(imageNo, ccPos);
					this._tPos++;
				}
			}
			this._pos++;
			this._callInterval(imageNo);
		},
		
		_callInterval: function(imageNo){
			if(this._tPos < this.width){
				this._timer = setTimeout(
					lang.hitch(this, this._drawStripe, imageNo),
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