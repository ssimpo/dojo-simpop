define([
    "dojo/_base/declare",
    "./div",
    "dojo/_base/fx",
    "dojo/dom-style",
    "dojo/on",
    "dojo/_base/lang",
    "simpo/typeTest",
    "dojo/window",
    "dojo/dom-class",
    "dojo/query",
    "dojo/_base/array",
    "dojo/dom-geometry"
], function(
    declare, simpoDiv, fx, domStyle, on, lang, typeTest, win, domClass, $,
    array, domGeom
){
    "use strict";
    
    var construct = declare([simpoDiv], {
        "maxHeight":0,
        "minHeight":0,
        "minWidth":0,
        "maxWidth":0,
        "expanded": false,
        "scroll": false,
        "useAvail": false,
        "availMargin": 0,
        "hideOverflow": true,
        "expandToContent": true,
        
        "_animationLength": 500,
        "_allowExpandContractFlag": true,
        "_currentAnimation": null,
        "_overflowExpanded": null,
        "_overflowContracted": null,
        
        postCreate: function(){
            this._init();
            this._initExpandingDiv();
        },
        
        _initExpandingDiv: function(){
            this._applyDefaultClass();
            this._setMinMax();
            this._setHeightWidth();
            this._addMouseEvents();
        },
        
        _setHideOverflowAttr: function(value){
            if(value){
                this._setupHideOverflow();
                this.hideOverflow = true;
                this._hideShowOverflow();
            }else{
                this._removeHideOverflow();
                this.hideOverflow = false;
                this._showAll();
            }
        },
        
        _setupHideOverflow: function(){
            if(this._overflowExpanded === null){
                this._overflowExpanded = on(
                    this.domNode,
                    "contracted",
                    lang.hitch(this, this._handleOverflowContracted)
                );
            }
            
            if(this._overflowContracted === null){
                this._overflowContracted = on(
                    this.domNode,
                    "expanded",
                    lang.hitch(this, this._handleOverflowExpanded)
                );
            }
        },
        
        _removeHideOverflow: function(){
            if(this._overflowExpanded !== null){
                this._overflowExpanded.remove();
                this._overflowExpanded = null;
            }
            if(this._overflowContracted !== null){
                this._overflowContracted.remove();
                this._overflowContracted = null;
            }
        },
        
        _handleOverflowContracted: function(){
            this._hideShowOverflow();
        },
        
        _handleOverflowExpanded: function(){
            this._hideShowOverflow();
        },
        
        hideShow: function(){
            if(this.get("hideOverflow")){
                this._hideShowOverflow();
            }
        },
        
        _showAll: function(){
            var nodes = this._getChildNodes();
            array.forEach(nodes, function(node){
                domStyle.set(node, "visibility", "visible");
            }, this);
        },
        
        _hideShowOverflow: function(){
            var domNodeBox = domGeom.getMarginBox(this.domNode);
            var domNodeBottom = domNodeBox.t + domNodeBox.h;
            var domNodeRight = domNodeBox.l + domNodeBox.w;
            var nodes = this._getChildNodes();
            
            var maxExtent = 0;
            array.forEach(nodes, function(node){
                var nodeBox = domGeom.getMarginBox(node);
                var nodeBottom = nodeBox.t + nodeBox.h;
                var nodeRight = domNodeBox.l + domNodeBox.w;
                
                if((nodeBottom > domNodeBottom) || (nodeRight > domNodeRight)){
                    domStyle.set(node, "visibility", "hidden");
                }else{
                    domStyle.set(node, "visibility", "visible");
                }
                if(nodeBottom > maxExtent){
                    maxExtent = nodeBottom;
                }
            }, this);
            
            if((maxExtent > 0) && (this.expandToContent)){
                if(maxExtent > this.minHeight){
                    this.set("maxHeight", maxExtent);
                }
            }
        },
        
        _getChildNodes: function(){
            return $("*", this.domNode).filter(function(node){
                return (node.parentNode == this.domNode);
            }, this);  
        },
        
        _applyDefaultClass: function(){
            domClass.remove(this.domNode, "simpoExpandingDiv");
            domClass.add(this.domNode, "simpoExpandingDiv");
        },
        
        _setMinMax: function(){
            this._setMinMaxHeight();
            this._setMinMaxWidth();
        },
        
        _setMinMaxHeight: function(){
            var minHeight = domStyle.get(this.domNode, "minHeight");
            if(minHeight != 0){
                this.minHeight = minHeight;
            }
            
            var maxHeight = domStyle.get(this.domNode, "maxHeight");
            if(maxHeight != 0){
                this.maxHeight = maxHeight;
            }
            
            if((this.minHeight == 0) && (this.maxHeight == 0)){
                this.minHeight = domStyle.get(this.domNode, "height");
                this.maxHeight = this.minHeight;
            }else{
                this.set("maxHeight", this.maxHeight);
            }
            
            this._setExpandedHeight();
        },
        
        _setExpandedHeight: function(){
            var nodes = this._getChildNodes();
            var lastNode = nodes.pop();
            var nodeBox = domGeom.getMarginBox(lastNode);
            var nodeBottom = nodeBox.t + nodeBox.h;
            if(nodeBottom > this.minHeight){
               this.set("maxHeight", nodeBottom);
            }
        },
        
        _setMaxHeightAttr: function(value){
            this.maxHeight = value;
            if(this.useAvail){
                var box = win.getBox();
                var constraint = (box.h - this.availMargin);
                if((constraint < value) && (constraint > this.minHeight)){
                    this.maxHeight = constraint;
                }
            }
        },
        
        _getMaxHeightAttr: function(){
            var value = this.maxHeight;
            if(this.useAvail){
                var box = win.getBox();
                var constraint = (box.h - this.availMargin);
                if((constraint < value) && (constraint > this.minHeight)){
                    value = constraint;
                }
            }
            
            return value;
        },
        
        _setMinMaxWidth: function(){
            var minWidth = domStyle.get(this.domNode, "minWidth");
            if(minWidth != 0){
                this.minWidth = minWidth;
            }
            
            var maxWidth = domStyle.get(this.domNode, "maxWidth");
            if(maxWidth != 0){
                this.maxWidth = maxWidth;
            }
            
            if((this.minWidth == 0) && (this.maxWidth == 0)){
                this.minWidth = domStyle.get(this.domNode, 'width');
                this.maxWidth = this.minWidth;
            }else{
                this.set("maxWidth", this.maxWidth);
            }
        },
        
        _setMaxWidthAttr: function(value){
            this.maxWidth = value;
            if(this.useAvail){
                var box = win.getBox();
                var constraint = (box.w - this.availMargin);
                if((constraint < value) && (constraint > this.minWidth)){
                    this.maxWidth = constraint;
                }
            }
        },
        
        _getMaxWidthAttr: function(){
            var value = this.maxWidth;
            if(this.useAvail){
                var box = win.getBox();
                var constraint = (box.w - this.availMargin);
                if((constraint < value) && (constraint > this.minWidth)){
                    value = constraint;
                }
            }
            
            return value;
        },
        
        _setHeightWidth: function(){
            if(this.minHeight > 0){
                domStyle.set(this.domNode, "height", this.minHeight+'px');
            }
            if(this.minWidth > 0){
                domStyle.set(this.domNode, "width", this.minWidth+'px');
            }
        },
        
        _addMouseEvents: function(){
            on(this.domNode, "mouseover", lang.hitch(this, this._expandDiv));
            on(this.domNode, "mouseout", lang.hitch(this, this._contractDiv));
        },
        
        _createAnimationProperties: function(options){
            var aniProps = new Object;
            
            if(options.startHeight != options.endHeight){
                aniProps.height = {
                    "start":options.startHeight, "end":options.endHeight
                };
            }
            if(options.startWidth != options.endWidth){
                aniProps.width = {
                    "start":options.startWidth, "end":options.endWidth
                };
            }
            
            return ((aniProps !== {}) ? aniProps : null);
        },
        
        _expandDiv: function(evt){
            if(!this.expanded){
                
            var aniProps = this._createAnimationProperties({
                "startHeight": domStyle.get(this.domNode,'height'),
                "endHeight": this.get("maxHeight"),
                "startWidth": domStyle.get(this.domNode,'width'),
                "endWidth": this.get("maxWidth")
            });
            
            if(aniProps !== null){
                this._emitEvent("beforeexpanded");
                this.expanded = true;
                this._animate(aniProps, lang.hitch(this, function(){
                    if(this.scroll){
                        var extraScroll = 25;
                        if(this.useAvail){
                            if(this.availMargin > 0){
                                extraScroll = parseInt((this.availMargin/2), 10);
                            }
                        }
                        window.scrollBy(0, extraScroll);
                    }
                    this._emitEvent("expanded");
                    this.onexpand(this.domNode);
                }));
            }
            }
        },
        
        _emitEvent: function(type){
            on.emit(this.domNode, type, {
                "bubbles": true,
                "cancelable": false,
                "target": this.domNode
            });
        },
        
        _contractDiv: function(evt){
            if(this.expanded){
                
            var node = evt.toElement || evt.relatedTarget;
            
            if(!this._isInsideNode(node, this.domNode)){
                var aniProps = this._createAnimationProperties({
                    "startHeight": domStyle.get(this.domNode,'height'),
                    "endHeight": this.get("minHeight"),
                    "startWidth": domStyle.get(this.domNode,'width'),
                    "endWidth": this.get("minWidth")
                });
                if(aniProps !== null){
                    this._emitEvent("beforecontracted");
                    this.expanded = false;
                    this._animate(aniProps, lang.hitch(this, function(){
                        this._emitEvent("contracted");
                        this.oncontract(this.domNode);
                    }));
                }
            }
            }
        },
        
        _isInsideNode: function(node, targetNode){
            var cNode = node;
            while((cNode != document.body) && (cNode != undefined) && (cNode != document)){
                if(cNode == targetNode){
                    return true;
                }
                cNode = cNode.parentNode;
            }
            
            return false;
        },
        
        _animate: function(aniProps, callback){
            if(this._currentAnimation !== null){
                this._currentAnimation.stop();
            }
            
            this._currentAnimation = fx.animateProperty({
                "node": this.domNode,
                "properties": aniProps,
                "duration": this._animationLength,
                "onEnd": lang.hitch(this, function(){
                    this._currentAnimation = null;
                    callback();
                }),
                "onAnimate": lang.hitch(this, function(evt){
                    if(this.scroll){
                        win.scrollIntoView(this.domNode);
                    }
                    this._emitEvent("resizing");
                }) 
            });
            this._currentAnimation.play();
        },
        
        _pxToNumber: function(val){
            try{
                val = parseInt(val.replace("px",""));
            }catch(e){
                val = NaN;
            }
            return val;
        },
        
        onexpand: function(dom) {
            
        },
        
        oncontract: function(dom) {
            
        },
        
        _allowExpandContract: function() {
            this._allowExpandContractFlag = true;
        }
    });
    
    return construct;
});