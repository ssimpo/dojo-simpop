// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./views/colourPanel.html",
	"../colour",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dojo/on",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, _widgetT, template, colour,
	domStyle, domAttr, on, lang
) {
	"use strict";
    
    var construct = declare([_widget, _templated, _widgetT], {
		"templateString": template,
		"colour": {},
		"borderColour": {},
		"name": "",
		"checked": false,
		"valueIsName": false,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._initColours();
			this._styleWidget();
			this._connectEvents();
		},
		
		_connectEvents: function(){
			on(this.domNode, "click", lang.hitch(this, this.select));
		},
		
		_styleWidget: function(){
			domStyle.set(this.domNode, {
				"backgroundColor": this.colour.toHex(),
				"borderColor": this.colour.toHex()
			});
			if (this.name != "") {
				domAttr.set(this.domNode, "title", this.name);
			}
		},
		
		_setValueAttr: function(value){
			this.set("colour", value);
			
			if(this.checked){
				this.select(false);
			}else{
				this.unselect(false);
			}
		},
		
		_setColourAttr: function(value){
			if(typeof this.colour == "string"){
				this.colour = new colour(value);
			}else if(Object.prototype.toString.call(value) === '[object Object]' ){
				if(value.prototype == colour){
					this.colour = value;
				}
			}
			
			this.borderColour = new colour(this.colour.toHex());
			this.borderColour.spin(120);
			this._styleWidget();
		},
		
		_getValueAttr: function(){
			if(this.checked){
				if(this.valueIsName){
					return this.colour.name;
				}else{
					return this.colour;
				}
			}
			
			return false;
		},
		
		_initColours: function(){
			if(typeof this.colour == "string"){
				this.set("value", this.colour);
			}else{
				if(Object.prototype.toString.call(colour) === '[object Object]' ){
					if(value.prototype == colour){
						this.set("value", this.colour);
					}
				}else{
					this.set("value", this);
				}
			}
		},
		
		select: function(emitEvent){
			domStyle.set(this.domNode, "borderColor", this.borderColour.toHex());
			this.checked = true;
			if(emitEvent !== false){
				on.emit(this.domNode, "select", {"bubbles": true, "cancelable": false});
				on.emit(this.domNode, "change", {"bubbles": true, "cancelable": false});
			}
		},
		
		unselect: function(emitEvent){
			domStyle.set(this.domNode, "borderColor", this.colour.toHex());
			this.checked = false;
			if(emitEvent !== false){
				on.emit(this.domNode, "unselect", {"bubbles": true, "cancelable": false});
				on.emit(this.domNode, "change", {"bubbles": true, "cancelable": false});
			}
			
		}
		
	});
    
    return construct;
});