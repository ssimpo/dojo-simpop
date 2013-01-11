// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_columnListMixin",
	"./_columnListDomMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/pagedColumnList",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"./columnList",
	"dojo/_base/array",
	"dojo/query",
	"dojo/NodeList-manipulate",
	"dojo/on",
	"dojo/_base/lang"
], function(
	declare, _columnListMixin, _columnListDomMixin, i18n, strings,
	domConstr, domAttr, columnList, array, $, nodeManipulate, on, lang
) {
	"use strict";
	
	var construct = declare([_columnListMixin, _columnListDomMixin], {
		// cols: integer
		//		Number of columns to display.
		"cols": 2,
		
		// columnTagName: string
		//		The column tag, normally ul or ol.  Will take the value of
		//		domNode tagname if not supplied.
		"columnTagName": null,
		
		// itemTagName: string
		//		The column-item tag (default = li).  Should be li unless some
		//		clever is required in conjunction with columnTagName.
		"itemTagName": "li",
		
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		"columnListWidget": null,
		
		// _parentNode: object XMLNode
		//		The current parent of domNode, used to move columns when
		//		domNode moves.
		"_parentNode": null,
		
		"_items": [],
		
		"itemsPerPage": 5,
		"page": 1,
		"_page": 1,
		"paginationNode": null,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._parentNode = this.domNode.parentNode;
			this._initProperties();
			this._initDom();
			this._intervalDefaultFunction = this._domCheck;
			this._setupInterval();
		},
		
		_initProperties: function(){
			// summary:
			//		Call all the widget property initialization methods.
			
			this._initClass();
			this._initColumnTagName();
		},
		
		_initDom: function(){
			// summary:
			//		Call all the widget DOM initialization methods.
			
			this._hideNode(this.domNode);
			this._initWidgetNode();
		},
		
		_initClass: function(){
			// summary:
			//		Set the class to apply to each column tag.
			
			var cClass = domAttr.get(this.domNode, "class");
			if((cClass !== null) && (cClass !== "")){
				this["class"] = this._appandItem(this["class"], cClass);
			}
		},
		
		_initColumnTagName: function(){
			// summary:
			//		Set the type to use for columns.
			
			if(this.columnTagName === null){
				this.columnTagName = this.domNode.tagName.toLowerCase();
			}
		},
		
		_initWidgetNode: function(){
			// summary:
			//		Create a widgetNode and the contents of that node.
			// description:
			//		Create a widgetNode and the contents of that node.  This is
			//		different to the domNode.  The domNode is hidden and changes
			//		tracked and moved to the on-screen widget node.  This is so
			//		lists can be added to, and removed from, via standard Dom
			//		manipulation methods.
			
			if(!this._isElement(this.widgetNode)){
				this.widgetNode = domConstr.create(
					"div", {}, this.domNode, "after"
				);
			}
			this._initHiddenNode();
			this._initColumnListWidget();
			this._initPaginationNode();
		},
		
		_initPaginationNode: function(){
			// summary:
			//		Create the main container for the columns.
			// returns: object XMLNode
			//		The new container element.
			
			if(!this._isElement(this.paginationNode)){
				this.paginationNode = domConstr.create(
					"div", {}, this.widgetNode
				);
			}
			
			return this.containerNode;
		},
		
		_initColumnListWidget: function(){
			if(!this._isWidget(this.columnListWidget)){
				this.columnListWidget = new columnList({
					"cols": this.cols,
					"columnTagName": this.columnTagName,
					"itemTagName": this.itemTagName
				});
				domConstr.place(this.columnListWidget.domNode, this.widgetNode);
			}
		},
		
		_domCheck: function(){
			this._clearInterval();
			this._checkParentNode();
			this.columnListWidget.cols = this.cols;
			this._checkNewItems();
			this._setupInterval();
		},
		
		_checkParentNode: function(){
			// summary:
			//		Ensure that nodes associated with this widget stay together.
			// description:
			//		Ensure all the widget nodes stay together.  If someone moves
			//		this.domNode then it the other nodes need to move with it.
			// todo:
			//		Will not work if the nodes position in parent node is moved.
			
			if(this.domNode.parentNode !== this._parentNode){
				this._parentNode = this.domNode.parentNode;
				domConstr.place(this.widgetNode, this.domNode, "after");
			}
		},
		
		_checkNewItems: function(){
			var count = this._items.length;
			var items = this._getNewItems();
			if(items.length > 0){
				this._items = this._items.concat(items);
				this._removeDeletedItems();
			}else{
				this._removeDeletedItems();
			}
			
			if(count !== this._items.length){
				this._redraw();
			}else{
				this._checkPageChange();
			}
		},
		
		_checkPageChange: function(){
			if(this._page !== this.page){
				this._redraw();
			}
		},
		
		_redraw: function(){
			this._page = this.page;
			var items = this._getCurrentPage();
			this.columnListWidget.clear();
			array.forEach(items, function(item){
				domConstr.place(item, this.columnListWidget.domNode);
			}, this);
			this._redrawPaginationNode();
		},
		
		_redrawPaginationNode: function(){
			domConstr.empty(this.paginationNode);
			var pageCount = this._getPageCount();
			if(this.page > 1){
				this._addPaginationPrevious();
			}
			if(pageCount > 1){
				this._addPaginationNumbers();
			}
			if(this.page < pageCount){
				this._addPaginationNext();
			}
		},
		
		_addPaginationNext: function(pageCount){
			var button = domConstr.create("span", {
				"innerHTML": "Next"
			}, this.paginationNode);
			
			on(button, "click", lang.hitch(this, function(){
				var newPageNo = (this.page + 1);
				this.page = ((newPageNo > pageCount) ? pageCount : newPageNo);
			}));
		},
		
		_addPaginationPrevious: function(){
			var button = domConstr.create("span", {
				"innerHTML": "Previous"
			}, this.paginationNode);
			
			on(button, "click", lang.hitch(this, function(){
				var newPageNo = (this.page - 1);
				this.page = ((newPageNo > 0) ? newPageNo : 1);
			}));
		},
		
		_addPaginationNumbers: function(){
			var pageCount = this._getPageCount();
			
			var list = domConstr.create("ul", {
				"style" : {
						"display": "inline-block",
				}
			}, this.paginationNode);
			for(var pageNo = 1; pageNo <= pageCount; pageNo++){
				var item = domConstr.create("li", {
					"style" : {
						"display": "inline-block",
						"margin": "3px"
					},
					"innerHTML": pageNo.toString()
				}, list);
				
				on(item, "click", lang.hitch(this, function(evt){
					this.page = parseInt(
						domAttr.get(evt.target, "innerHTML"), 10
					);
				}));
			}
		},
		
		_getPageCount: function(){
			var pageCount = parseInt((this._items.length/this.itemsPerPage), 10);
			return (((this._items.length % this.itemsPerPage) !== 0) ?
				pageCount+1 : pageCount
			);
		},
		
		_getCurrentPage: function(){
			var start = ((this.page-1) * this.itemsPerPage);
			var end = ((this.page * this.itemsPerPage) - 1);
			var items = new Array();
			
			for(var i = start; ((i <= end) && (i < this._items.length)); i++){
				items.push(this._items[i]);
			}
			
			return items;
		},
		
		_getNewItems: function(parentNode){
			// summary:
			//		Get all the new items that need adding.
			// pasrentNode: object XMLNode
			//		The node to check for new items (default to this.domNode).
			// returns: array() XMLNode()
			
			parentNode = ((parentNode === undefined) ? this.domNode : parentNode);
			
			var newItems = new Array();
			var items = $(this.itemTagName, parentNode);
			array.forEach(items, function(item){
				if(item.parentNode === parentNode){
					newItems.push(item);
				}
			}, this);
			items.remove();
			return newItems;
		},
		
		_removeDeletedItems: function(){
			var editedList = new Array();
			
			array.forEach(this._items, function(item){
				if(this._isElement(item)){
					editedList.push(item);
				}
			}, this);
			
			this._items = editedList;
		}
	});
	
	return construct;
});