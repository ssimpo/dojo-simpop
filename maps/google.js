// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/io-query"
], function(
	declare, lang, ioQuery
) {
	"use strict";
	
	var construct = declare(null, {
		"_mapsApiUrl": "https://maps.googleapis.com/maps/api/js",
		"callback": function(){},
		"region": "UK",
		
		constructor: function(){
			lang.mixin(this, arguments[0]);
			this._init(arguments);
		},
		
		_init: function(args){
			var callbackName = 'gmapscallback'+(new Date()).getTime();
			window[callbackName] = lang.hitch(this, this._callback);
			var query = {
				"key": "AIzaSyB_YjCrNUFliiwZgm2JcHa9lJEY0NGD7Ck",
				"callback": callbackName,
				"sensor": true,
				"region": this.region
			}
			
			require([
				this._mapsApiUrl+"?"+ioQuery.objectToQuery(query)
			], function(){});
		},
		
		_callback: function(){
			this.callback(google.maps);
		}
	});
	
	return construct;
});