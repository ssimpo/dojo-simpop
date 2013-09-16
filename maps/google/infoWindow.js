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
	"dojo/i18n!./nls/infoWindow",
	"dojo/text!./views/infoWindow.html"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template
) {
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"overlay": null,
		"map": null,
		
		constructor: function(args){
			this.map_ = args.map;
		},
		
		_overlayConstructor: function(){
			var self = this;
			var overlay = function constructor(){
				this.map_ = self.map;
				this._div = self.domNode;
				this.setMap(this.map);
			};
			overlay.prototype = new google.maps.OverlayView();
			overlay.prototype.onAdd = function(){
				var panes = this.getPanes();
				panes.floatPane.appendChild(this.div_);
			}
			
			this.overlay = new overlay();
			console.log(overlay, overlay._div);
		},
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._overlayConstructor();
		}
	});
	
	return construct;
});