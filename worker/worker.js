var dojoWorker = function(){
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
	
	var staticObj = {
		"relativePath": "",
		"_includes": [
			"./worker/console",
			"../dojo/dojo"
		],
		
		_init: function(obj){
			if(isObject(obj)){
				global.dojoConfig = obj.dojoConfig;
				
				if(isProperty(obj, "relativePath")){
					staticObj.relativePath = obj.relativePath;
					staticObj._loadIncludes();
					
				}
				
				if(isProperty(obj, "src")){
					staticObj._importScript(obj.src);
				}
			}
		},
		
		_loadIncludes: function(){
			if(staticObj._includes.length > 0){
				for(var i = 0; i < staticObj._includes.length; i++){
					staticObj._importRelativeScript(
						staticObj._includes[i]
					);
				}
			}
		},
		
		_importScript: function(src){
			var path = staticObj._getPathPath(src);
			var query = staticObj._getPathQuery(src);
			
			importScripts(path+".js"+query);
		},
		
		_importRelativeScript: function(src){
			var path = staticObj._getPathPath(staticObj.relativePath);
			var query = staticObj._getPathQuery(staticObj.relativePath);
			importScripts(path+src+".js"+query);
		},
		
		_getPathPath: function(path){
			var parts = path.split("?");
			return parts[0];
		},
		
		_getPathQuery: function(path){
			var parts = path.split("?");
			var query = "";
			
			if(parts.length > 1){
				query = "?" + parts[1];
			}
			
			return query;
		}
	};
	
	global.addEventListener('message', function(e){
		var message = e.data;
		if(isObject(message)){
			if(isProperty(message, "type") && isProperty(message, "message")){
				if(message.type == "init"){
					staticObj._init(message.message);
				}
			}
		}
	}, false);
	
	var orginalPostMessage = global.postMessage;
	global.postMessage = function(obj){
		function formatMessage(obj){
			return {
				"type": "message",
				"message": obj
			};
		}
		
		var formatted = true;
		if(isObject(obj)){
			if(!isProperty(obj, "type") || !isProperty(obj, "message")){
				obj = formatMessage(obj);
			}
		}else{
			obj = formatMessage(obj);
		}
		
		orginalPostMessage(obj);
	}
}

dojoWorker();