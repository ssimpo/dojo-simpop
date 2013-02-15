// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-attr"
], function(
	array, lang, domAttr
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
	
	function isPrototypeType(value, type){
		return isEqualStrings(Object.prototype.toString.call(value), "[object "+type+"]");
	}
	
	function capitaliseFirstLetter(txt){
		return txt.charAt(0).toUpperCase() + txt.slice(1);
	}
	
	function isEqualStrings(value1, value2){
		return (lang.trim(value1.toLowerCase()) == lang.trim(value2.toLowerCase()));
	}
	
	function isEqualObjects(obj1, obj2){
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
					if(!isEqualObjects(obj1[key], obj2[key])){
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
	}
	
	function isBlankArray(ary){
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
	}
	
	function isBlankObject(obj){
		for(var key in obj){
			if(construct.isProperty(obj, key)){
				if(!construct.isBlank(key)){
					return false;
				}else if(!construct.isBlank(obj[key])){
					return false;
				}
			}
		}
		return true;
	}
	
	function isEmptyObject(obj){
		for(var key in obj){
			if(construct.isProperty(obj, key)){
				return false;
			}
		}
		return true;
	}
	
	function convertToNumber(value){
		try{
			var temp = value.toString();
			if(temp.indexOf(".") === -1){
				temp = parseInt(temp, 10);
			}else{
				temp = parseFloat(temp);
			}
			
			return temp;
		}catch(e){
			return value;
		}
		
		
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
			if(this.isBlank(value)){
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
			if(!isNaN(value1) && !isNaN(value2)){
				return (convertToNumber(value1) == convertToNumber(value2));
			}else{
				if((construct.isString(value1)) && (construct.isString(value2))){
					return (isEqualStrings(value1, value2));
				}else if((construct.isType(value1, "object")) && (construct.isType(value2, "object"))){
					return isEqualObjects(value1, value2);
				}else if(value1 === value2){
					return true;
				}else{
					try{
						value1 = value1.toString().replace(/\s/g,"");
						value2 = value2.toString().replace(/\s/g,"");
						
						return (value1 === value2);
					}catch(e){}
				}
			}
			
			return false;
		},
		
		isArray: function(value){
			return (Object.prototype.toString.call(value) === '[object Array]');
		},
		
		isEmpty: function(value){
			if(construct.isArray(value)){
				return (value.length <= 0);
			}else if(construct.isObject(value)){
				return isEmptyObject(value);
			}
			
			return false;
		},
		
		isBlank: function(value){
			var stringConverted = "";
			try{
				stringConverted = value.toString().toLowerCase();
			}catch(e){}
			
			if((value === null) || (value === undefined) || (value === "") || (value === false) || (value === 0) || (stringConverted == "nan")){
				return true;
			}
			if(typeof value == "undefined"){
				return true;
			}
			
			if(construct.isString(value)){
				return (lang.trim(value.replace(/\&nbsp\;/g," ")) === "");
			}else if(construct.isArray(value)){
				return isBlankArray(value);
			}else if(construct.isType(value, "object")){
				if(construct.isElement(value)){
					return construct.isBlank(domAttr.get(value, "innerHTML"));
				}if(construct.isWidget(value)){
					try{
						value = value.get("value");
						return construct.isBlank(value);
					}catch(e){
						return false;
					}
				}else{
					return isBlankObject(value);
				}
			}
			
			return false;
		},
		
		isObject: function(value){
			return isPrototypeType(value, "object");
		},
		
		isNumber: function(value){
			try{
				return (construct.isType(value, "number") && (!isNaN(value)));
			}catch(e){
				return false;
			}
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
				isPrototypeType(value, type)
				||
				isEqualStrings(typeof value, type)
			);
		},
		
		isArrayBuffer: function(value){
			return construct.isType(value, "arrayBuffer");
		},
		
		isProperty: function(value, propName){
			if(construct.isType(value, "object")){
				if(construct.isString(propName) || construct.isNumber(propName)){
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
									var testFunc = construct["is" + capitaliseFirstLetter(obj)];
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