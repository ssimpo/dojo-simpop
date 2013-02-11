// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/array",
	"dojo/_base/lang"
], function(
	array, lang
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
		"_trueValues": ["yes", "true", "on", "checked", "ticked", "1"],
		"_falseValues": ["no", "false", "off", "unchecked", "unticked", "0"],
		
		isTrue: function(value){
			if(value === true){
				return true;
			}
			if(value === 1){
				return true;
			}
			
			try{
				var stringValue = value.toString();
				for(var i = 0; i < construct._trueValues.length; i++){
					if(this.isEqual(stringValue, construct._trueValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		isFalse: function(value){
			if(value === false){
				return true;
			}
			if(value === 0){
				return true;
			}
			if(this._isBlank(value)){
				return true;
			}
			try{
				var stringValue = value.toString();
				for(var i = 0; i < construct._falseValues.length; i++){
					if(this.isEqual(stringValue, construct._falseValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		isEqual: function(value1, value2){
			if((construct.isString(value1)) && (construct.isString(value2))){
				return (construct._isEqualStrings(value1, value2));
			}else if((construct.isObject(value1)) && (construct.isObject(value2))){
				return construct._isEqualObjects(value1, value2);
			}else if(value1 === value2){
				return true;
			}
			
			return false;
		},
		
		_isEqualStrings: function(value1, value2){
			return (lang.trim(value1.toLowerCase()) == lang.trim(value2.toLowerCase()));
		},
		
		_isEqualObjects: function(obj1, obj2){
			for(var key in obj1){
				if(!construct.isProperty(key, obj2)){
					return false;
				}
			}
			for(var key in obj2){
				if(!construct.isProperty(key, obj1)){
					return false;
				}
			}
			
			for(var key in obj1){
				if(obj1[key]){
					if(construct.isObject(obj1[key])){
						if(!construct._isEqualObjects(obj1[key], obj2[key])){
							return false;
						}
					}else if(construct.isFunction(obj1[key])){
						if((typeof(obj2[key]) == 'undefined') || (obj1[key].toString() != obj2[key].toString())){
							return false;
						}
					}else if (obj1[key] !== obj2[key]){
						return false;
					}
				}else{
					if(obj2[key]){
						return false;
					}
				}
			}
			
			return true;
		},
		
		isArray: function(value){
			return (Object.prototype.toString.call(value) === '[object Array]');
		},
		
		isEmpty: function(value){
			if(construct.isArray(value)){
				return construct._isBlankArray(value);
			}else if(construct.isObject(value)){
				return construct._isBlankObject(value);
			}
			
			return false;
		},
		
		isBlank: function(value){
			if((value === null) || (value === undefined) || (value === "") || (value === false) || (value === 0)){
				return true;
			}
			if(typeof value == "undefined"){
				return true;
			}
			
			if(construct.isString(value)){
				return (lang.trim(value.replace(/\&nbsp\;/g," ")) === "");
			}else if(construct.isArray(value)){
				return construct.isEmpty(value);
			}else if(construct.isObject(value)){
				if(construct.isElement(value)){
					return construct.isBlank(domAttr.get(value, "innerHTML"));
				}else{
					return construct.isEmpty(value);
				}
			}
			
			return false;
		},
		
		_isBlankArray: function(ary){
			if(ary.length == 0){
				return true;
			}else{
				for(var i = 0; i < ary.length; i++){
					if(!construct.isBlank(ary[i])){
						return false;
					}
				}
			}
			
			return true;
		},
		
		_isBlankObject: function(obj){
			for(var key in obj){
				if(construct.isProperty(obj, key)){
					return false;
				}
			}
			return true;
		},
		
		isObject: function(value){
			return construct.isType(value, "object");
		},
		
		isNumber: function(value){
			return construct.isType(value, "number");
		},
		
		isString: function(value){
			return construct.isType(value, "string");
		},
		
		isElement: function(value){
			return (
				(typeof HTMLElement === "object") ?
					(value instanceof HTMLElement) :
					(value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName === "string")
			);
		},
		
		isType: function(value, type){
			return (
				construct._isEqualStrings(Object.prototype.toString.call(value), "[object "+type+"]")
				||
				construct._isEqualStrings(typeof value, type)
			);
		},
		
		isArrayBuffer: function(value){
			return construct.isType(value, "arrayBuffer");
		},
		
		isProperty: function(value, propName){
			if(construct.isObject(value)){
				if(construct.isString(propName)){
					return ((Object.prototype.hasOwnProperty.call(value, propName)) || (propName in value));
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
					for(var key in propName){
						if(!construct.isProperty(value, key)){
							return false;
						}else{
							var obj = propName[key];
							var subValue = value[key];
							if(construct.isString(obj)){
								if(obj !== ""){
									var testFunc = construct["is" + construct._capitaliseFirstLetter(obj)];
									if(!construct.isType(subValue, obj)){
										return false;
									}
								}
							}
							
							if(construct.isObject(obj) || construct.isArray(obj)){
								if(!construct.isProperty(subValue, obj)){
									return false;
								}
							}
						}
					}
					
					return true;
				}
			}
			
			return false;
		},
		
		_capitaliseFirstLetter: function(txt){
			return txt.charAt(0).toUpperCase() + txt.slice(1);
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