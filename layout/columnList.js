// summary:
//		Sort a list of items into columns, distributing items evenly.
// description:
//		Sort a list of items into columns, evenly distributing the items
//		between each column.  The css-equivilant does not work in IE8 or IE9.
//		Also, wrapping between columns can be problematic as no way of
//		stopping items wrapping across columns.
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
// todo:
//		Distribution according to item screen space rather than item number.
//		Dection of changing column numbers and automatic redrawing based on this.
//		Dection of when items less than column number and therefore less columns need drawing.
//		Better styling of gaps.
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/query",
	"dojo/_base/array"
], function(
	declare, _widget, lang, domAttr, domConstr, domStyle, domClass, $, array
) {
	"use strict";
	
	var construct = declare([_widget], {
		// cols: Integer
		//		Number of columns to display.
		"cols": 2,
		
		// listTag: string
		//		The list tag (default = ul), normally ul or ol.
		"listTag": "ul",
		
		// listItemTag: string
		//		The list-item tag (default = li).  Should be li unless some
		//		clever is required in conjunction with listTag.
		"listItemTag": "li",
		
		// class: string
		//		Class to apply to each list item (will add to any class element
		//		given in declarative markup).
		"class": "",
		
		// gap: interger
		//		Percentage gap to apply between columns.
		"gap": 5,
		
		// _interval: integer
		//		Milliseconds between checking for new items added.
		"_interval": 200,
		
		// _intervalFunc: function
		//		The interval function for checking for new items added.
		"_intervalFunc": null,
		
		// _lists: array()
		//		Lists currently showing on the screen.
		"_lists": [],
		
		// _items: array()
		//		Items currently showing om the screen.
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
			// summary:
			//		Set the class to apply to each list tag.
			
			var cClass = domAttr.get(this.domNode, "class");
			if((cClass !== null) && (cClass !== "")){
				this["class"] = this._appandItem(this["class"], cClass);
			}
		},
		
		_appandItem: function(list, item){
			// summary:
			//		Append a text item to a text list.
			// description:
			//		Append a text item to a text list, will account for
			//		any duplication removing duplicates.  Will also account
			//		for the item itself being a list.
			// list: string
			//		List to append to.
			// item: string
			//		Item to add to the list.
			
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
			
			return newList;
		},
		
		_setupInterval: function(){
			// summary:
			//		Create interval to check for new elements in the list.
			
			this._intervalFunc = setInterval(
				lang.hitch(this, this._checkForNewElements),
				this._interval
			)
		},
		
		_clearInterval: function(){
			// summary:
			//		Clear the current interval.
			
			if(this._intervalFunc !== null){
				clearInterval(this._intervalFunc);
				this._intervalFunc = null;
			}
			
		},
		
		_setColumns: function(){
			// summary:
			//		Create the list columns.
			
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
			// summary:
			//		Create the main container for the columns.
			
			return domConstr.create(
				"div", {
					"class": "simpoLayoutColumnList"
				}, this.domNode, "after"
			)
		},
		
		_createListMixin: function(){
			// summary:
			//		Create the mixin for creating each list.
			
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
			// summary:
			//		Hide the main domNode for this widget.
			
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
			// summary:
			//		Check for new items added to the domNode and
			//		act accordingly.
			// description:
			//		Check for new items added to the domNode and
			//		move them to the correct column.  Ran at intervals
			//		so that elements can be dynamically added via Javascript
			//		as well as declarative in the html.
			
			this._clearInterval();
			var html = domAttr.get(this.domNode, "innerHTML");
			if(html !== ""){
				this._moveNewItems();
				domConstr.empty(this.domNode);
			}
			this._setupInterval();
		},
		
		_moveNewItems: function(){
			// summary:
			//		Move new items added to the domNode to the correct column.
			
			if(this._lists.length > 0){
				var items = $(this.listItemTag, this.domNode);
				array.forEach(items, function(item){
					if(item.parentNode === this.domNode){
						this._items.push(item);
					}
				}, this);
				this._reWrapColumns();
			}
		},
		
		_reWrapColumns: function(){
			// summary:
			//		Apply list items to the correct column.
			
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
			// summary:
			//		Calculate the number of items to apply to each column.
			
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
			// summary:
			//		Check if an object has a particular property.
			
			if(this._isObject(obj)){
				return Object.prototype.hasOwnProperty.call(obj, propName);
			}
			
			return false;
		}
	});
	
	return construct;
});