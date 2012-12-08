// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./views/colourPicker.html",
	"./colourPanel",
	"../palette",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/query",
	"dojo/NodeList-dom",
	"dojo/dom-attr",
	"../colour"
], function(
	declare, _widget, _templated, _widgetT, template, panel, palette,
	array, domConstruct, on, lang, $, domNodeList, domAttr, Colour
) {
	"use strict";
    
    var construct = declare([_widget, _templated, _widgetT],  {
		templateString: template,
		
		"colours": [],
		"src": null,
		"selected": 0,
		"panels": [],
		"containerNode": {},
		"input": {},
		"name": "",
		"id": "",
		"value": null,
		"valueIsName": false,
		
		"_defaultSelected": 0,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._getPalette();
		},
		
		_getPalette: function(){
			if(this.src !== null){
				new palette({
					"src":this.src,
					"callback": lang.hitch(this, function(p){
						this.colours = new Array();
						array.forEach(p.colours, function(colourProfile, n){
							var background = lang.clone(colourProfile.background);
							background.name = colourProfile.name;
							this.colours.push(background);
						}, this);
						this._addPannels();
						if(this.value === null){
							this._defaultSelected = this.selected;
							this.set("selected", this.selected);
						}else{
							this.set("value", this.get("value"));
							this._defaultSelected = this.selected;
						}
					})
				});
			}else{
				this._addPannels();
				if(this.value === null){
					this._defaultSelected = this.selected;
					this.set("selected", this.selected);
				}else{
					this.set("value", this.get("value"));
					this._defaultSelected = this.selected;
				}
			}
		},
		
		_addPannels: function(){
			array.forEach(this.colours,function(colour){
				var panelObj = this._createPanel(colour);
				on(panelObj.domNode, "select", lang.hitch(this, this._selector));
				this.panels.push(panelObj);
				domConstruct.place(panelObj.domNode,this.containerNode);
			},this);
		},
		
		_createPanel: function(colour){
			var panelObj = new panel({
				"colour": colour,
				"valueIsName": this.valueIsName
			});
			return panelObj;
		},
		
		_setSelectedAttr: function(n){
			if(this.selected != n){
				this.panels[this.selected].unselect();
			}
			this.selected = n;
			var pColour = this.panels[this.selected].get("colour");
			this.value = ((this.valueIsName) ? pColour.name : pColour);
			this.panels[this.selected].select();	
		},
		
		_setValueAttr: function(value){
			//
			array.every(this.panels, function(panel, n) {
				if(Object.prototype.toString.call(value) === '[object Object]' ){
					if(value.prototype == Colour){
						if(this._testColourMatch(panel.colour, value)){
							this.set("selected", n);
							return false;
						}
					}
				}else if(typeof value == "string"){
					if(panel.colour.name.toUpperCase() == value.toUpperCase()){
						this.set("selected", n);
						return false;
					}
				}
				
				return true;
			}, this);
		},
		
		_testColourMatch: function(colour1, colour2){
			if(this._isRGB(colour1) && this._isRGB(colour2)){
				return ((colour1.r == colour2.r) && (colour1.g == colour2.g) && (colour1.b == colour2.b));
			}
			
			return false;
		},
		
		_isRGB: function(obj){
			return this._objectHasProperties(obj,["r","g","b"]);
		},
		
		_objectHasProperties: function(obj, props){
			var hasAll = true;
			
			array.forEach(props, function(prop){
				if(!obj.hasOwnProperty(prop)){
					hasAll = false;
				}
			})
			
			return hasAll;
		},
		
		_selector: function(event){
			if (event !== undefined) {
				var node = this._getEventTarget(event);
				
				if(node != this.panels[this.selected].domNode){
					array.forEach(this.panels, function(panel, n) {
						if(panel.domNode == node){
							this.selected = n;
							this.set("value",panel.get("value"));
						}else{
							panel.unselect();
						}
					},this);
				}
			}
		},
		
		_getEventTarget: function(event){
            if (event.currentTarget) { return event.currentTarget; }
            if (event.target) { return event.target; }
            if (event.orginalTarget) { return event.orginalTarget; }
            if (event.srcElement) { return event.srcElement; }
                
            return event;
        },
		
		reset: function(){
			this.panels[this._defaultSelected].select();
		}
	});
    
    return construct;
});