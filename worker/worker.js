var dojoWorker = function(){
	var global = Function('return this')() || (42, eval)('this');
	
	var staticObj = {
		"relativePath": "",
		"_includes": [
			"./worker/console",
			"../dojo/dojo"
		],
		
		_init: function(obj){
			if(staticObj._isObject(obj)){
				global.dojoConfig = obj.dojoConfig;
				
				if(this._hasOwnProperty(obj, "relativePath")){
					staticObj.relativePath = obj.relativePath;
					staticObj._loadIncludes();
					
				}
				
				if(this._hasOwnProperty(obj, "src")){
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
		},
		
		_isObject: function(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		},
		
		_hasOwnProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		}
	};
	
	global.addEventListener('message', function(e){
		function hasOwnProperty(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		}
		
		var message = e.data;
		if(staticObj._isObject(message)){
			if(hasOwnProperty(message, "type") && hasOwnProperty(message, "message")){
				if(message.type == "init"){
					staticObj._init(message.message);
				}
			}
		}
	}, false);
	
	var orginalPostMessage = global.postMessage;
	global.postMessage = function(obj){
		function _isObject(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		}
		function _formatMessage(obj){
			return {
				"type": "message",
				"message": obj
			};
		}
		function hasOwnProperty(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		}
		
		var formatted = true;
		if(_isObject(obj)){
			if(!hasOwnProperty(obj, "type") || !hasOwnProperty(obj, "message")){
				obj = _formatMessage(obj);
			}
		}else{
			obj = _formatMessage(obj);
		}
		
		orginalPostMessage(obj);
	}
}

dojoWorker();