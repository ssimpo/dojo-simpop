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
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, i18n, strings, template, googleLoader, lang
) {
	"use strict";
	
	var construct = declare([_widget, _templated], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"_map": {},
		"_geoCoder": {},
		"callback": function(){},
		"_points": [],
		
		postCreate: function(){
			this._init();
		},
		
		centre: function(lat, lng){
			if(this._isString(lat)){
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					var latLng = new google.maps.LatLng(lat, lng);
					this._map.panTo(latLng);
				}));
			}else if(this._isArray(lat)){
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					//var latLng = new google.maps.LatLng(lat, lng);
					//this._map.panTo(latLng);
				}));
			}else if(this._isNumber(lat) || this._isNumber(lng)){
				var latLng = new google.maps.LatLng(lat, lng);
				this._map.panTo(latLng);
			}
		},
		
		clear: function(){
			while(this._points.length > 0){
				var point = this._points.shift();
				point.setMap(null);
			}
		},
		
		plot: function(lat, lng){
			var marker = new google.maps.Marker({
				"map": this._map
			});
			if(this._isString(lat)){
				this._postcodeLookup(lat, lang.hitch(this, function(lat, lng){
					var latLng = new google.maps.LatLng(lat, lng);
					marker.setPosition(latLng);
				}));
			}else{
				var latLng = new google.maps.LatLng(lat, lng);
				marker.setPosition(latLng);
			}
			this._points.push(marker);
		},
		
		_isNumber: function(value){
			return (Object.prototype.toString.call(value) === '[object Number]');
		},
		
		_isArray: function(value){
			return (Object.prototype.toString.call(value) === '[object Array]');
		},
		
		_isString: function(value){
			return (Object.prototype.toString.call(value) === '[object String]');
		},
		
		_init: function(){
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
			console.log("CALLBACK");
			
			this._geoCoder = new gmap.Geocoder();
			var mapOptions = {
				center: new gmap.LatLng(-34.397, 150.644),
				zoom: 11,
				mapTypeId: gmap.MapTypeId.ROADMAP
			};
			this._map = new gmap.Map(
				this.domNode,
				mapOptions
			);
			
			this.callback(this);
			
			//this.centre("TS4 2BP");
		}
	});
	
	return construct;
});