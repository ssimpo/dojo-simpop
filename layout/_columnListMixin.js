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
	"dojo/dom-style",
	"dojo/dom-construct",
	"dijit/registry"
], function(
	declare, _widget, lang, array, on, domStyle, domConstr, registry
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
			
			try{
				if(func !== null){
					this._intervalFunc = setInterval(
						lang.hitch(this, func), this._interval
					)
				}
			}catch(e){
				console.info("Could not setup a new interval.");
			}
		},
		
		_clearInterval: function(){
			// summary:
			//		Clear the current interval.
			
			try{
				if(this._intervalFunc !== null){
					clearInterval(this._intervalFunc);
					this._intervalFunc = null;
				}
			}catch(e){
				console.info("Could not clear the current interval.");
			}
		},
		
		_emitItemsAdded: function(count){
			// summary:
			//		Emit an event to indicate that the number of onscreen items
			//		has increased.
			// count: integer
			//		Number added.
			
			try{
				on.emit(this, "itemsAdded", {
					"bubbles": true,
					"cancelable": false,
					"numberAdded": count
				});
			}catch(e){
				console.info("Could not emit \"itemsAdded\" event.");
			}
		},
		
		_emitItemsRemoved: function(count){
			// summary:
			//		Emit an event to indicate that the number of onscreen items
			//		has decreased.
			// count: integer
			//		Number removed
			
			try{
				on.emit(this, "itemsAdded", {
					"bubbles": true,
					"cancelable": false,
					"numberRemoved": count
				});
			}catch(e){
				console.info("Could not emit \"itemsAdded\" event.");
			}
		},
		
		_emitColumnCountChange: function(from, to){
			// summary:
			//		Emit an event to indicate that the number of on-screen
			//		columns has changed.
			// from: integer
			//		The previous number of columns.
			// to: interger
			//		The new number of columns
			
			try{
				on.emit(this, "columnCountChange", {
					"bubbles": true,
					"cancelable": false,
					"previousCount": from,
					"currentCount": to
				});
			}catch(e){
				console.info("Could not emit \"columnCountChange\" event.");
			}
		},
		
		_hideNode: function(node, hiddenNode){
			// summary:
			//		Hide the main domNode for this widget.
			// node: object XMLNode | undefined
			//		The node to hide, defaults to this.domNode.
			// hiddenNode: object XMLNode
			//		The special hidden node to move node into to hide it.  If
			//		no hiddenNode is supplied then a style is applied to node
			//		to hide it, rather than moving it to a hidden area.
			
			node = ((node === undefined) ? this.domNode : node);
			
			if(!this._isElement(hiddenNode)){
				try{
					domStyle.set(node, {
						"visibility": "hidden",
						"position": "absolute",
						"left": "0px",
						"top": "0px",
						"height": "1px",
						"width": "1px",
						"overflow": "hidden"
					});
				}catch(e){
					console.info("Could not make node hidden.");
				}
			}else{
				try{
					domConstr.place(node, hiddenNode);
				}catch(e){
					console.info("Could not move node to hidden node.");
				}
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
			// returns: string
			//		The string list, separated by spaces.
			
			
			try{
				var lookup = new Object;
				var items = list.split(" ").concat(item.split(" "));
				var newList = "";
			
				array.forEach(items, function(item){
					if(!this._isProperty(lookup, item)){
						if(newList != ""){
							newList += " " + item;
						}else{
							newList += item;
						}
						lookup[item] = true;
					}
				}, this);
				
				return newList;
			}catch(e){
				console.info("Could not append \""+item+"\", to list: \""+list+"\".", e);
				return list
			}
			
			
		},
		
		_isProperty: function(obj, propName){
			// summary:
			//		Check if an object has a particular property.
			// obj: object
			//		The object to test the properties of.
			// propName: string
			//		The property to test for.
			// returns: boolean
			
			try{
				if(this._isObject(obj)){
					return Object.prototype.hasOwnProperty.call(obj, propName);
				}
			}catch(e){
				console.info("Failed to perform isProperty test on property: " + propName + ".");
			}
			
			return false;
		},
		
		_isObject: function(value){
			// summary:
			//		Test whether the supplied value is an object.
			// value: mixed
			//		The value to test.
			// returns: boolean
			
			try{
				return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
			}catch(e){
				console.info("Failed to perform isObject test.");
				return false;
			}
		},
		
		_isElement: function(value){
			// summary:
			//		Test whether the supplied value is an XMLNode.
			// value: mixed
			//		The value to test.
			// returns: boolean
			
			try{
				return (
					(typeof HTMLElement === "object") ?
						(value instanceof HTMLElement) :
						(value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName === "string")
				);
			}catch(e){
				console.info("Failed to perform isElement test.");
				return false;
			}
		},
		
		_isWidget: function(obj){
			try{
				if((typeof obj === "object") && (obj !== undefined) && (obj !== null)){
					if(this._isProperty(obj, "domNode")){
						try{
							var widget = registry.byNode(obj.domNode);
							return (widget !== undefined);
						}catch(e){}
					}
				}
			}catch(e){
				console.info("Failed to perform isWidget test.");
			}
			
			return false;
		}
	});
	
	return construct;
});