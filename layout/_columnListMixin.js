// summary:
//		Mixin class for simpo/layout/columnList
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
// todo:
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/on",
	"dojo/dom-style"
], function(
	declare, _widget, lang, array, on, domStyle
){
	"use strict";
	
	var construct = declare([_widget], {
		// _interval: integer
		//		Milliseconds between checking for new items added.
		"_interval": 200,
		
		// _intervalFunc: function
		//		The interval function for checking for new items added.
		"_intervalFunc": null,
		
		// _intervalDefaultFunction: function
		//		The default function to assign to the interval
		"_intervalDefaultFunction": null,
		
		_setupInterval: function(func){
			// summary:
			//		Create interval and assign a function to it.  Run in the
			//		current scope.
			// func: function
			//		Function to run, defaults to this._intervalDefaultFunction.
			
			func = ((func === undefined) ? this._intervalDefaultFunction : func);
			
			if(func !== null){
				this._intervalFunc = setInterval(
					lang.hitch(this, func), this._interval
				)
			}
		},
		
		_clearInterval: function(){
			// summary:
			//		Clear the current interval.
			
			if(this._intervalFunc !== null){
				clearInterval(this._intervalFunc);
				this._intervalFunc = null;
			}
			
		},
		
		_emitItemsAdded: function(count){
			// summary:
			//		Emit an event to indicate that the number of onscreen items
			//		has increased.
			// count: integer
			//		Number added.
			
			on.emit(this, "itemsAdded", {
				"bubbles": true,
				"cancelable": false,
				"numberAdded": count
			});
		},
		
		_emitItemsRemoved: function(count){
			// summary:
			//		Emit an event to indicate that the number of onscreen items
			//		has decreased.
			// count: integer
			//		Number removed
			
			on.emit(this, "itemsAdded", {
				"bubbles": true,
				"cancelable": false,
				"numberRemoved": count
			});
		},
		
		_emitColumnCountChange: function(from, to){
			// summary:
			//		Emit an event to indicate that the number of on-screen
			//		columns has changed.
			// from: integer
			//		The previous number of columns.
			// to: interger
			//		The new number of columns
			
			on.emit(this, "columnCountChange", {
				"bubbles": true,
				"cancelable": false,
				"previousCount": from,
				"currentCount": to
			});
		},
		
		_hideNode: function(node){
			// summary:
			//		Hide the main domNode for this widget.
			// node: object XMLNode | undefined
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
			// returns: string
			//		The string list, separated by spaces.
			
			var lookup = new Object;
			var items = split(list, "").concat(split(item, ""));
			var newList = "";
			
			array.forEach(items, function(item){
				if(!this._isProperty(lookup, item)){
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
		
		_isProperty: function(obj, propName){
			// summary:
			//		Check if an object has a particular property.
			// obj: object
			//		The object to test the properties of.
			// propName: string
			//		The property to test for.
			// returns: boolean
			
			if(this._isObject(obj)){
				return Object.prototype.hasOwnProperty.call(obj, propName);
			}
			
			return false;
		},
		
		_isObject: function(value){
			// summary:
			//		Test whether the supplied value is an object.
			// value: mixed
			//		The value to test.
			// returns: boolean
			
			return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
		},
		
		_isElement: function(value){
			// summary:
			//		Test whether the supplied value is an XMLNode.
			// value: mixed
			//		The value to test.
			// returns: boolean
			
			return (
				(typeof HTMLElement === "object") ?
					(value instanceof HTMLElement) :
					(value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName === "string")
			);
		}
	});
	
	return construct;
});