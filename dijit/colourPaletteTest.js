// summary:
//		
// description:
//
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
    "dojox/color/Palette",
    "./colourPanel",
    "./colourPanelEditor",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/array",
    "dijit/form/Select",
    "dojo/on",
    "dojo/_base/lang"
], function(
	declare, _widget, dojoxPalette, panel, panelEdit, domConstruct, domStyle,
    array, select, on, lang
) {
    
    var construct = declare("simpo.dijit.colourPaletteTest",[_widget],{
        color:'',
        
        _palette: {},
        _adminPanel: {},
        _scheme: {},
        _panels: [],
        
        postMixInProperties: function () {
            this.inherited(arguments);
            this._palette = dojoxPalette.generate(this.color,'triadic');
        },
        
        buildRendering: function() {
            this.inherited(arguments);
            var div = domConstruct.create('div', {
                'style': {'float':'left'}
            }, this.domNode);
            this._createAdminPanel(div);
            this._createSchemeSelector(div);
            this._createDerivedColorPanels(this.domNode);
        },
        
        _createSchemeSelector: function(refNode) {
            this._scheme = new select({
                'options': [
                    { 'label': 'analogous', 'value': 'analogous' },
                    { 'label': 'triadic', 'value': 'triadic', selected: true },
                    { 'label': 'monochromatic', 'value': 'monochromatic' },
                    { 'label': 'complementary', 'value': 'complementary' },
                    { 'label': 'splitComplementary', 'value': 'splitComplementary' },
                    { 'label': 'compound', 'value': 'compound' },
                    { 'label': 'shades', 'value': 'shades' }
                ],
                'width':'200px'
            });
            
            domConstruct.place(this._scheme.domNode,refNode);
            
            on(this._scheme,"change",lang.hitch(this,this._changeScheme));
        },
        
        _createAdminPanel: function(refNode) {
            this._adminPanel = new panelEdit({'colour':this.color});
            domConstruct.place(this._adminPanel.domNode,refNode);
            on(this._adminPanel,"change",lang.hitch(this,this._changeColor));
        },
        
        _createDerivedColorPanels: function(refNode) {
            array.forEach(this._palette.colors,function(color,n){
                if (n>0) {
                    var cPanel = new panel({'colour':color.toHex()});
                    this._panels.push(cPanel);
                    domConstruct.place(cPanel.domNode,refNode);
                }
            }, this);
        },
        
        _changeColor: function(event) {
            this.color = this._adminPanel.colour.toHex();
            this._palette = dojoxPalette.generate(this.color,this._scheme.value);
            array.forEach(this._palette.colors,function(color,n){
                if (n>0) {
                    this._panels[n-1].colour.setColor(color.toHex());
                }
            }, this);
        },
        
        _changeScheme: function(event) {
            this._palette = dojoxPalette.generate(this.color,event);
            array.forEach(this._palette.colors,function(color,n){
                if (n>0) {
                    this._panels[n-1].colour.setColor(color.toHex());
                }
            }, this);
        }
	});
    
    return construct;
});