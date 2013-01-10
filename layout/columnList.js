// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/i18n",
	"dojo/i18n!./nls/columnList",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/query",
	"dojo/_base/array"
], function(
	declare, _widget, i18n, strings,
	lang, domAttr, domConstr, domStyle, domClass, $, array
) {
	"use strict";
	
	var construct = declare([_widget], {
		"cols": 2,
		"listTag": "ul",
		"class": "",
		"gap": 5,
		
		"_interval": 200,
		"_intervalFunc": null,
		"_lists": [],
		"_items": [],
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._setClass();
			this._hideDomNode();
			this._setupInterval();
			this._setColumns();
		},
		
		_setClass: function(){
			var cClass = domAttr.get(this.domNode, "class");
			if((cClass !== null) && (cClass !== "")){
				this["class"] = this._appandItem(this["class"], cClass);
			}
		},
		
		_appandItem: function(list, item){
			var lookup = new Object;
			var items = split(list, "").concat(split(item, ""));
			var newList = "";
			
			array.forEach(items, function(item){
				if(!this._hasProperty(lookup, item)){
					if(newList != ""){
						newlist += " " + item;
					}else{
						newlist += item;
					}
					lookup[item] = true;
				}
			});
		},
		
		_setupInterval: function(){
			this._intervalFunc = setInterval(
				lang.hitch(this, this._checkForNewElements),
				this._interval
			)
		},
		
		_clearInterval: function(){
			if(this._intervalFunc !== null){
				clearInterval(this._intervalFunc);
				this._intervalFunc = null;
			}
			
		},
		
		_setColumns: function(){
			var listMixin = this._createListMixin();
			var container = this._setupContainer();
			
			for(var i = 1; i <= this.cols; i++){
				this._lists.push(
					domConstr.create(
						this.listTag, listMixin, container
					)
				);
			}
		},
		
		_setupContainer: function(){
			return domConstr.create(
				"div", {
					"class": "simpoLayoutColumnList"
				}, this.domNode, "after"
			)
		},
		
		_createListMixin: function(){
			var width = parseInt((100/this.cols), 10) - this.gap;
			width = width.toString() + "%";
			
			var listMixin = {
				"style": {
					"float": "left",
					"width": width
				}
			};
			
			if(this["class"] != ""){
				listMixin["class"] = this["class"];
			}
			
			return listMixin;
		},
		
		_hideDomNode: function(){
			domStyle.set(this.domNode, {
				"visibility": "hidden",
				"position": "absolute",
				"left": "0px",
				"top": "0px",
				"height": "1px",
				"width": "1px",
				"overflow": "hidden"
			});
		},
		
		_checkForNewElements: function(){
			this._clearInterval();
			var html = domAttr.get(this.domNode, "innerHTML");
			if(html !== ""){
				this._moveNewItems();
				domConstr.empty(this.domNode);
			}
			this._setupInterval();
		},
		
		_moveNewItems: function(){
			if(this._lists.length > 0){
				var items = $("li", this.domNode);
				array.forEach(items, function(item){
					this._items.push(item);
				}, this);
				this._reWrapColumns();
			}
		},
		
		_reWrapColumns: function(){
			var colSizes = this._calcColumnSize();
			var cCol = 1;
			var cColItem = 1;
			
			array.forEach(this._items, function(item, n){
				domConstr.place(item, this._lists[cCol-1], "last");
				cColItem++;
				if(cColItem > colSizes[cCol-1]){
					cCol++;
					cColItem = 1;
				}
			}, this);
		},
		
		_calcColumnSize: function(){
			var sizes = new Array();
			var itemsPerColumn = parseInt((this._items.length / this.cols), 10);
			var itemsPerRem = (this._items.length % this.cols);
			
			for(var colNo = 0; colNo < this._lists.length; colNo++){
				sizes[colNo] = itemsPerColumn;
				if(colNo < itemsPerRem){
					sizes[colNo]++;
				}
			}
			
			return sizes;
		},
		
		_hasProperty: function(obj, propName){
			if(this._isObject(obj)){
				return Object.prototype.hasOwnProperty.call(obj, propName);
			}
			
			return false;
		}
	});
	
	return construct;
});