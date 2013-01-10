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
		//		The list tag, normally ul or ol.  Will take the value of
		//		domNode tagname if not supplied.
		"listTag": null,
		
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
		
		// _holdingArea: object XMLDomNode
		//		Node used to hold new items before applying to the screen.
		"_holdingArea": null,
		
		// containerNode: object XMLDomNode
		//		The container node for onscreen columns.
		"containerNode": null,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._setClass();
			this._setListTag();
			this._hideNode();
			this._setupHoldingArea();
			this._setupColumns();
			this._setupInterval();
		},
		
		_setClass: function(){
			// summary:
			//		Set the class to apply to each list tag.
			
			var cClass = domAttr.get(this.domNode, "class");
			if((cClass !== null) && (cClass !== "")){
				this["class"] = this._appandItem(this["class"], cClass);
			}
		},
		
		_setListTag: function(){
			if(this.listTag === null){
				this.listTag = this.domNode.tagName.toLowerCase();
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
		
		_setupColumns: function(){
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
		
		_setupHoldingArea: function(){
			var listMixin = this._createListMixin();
			this._holdingArea = domConstr.create(
				this.listTag, listMixin, this.domNode, "after"
			);
			this._hideNode(this._holdingArea);
		},
		
		_setupContainer: function(){
			// summary:
			//		Create the main container for the columns.
			
			this.containerNode = domConstr.create(
				"div", {
					"class": "simpoLayoutColumnList"
				}, this.domNode, "after"
			);
			
			return this.containerNode;
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
		
		_hideNode: function(node){
			// summary:
			//		Hide the main domNode for this widget.
			// node: object XMLDomNode | undefined
			//		The node to hide, defaults to this.domNode.
			
			node = ((node === undefined) ? this.domNode : node);
			domStyle.set(node, {
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
			var items = this._getNewItems();
			if(items.length > 0){
				this._moveNewItems(items);
			}
			
			this._setupInterval();
		},
		
		_getNewItems: function(parentNode){
			parentNode = ((parentNode === undefined) ? this.domNode : parentNode);
			
			var newItems = new Array();
			var items = $(this.listItemTag, parentNode);
			array.forEach(items, function(item){
				if(item.parentNode === parentNode){
					newItems.push(item);
				}
			}, this);
			
			return newItems;
		},
		
		_getNewAndCurrentItems: function(){
			var currentItems = new Array();
			array.forEach(this._lists, function(list){
				currentItems = currentItems.concat(
					this._getNewItems(list)
				)
			}, this);
			
			return currentItems.concat(
				this._getNewItems(this._holdingArea)
			);
		},
		
		_moveNewItems: function(items){
			// summary:
			//		Move new items added to the domNode to the correct column.
			// items: array XMLDomNode()
			//		Nodes (items) to move to the screen columns.
			
			if(this._lists.length > 0){
				this._moveItemsToHoldingArea(items);
				items = this._getNewAndCurrentItems();
				this._reWrapColumns(items);
			}
		},
		
		_moveItemsToHoldingArea: function(items){
			array.forEach(items, function(item){
				domConstr.place(item, this._holdingArea, "last");
			}, this);
		},
		
		_reWrapColumns: function(items){
			// summary:
			//		Apply list items to the correct column.
			// items: array XMLDomNode()
			//		Nodes (items) to assign to the columns.
			
			var colSizes = this._calcColumnSize(items);
			var cCol = 1;
			var cColItem = 1;
			
			array.forEach(items, function(item, n){
				domConstr.place(item, this._lists[cCol-1], "last");
				cColItem++;
				if(cColItem > colSizes[cCol-1]){
					cCol++;
					cColItem = 1;
				}
			}, this);
		},
		
		_calcColumnSize: function(items){
			// summary:
			//		Calculate the number of items to apply to each column.
			// items: array XMLDomNode()
			//		Current items being assigned to on-screen columns
			
			var sizes = new Array();
			var itemsPerColumn = parseInt((items.length / this.cols), 10);
			var itemsPerRem = (items.length % this.cols);
			
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