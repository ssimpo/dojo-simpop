// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/array"
], function(
	array
){
	"use strict";
	
	var registry = null;
	try{
		require(["dijit/registry"], function(reg){
			registry = reg;
		});
	}catch(e){
		// Probably in a WebWorker or NodeJs
	}
	
	var construct = {
		isArray: function(value){
			return (Object.prototype.toString.call(value) === '[object Array]');
		},
		
		isObject: function(value){
			return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
		},
		
		isNumber: function(value){
			return (Object.prototype.toString.call(value) === '[object Number]');
		},
		
		isString: function(value){
			return (Object.prototype.toString.call(value) === '[object String]');
		},
		
		isElement: function(value){
			return (
				(typeof HTMLElement === "object") ?
					(value instanceof HTMLElement) :
					(value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName === "string")
			);
		},
		
		isArrayBuffer: function(value){
			return (Object.prototype.toString.call(value) === '[object ArrayBuffer]');
		},
		
		isProperty: function(value, propName){
			if(construct.isObject(value)){
				if(construct.isString(propName)){
					return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
				}else if(construct.isArray(propName)){
					var allFound = true;
					array.every(propName, function(property){
						if(!construct.isProperty(value, property)){
							allFound = false;
						}
						return allFound;
					});
					
					return allFound;
				}else if(construct.isObject(propName)){
					var allFound = true;
					for(var key in propName){
						if(!construct.isProperty(value, key)){
							allFound = false;
						}
						
						var cValue = propName[key];
						if((construct.isArray(cValue)) || (construct.isObject(cValue))){
							if(!construct.isProperty(value, cValue)){
								allFound = false;
							}
						}
					}
					
					return allFound;
				}
			}
			
			return false;
		},
		
		isFunction: function(value){
			var getType = {};
			return value && getType.toString.call(value) === '[object Function]';
		},
		
		isWidget: function(value){
			try{
				if((typeof value === "object") && (value !== undefined) && (value !== null)){
					if(construct.isProperty(value, "domNode")){
						try{
							var widget = registry.byNode(value.domNode);
							return (widget !== undefined);
						}catch(e){}
					}
				}
			}catch(e){
				console.info("Failed to do isWidget test");
			}
			
			return false;
		}
	}
	
	return construct;
});