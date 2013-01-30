// summary:
//		
// description:
//
define([
    "dojo/_base/declare",
    "dojo/_base/Color"
], function(
    declare, dojoColour
){
    
    var construct = declare([dojoColour],{
        "name": "",
        h:0,s:0,l:0,
        _currentlySetting:false,
        
        constructor: function() {
            this.inherited(arguments);
            this.setHSLfromRGB(this.r,this.g,this.b);
        },
        
        setColor: function(color) {
            this.inherited(arguments);
            this.setHSLfromRGB(this.r,this.g,this.b);
        },
        setColour: function(colour) {
            this.setColor(colour);
        },
        
        setHSLfromRGB: function(r,g,b) {
            this.r = Math.round(r);
            this.g = Math.round(g);
            this.b = Math.round(b);
            if (!this._currentlySetting) {
                this._currentlySetting = true;
                this.setYUVfromRGB(this.r,this.g,this.b);
            }
            this._currentlySetting = false;
            
            r /= 255, g /= 255, b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, l = (max + min) / 2;
            
            if (max == min){
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                
                switch(max){
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }
            
            this.h = h;this.s = s;this.l = l;
        },
        
        setRGBfromHSL: function(h, s, l) {
            var r, g, b;
            this.h = h;this.s = s;this.l = l;
            
            if(s == 0) {
                r = g = b = l; // achromatic
            } else {
                function hue2rgb(p, q, t) {
                    if(t < 0) t += 1;
                    if(t > 1) t -= 1;
                    if(t < 1/6) return p + (q - p) * 6 * t;
                    if(t < 1/2) return q;
                    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }
                
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            
            this.r = Math.round(r*255);
            this.g = Math.round(g*255);
            this.b = Math.round(b*255);
            if (!this._currentlySetting) {
                this._currentlySetting = true;
                this.setYUVfromRGB(this.r,this.g,this.b);
            }
            this._currentlySetting = false;
        },
        
        setYUVfromRGB: function(r, g, b) {
            this.r = Math.round(r);
            this.g = Math.round(g);
            this.b = Math.round(b);
            if (!this._currentlySetting) {
                this._currentlySetting = true;
                this.setHSLfromRGB(this.r,this.g,this.b);
            }
            this._currentlySetting = false;
            
            var WR = 0.299;
            var WB = 0.114;
            var WG = 1 - WR - WB;
            var UM = 0.436;
            var VM = 0.615;
            
            this.y = this._clamp(WR*r + WG*g + WB*b);
            this.u = this._clamp2(UM*((b-this.y)/(1-WB)),-UM,UM);
            this.v = this._clamp2(VM*((r-this.y)/(1-WR)),-VM,VM);
        },
        
        setRGBfromYUV: function(y, u, v) {
            var WR = 0.299;
            var WB = 0.114;
            var WG = 1 - WR - WB;
            var UM = 0.436;
            var VM = 0.615;
            
            this.y = this._clamp(y);
            this.u = this._clamp2(u,-UM,UM);
            this.v = this._clamp2(v,-VM,VM);
            
            this.r = Math.round(this.y + (this.v * ((1-WR)/VM)));
            this.g = Math.round(this.y - (this.u * ((WB*(1-WB))/(UM*WG))) - (this.v * ((WR*(1-WR))/(VM*WG))));
            this.b = Math.round(this.y + (this.U * ((1-WB)/UM)));
            
            if (!this._currentlySetting) {
                this._currentlySetting = true;
                this.setHSLfromRGB(this.r,this.g,this.b);
            }
            this._currentlySetting = false;
        },
        
        colourise: function(amount) {
            this.y += amount / 100;
            this.y = this._clamp(this.y);
            this.setRGBfromYUV(this.y,this.u,this.v);
        },
        decolourise: function(amount) {
            this.y += amount / 100;
            this.y = this._clamp(this.y);
            this.setRGBfromYUV(this.y,this.u,this.v);
        },
        saturate: function (amount) {
            this.s += amount / 100;
            this.s = this._clamp(this.s);
            this.setRGBfromHSL(this.h,this.s,this.l);
        },
        desaturate: function (amount) {
            this.s -= amount / 100;
            this.s = this._clamp(this.s);
            this.setRGBfromHSL(this.h,this.s,this.l);
        },
        lighten: function (amount) {
            this.l += amount / 100;
            this.l = this._clamp(this.l);
            this.setRGBfromHSL(this.h,this.s,this.l);
        },
        darken: function (amount) {
            this.l -= amount / 100;
            this.l = this._clamp(this.l);
            this.setRGBfromHSL(this.h,this.s,this.l);
        },
        spin: function (amount) {
            var h = this.h * 360;
            var hue = (h + amount) % 360;
            h = hue < 0 ? 360 + hue : hue;
            this.setRGBfromHSL(h/360,this.s,this.l);
        },
        brightness: function(value){
           return (this.r*0.299) + (this.g*0.587) + (this.b*0.114);
        },
        _clamp: function(val) {
            return Math.min(1, Math.max(0, val));
        },
        _clamp2: function(val,min,max) {
            return Math.min(max, Math.max(min, val));
        }
    });
    
    return construct;
});