// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/Evented",
	"simpo/colour",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dojox/widget/ColorPicker",
	"dijit/Dialog",
	"dojo/_base/lang",
	"dojo/on",
	"dijit/form/TextBox",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dijit/Menu",
	"dijit/MenuItem"
], function(
	declare, _widget, _templated, evented, colour, domStyle, domAttr, colourPicker,
	dialog, lang, on, textbox, domConstruct, domClass, context, menuItem
) {
    
    var construct = declare("simpo.dijit.colourPanelAdmin",[_widget,_templated,evented],{
		templateString:'<div class="dojoSimpoDijitColourPanel" data-dojo-attach-point="container"></div>',
		colour:{},
		name:'',
		
		_picker:false,
		_dialog:false,
		_colourNameBox:{},
		
		buildRendering: function() {
			this.inherited(arguments);
			this.setColour(this.colour);
			if (this.name != '') {
				domAttr.set(this.container,'title',this.name);
			}
			on(this.container,"click",lang.hitch(this,this.select));
			
			var menu = new context({});
			menu.addChild(new menuItem({
				label:"Edit",
				onClick: lang.hitch(this,this.select)
			}));
			menu.addChild(new menuItem({
				label:"Delete",
				onClick: lang.hitch(this,this._delete)
			}));
			menu.bindDomNode(this.container);
		},
		
		_delete: function(event) {
			var eventObj = {
				'type':'delete',
                'bubbles': false,
                'cancelable':false,
                'target':this.container,
                'currentTarget':this.container,
                'originalTarget':this.container,
                'explicitOriginalTarget':this.container,
                'srcElement':this.container,
                'timeStamp':new Date().getTime(),
                'dijit':this,
                'eventPhase':2
            };
			this.emit("delete",eventObj);
		},
		
		select: function(event){
			if (!this._picker) {
				var div = domConstruct.create('div');
				var divTop = domConstruct.create('div',{
					'class':'dojoSimpoColourPanelAdminDialogDivTop'
				},div);
				var id = this._rndId('colourName');
				var label = domConstruct.create('label',{
					'for':'colourName',
					'innerHTML':'Colour Name:'
				},divTop);
				this._colourNameBox = new textbox({
					'value':this.name,'name':id, 'id':id
				});
				domConstruct.place(this._colourNameBox.domNode,divTop);
				this._picker = new colourPicker({'value':this.colour.toHex()});
				domConstruct.place(this._picker.domNode,div);
				
				this._dialog = new dialog({
					'title':'Metro Panel Colour Picker',
					'content':div,
					'onCancel': lang.hitch(this,this._colourPicked),
					'class':'dojoSimpoWidgetColourPanelAdminDialog'
				});
			}
			
			this._dialog.show();
		},
		
		_rndId: function(prefix) {
            return prefix+'-'+this._randomInt(0,1000000000000);
        },
        
        _randomInt: function(from, to){
            return Math.floor(Math.random() * (to - from + 1) + from);
        },
		
		_colourPicked: function(event) {
			this.setColour(this._picker.value);
			
			var eventObj = {
				'type':'change',
                'bubbles': false,
                'cancelable':false,
                'target':this.container,
                'currentTarget':this.container,
                'originalTarget':this.container,
                'explicitOriginalTarget':this.container,
                'srcElement':this.container,
                'timeStamp':new Date().getTime(),
                'dijit':this,
                'eventPhase':2
            };
			this.emit("change",eventObj);
		},
		
		setColour: function(colourVal) {
			if (typeof colourVal == 'string') {
				this.colour = new colour(colourVal);
			} else {
				this.colour = colourVal;
			}
			
			domStyle.set(this.container,{
				'backgroundColor':this.colour.toHex(),
				'borderColor':this.colour.toHex(),
			});
			
		}
	});
    
    return construct;
});