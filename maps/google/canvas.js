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
	"dojo/i18n",
	"dojo/i18n!./nls/canvas",
	"dojo/text!./views/canvas.html",
	"../google",
	"dojo/_base/lang",
	"dojo/_base/array",
	"simpo/interval",
	"dojo/aspect",
	"simpo/typeTest",
	"dojo/on"
], function(
	declare, _widget, _templated, i18n, strings, template, googleLoader,
	lang, array, interval, aspect, typeTest, on
) {
	"use strict";
	
	var construct = declare([_widget, _templated], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"map": {},
		"_geoCoder": {},
		"callback": function(){},
		"_points": [],
		"_loaded": false,
		"_onLoadFunctions": [],
		
		postCreate: function(){
			this._init();
		},
		
		centre: function(lat, lng){
			if(this._loaded){
				this._centre(lat, lng);
			}else{
				interval.add(lang.hitch(this, this.centre, lat, lng));
			}
		},
		
		_centre: function(lat, lng){
			if(typeTest.isString(lat)){
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					var latLng = new google.maps.LatLng(lat, lng);
					this.map.panTo(latLng);
				}));
			}else if(typeTest.isArray(lat)){
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					//var latLng = new google.maps.LatLng(lat, lng);
					//this.map.panTo(latLng);
				}));
			}else if(typeTest.isNumber(lat) || typeTest.isNumber(lng)){
				var latLng = new google.maps.LatLng(lat, lng);
				this.map.panTo(latLng);
			}
		},
		
		clear: function(){
			if(this._loaded){
				while(this._points.length > 0){
					var point = this._points.shift();
					point.setMap(null);
				}
			}
		},
		
		plot: function(lat, lng, callback){
			if(this._loaded){
				this._plot(lat, lng);
			}else{
				interval.add(lang.hitch(this, this.plot, lat, lng, callback));
			}
		},
		
		_plot: function(lat, lng, callback){
			var marker = new google.maps.Marker({
				"map": this.map
			});
			if(typeTest.isString(lat)){
				callback = lng;
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					var latLng = new google.maps.LatLng(lat, lng);
					marker.setPosition(latLng);
					if(callback !== undefined){
						callback(marker);
					}
				}));
			}else{
				var latLng = new google.maps.LatLng(lat, lng);
				marker.setPosition(latLng);
				if(callback !== undefined){
					callback(marker);
				}
			}
			this._points.push(marker);
			
			
		},
		
		_init: function(){
			var self = this;
			
			aspect.around(this, "on", function(originalOn){
				return function(target, type, listener, dontFix){
					var caller = function(){
						on(self.map, type, listener, dontFix);
					}
					
					if(self._loaded){
						caller();
					}else{
						self._onLoadFunctions.push(caller);
					}
				};
			});
			
			if(window.google !== undefined){
				if(window.google.maps !== undefined){
					return this._callback(google.maps);
				}
			}
			
			new googleLoader({
				"callback": lang.hitch(this, this._googleMapsLoaded)
			});
			
			
			return true;
		},
		
		_postcodeLookup: function(postcode, callback){
			this._geoCoder.geocode({
				"address": postcode
			}, function(result){
				callback(
					result[0].geometry.location.Ya,
					result[0].geometry.location.Za
				);
			});
		},
		
		_googleMapsLoaded: function(gmap){
			this._geoCoder = new gmap.Geocoder();
			var mapOptions = {
				center: new gmap.LatLng(-34.397, 150.644),
				zoom: 11,
				mapTypeId: gmap.MapTypeId.ROADMAP
			};
			this.map = new gmap.Map(
				this.domNode,
				mapOptions
			);
			
			this._loaded = true;
			
			if(this._onLoadFunctions.length > 0){
				array.forEach(this._onLoadFunctions, function(func){
					func();
				});
			}
			
			this.callback(this);
		}
	});
	
	return construct;
});