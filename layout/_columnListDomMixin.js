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
//		Better styling of gaps.
//		Add a clear both to the end of the containerNode.
define([
	"dojo/_base/declare",
	"dojo/dom-construct"
], function(
	declare, domConstr
){
	"use strict";
	
	var construct = declare(null, {
		// _holdingArea: object XMLNode
		//		Node used to hold new items before applying to the screen.
		"_holdingArea": null,
		
		// containerNode: object XMLNode
		//		The container node for onscreen columns.
		"containerNode": null,
		
		// widgetNode: object XMLNode
		//		Node to contain the main widget, seperate from this.domNode
		"widgetNode": null,
		
		// _hiddenNode: object XMLNode
		//		Node used to hide content from the screen.  Nodes can be moved
		//		in/out of this node to show/hide
		"_hiddenNode": null,
		
		// _clearNode: object XMLNode
		//		Node added after the container node to stop items floating
		//		after the columns.
		"_clearNode": null,
		
		"paginationNode": null,
		
		_initWidgetNode: function(){
			// summary:
			//		Create a widgetNode and the contents of that node.
			// description:
			//		Create a widgetNode and the contents of that node.  This is
			//		different to the domNode.  The domNode is hidden and changes
			//		tracked and moved to the on-screen widget node.  This is so
			//		lists can be added to, and removed from, via standard Dom
			//		manipulation methods.
			
			try{
				if(!this._isElement(this.widgetNode)){
					this.widgetNode = domConstr.create(
						"div", {}, this.domNode, "after"
					);
				}
				this._initHiddenNode();
				this._initHoldingArea();
				this._initContainer();
				this._initClearNode();
			}catch(e){
				console.info("Could not initiate the widget node.");
			}
		},
		
		_initHiddenNode: function(){
			// summary:
			//		Create a hidden node so that other nodes can be moved in/out
			//		of it to show/hide them.
			
			try{
				if(!this._isElement(this._hiddenNode)){
					this._hiddenNode = domConstr.create(
						"div", {}, this.widgetNode
					);
					this._hideNode(this._hiddenNode);
				}
			}catch(e){
				console.info("Could not initiate the hidden node.");
			}
		},
		
		_initHoldingArea: function(){
			// summary:
			//		Create a holding area for column-items before they are
			//		applied to the screen.
			// description:
			//		Create a holding area for column-items before they are
			//		applied to the screen.  This area is used to ensure the
			//		widget is as thread-safe as possible and to hold
			//		column-items when columns are removed and items need
			//		re-applying to the screen.
			// returns: object XMLNode
			//		The new holding-area element.
			
			try{
				if(!this._isElement(this._holdingArea)){
					var columnMixin = this._createColumnMixin();
					this._holdingArea = domConstr.create(
						this.columnTagName, columnMixin, this.widgetNode
					);
					this._hideNode(this._holdingArea, this._hiddenNode);
				}
				return this._holdingArea;
			}catch(e){
				console.info("Could not initiate the holding-area node.");
				return null;
			}
		},
		
		_initContainer: function(){
			// summary:
			//		Create the main container for the columns.
			// returns: object XMLNode
			//		The new container element.
			
			try{
				if(!this._isElement(this.containerNode)){
					this.containerNode = domConstr.create(
						"div", {
							"class": "simpoLayoutColumnList"
						}, this.widgetNode
					);
				}
			
				return this.containerNode;
			}catch(e){
				console.info("Could not initiate the container node.");
				return null;
			}
		},
		
		_initClearNode: function(){
			try{
				if(!this._isElement(this._clearNode)){
					this._clearNode = domConstr.create(
						"div", {
							"style": {
								"width": "1px",
								"height": "1px",
								"display": "block",
								"clear": "both"
							}
						}, this.containerNode, "after"
					);
				}
			}catch(e){
				console.info("Could not initiate the clear node.");
			}
		}
	});
	
	return construct;
});