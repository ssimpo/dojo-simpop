// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/request",
	"dojo/_base/array",
	"./colour"
], function(
	declare, lang, request, array, Colour
) {
	"use strict";
    
    var construct = declare(null, {
		"src": null,
		"profiles": null,
		"colours": null,
		"callback": function(){},
		"device": "default",
		
		constructor: function(){
			lang.mixin(this,arguments[0]);
			this._init();
		},
		
		_init: function(args){
			this._loadPalette();
		},
		
		_loadPalette: function(){
			request(this.src, {
				"handleAs": "json"
			}).then(lang.hitch(this, function(data){
				this.profiles = data;
				this.colours = this._parseProfiles();
				this.callback(this);
			}), function(err){
				console.error(err);
			});
		},
		
		_parseProfiles: function(){
			var parsedProfiles = new Array();
			
			array.forEach(this.profiles, function(profile) {
				var colourProfile = this._getColourProfile(profile);
				colourProfile.name = profile.name;
				
				for(var selector in colourProfile){
					if(selector != "name"){
						colourProfile[selector] = new Colour(colourProfile[selector]);
					}
				}
				
				parsedProfiles.push(colourProfile);
			}, this);
			
			return parsedProfiles;
		},
		
		_getColourProfile: function(profile){
			var colourProfile;
			if(profile.devices.hasOwnProperty(this.device)){
				colourProfile = profile.devices[this.device];
			}else{
				colourProfile = profile.devices["default"];
			}
			
			return colourProfile;

		}
	});
    
    return construct;
});