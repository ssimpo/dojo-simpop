require([
	"dojo/on",
	"dojo/_base/lang",
	"simpo/xhrManager"
], function(
	on, lang, xhrManager
){
	var global = Function('return this')() || (42, eval)('this');
	
	function isObject(value){
		return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
	}
	
	function isProperty(obj, propName){
		if(isObject(obj)){
			return ((Object.prototype.hasOwnProperty.call(obj, propName)) || (propName in obj));
		}
			
		return false;
	}
	
	on(global, "message", function(message){
		if(isProperty(message, "data")){
			if(isProperty(message.data, "type") && isProperty(message.data, "command")){
				if((message.data.type == "command") && (message.data.command == "getXhr")){
					xhrManager.add(message.data);
				}
			}
		}
	});
})