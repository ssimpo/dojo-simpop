// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/Evented",
	"simpo/dijit/colourPanelAdmin",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/_base/connect",
	"dojo/_base/lang",
	"dojo/query",
	"dojo/NodeList-dom",
	"dojo/dom-attr",
	"dijit/form/Button",
	"dojo/on",
	"dojo/json",
	"dojo/dom-style"
], function(
	declare, _widget, evented, panel, array, domConstruct, connect, lang, $, domNodeList,
	domAttr, button, on, json, domStyle
) {
    
    var construct = declare("simpo.dijit.colourPickerAdmin",[_widget,evented],{
		templateString:'<div class="dojoSimpoDijitColourPicker" data-dojo-attach-point="container"><input type="hidden" value="" name="" data-dojo-attach-point="input" /></div>',
		
		colours:[],
		selected:0,
		panels:[],
		container:{},
		input:{},
		name:'',
		id:'',
		
		_values:[],
		_addButton:{},
		_defaultColour:{'colour':'#000000','name':'black'},
		
		buildRendering: function() {
			this.inherited(arguments);
			this._construct_template();
			
			array.forEach(this.colours,function(colour) {
				var panelObj;
				if (typeof colour == 'string') {
					panelObj = new panel({'colour':colour});
				} else {
					panelObj = new panel(colour);
				}
				this._values.push({'colour':panelObj.colour.toHex(),'name':panelObj.name});
				
				on(panelObj,'change',lang.hitch(this,this._update));
				on(panelObj,'delete',lang.hitch(this,this._deletePanel));
				this.panels.push(panelObj);
				domConstruct.place(panelObj.domNode,this.container);
			},this);
			
			this._setInputValue();
			this._addAddButton();
		},
		
		_setInputValue: function() {
			this.input.value = json.stringify(this._values);
		},
		
		_addAddButton: function() {
			this._addButton = new button({
				'label':'add',
				'onClick':lang.hitch(this,this._addPanel)
			});
			domConstruct.place(this._addButton.domNode,this.container,'last');
		},
		
		_addPanel: function() {
			var panelObj = new panel(this._defaultColour);
			on(panelObj,'change',lang.hitch(this,this._update));
			this.panels.push(panelObj);
			domConstruct.place(panelObj.domNode,this.container);
			this._values.push(this._defaultColour);
			this._setInputValue();
		},
		
		_construct_template: function() {
			this._set_colours();
			
			this.name = domAttr.get(this.domNode,'name');
			this.id = domAttr.get(this.domNode,'id');
			
			this.container = domConstruct.create('div',{
				'class':'dojoSimpoDijitColourPicker'
			});
			domConstruct.place(this.container,this.domNode,'replace');
		
			var inputContstr = {'type':'hidden','name':this.name,'value':this.selected};
			if (this.id != '') {
				inputContstr.id = this.id;
			}
			
			this.input = domConstruct.create('input',inputContstr,this.container);
		},
		
		_set_colours: function() {
			var options = $('option',this.domNode);
			if (options.length > 0) {
				this.colours = new Array();
				array.forEach(options,function(option,n) {
					var colour = domAttr.get(option,'value');
					var name = option.innerHTML;
					var selected = domAttr.get(option,'selected');
					if (selected) { this.selected = n; }
					this.colours.push({'name':name,'colour':colour});
				},this);
			}
		},
		
		_update: function(event) {
			var data = {
				'name':event.dijit.name,
				'colour':event.dijit.colour.toHex()
			};
			
			array.forEach(this.panels,function(panel,n) {
				if (panel == event.dijit) {
					this._values[n] = data;
				}
			},this);
			
			this._setInputValue();
		},
		
		_deletePanel: function(event) {
			var panels = new Array();
			var values = new Array();
			
			array.forEach(this.panels,function(panel,n) {
				if (panel != event.dijit) {
					panels.push(this.panels[n]);
					values.push(this._values[n]);
				} else {
					panel.destroy();
				}
			},this);
			this.panels = panels;
			this._values = values;
			this._setInputValue();
		}
	});
    
    return construct;
});