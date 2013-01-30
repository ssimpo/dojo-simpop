define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/checkboxGrid",
	"dojo/text!./views/checkboxGrid.html",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dojox/mobile/CheckBox",
	"dojo/on",
	"dojo/_base/lang",
	"dijit/registry",
	"dojo/query"
], function(
	declare, _widget, _templated, i18n, strings, template, domConstr, array,
	Checkbox, on, lang, registry, $
){
	"use strict";
	
	var construct = declare([_widget, _templated],{
		"i18n": strings,
		"templateString": template,
		"cols": 0,
		"values": [],
		"value": "",
		"name": "",
		"_checkboxes": {},
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			if(this.cols < 0){
				this.cols = this.values.length;
			}
			this._createCheckboxes();
		},
		
		_createCheckboxes: function(){
			this._checkboxes = {};
			var tr = this._createNewRow();
			array.forEach(this.values, function(value, n){
				var ckB = this._createCheckboxUnit(value);
				if((n % this.cols) == 0){
					tr = this._createNewRow();
				}
				domConstr.place(ckB, tr);
			}, this);
			
			for(var i = 0; i <= (this.values.length % this.cols); i++){
				domConstr.create("td", {"innerHTML":"&nbsp;"} , tr);
			}
		},
		
		_createNewRow: function(){
			return domConstr.create("tr",{},this.containerNode);
		},
		
		_createCheckboxUnit: function(value){
			var td = domConstr.create("td");
			var checkbox = this._createCheckbox(value);
			var label = this._createLabel(value, checkbox.id);
			
			this._checkboxes[value] = checkbox;
			
			domConstr.place(checkbox.domNode, td);
			domConstr.place(label, td);
			
			return td;
		},
		
		_createCheckbox: function(value){
			var id = this._randomId("checkboxGrid");
			
			var ckB = new Checkbox({
				"name": this.name,
				"id": id,
				"value": value
			});
			
			on(ckB, "change", lang.hitch(this, this._onChange, value));
			
			return ckB;
		},
		
		_createLabel: function(label, idFor){
			var lb = domConstr.create("label", {
				"for": idFor,
				"innerHTML": label
			});
			
			return lb;
		},
		
		_onChange: function(label, value){
			on.emit(this, "change", {bubbles: true, cancelable: true});
			on.emit(this.domNode, "change", {bubbles: true, cancelable: true});
		},
		
		_getValueAttr: function(){
			var values = new Array();
			for(var label in this._checkboxes){
				if(this._checkboxes[label].get("checked")){
					values.push(label);
				}
			}
			
			return values.join(",");
		},
		
		_hasOwnProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		},
		
		_setValueAttr: function(value){
			this.reset();
			
			if(value === false){
				this.value = "";
			}else{
				var values = value.split(",");
				array.forEach(values, function(label){
					if(this._hasOwnProperty(this._checkboxes, label)){
						this._checkboxes[label].set("checked", true);
					}
				}, this);
			
				this.value = value;
			}
		},
		
		_setValuesAttr: function(values){
			this.values = values;
			var rows = $("tr", this.domNode);
			array.forEach(rows, function(row){
				domConstr.destroy(row);
			}, this);
			this._init();
		},
		
		_randomId: function(prefix){
			var no = Math.floor((Math.random()*1000000000000)+1);
			return prefix + "_" + no.toString();
		},
		
		_getWidgets: function(){
			var widgets = registry.findWidgets(this.domNode);
			if(widgets.length == 1){
				if(widgets[0].domNode.tagName.toLowerCase() == "form"){
					widgets = registry.findWidgets(widgets[0].domNode);
				}
			}
			
			return widgets;
		},
		
		reset: function(){
			for(var label in this._checkboxes){
				this._checkboxes[label].set("checked", false);
			}
			
			this.value = "";
		}
	});
	
	return construct;
});