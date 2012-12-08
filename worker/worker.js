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
				
				if(obj.hasOwnProperty("relativePath")){
					staticObj.relativePath = obj.relativePath;
					staticObj._loadIncludes();
					
				}
				
				if(obj.hasOwnProperty("src")){
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
		}
	};
	
	global.addEventListener('message', function(e) {
		var message = e.data;
		if(staticObj._isObject(message)){
			if(message.hasOwnProperty("type") && message.hasOwnProperty("message")){
				if(message.type == "init"){
					staticObj._init(message.message);
				}
			}
		}
	}, false);
	
	var orginalPostMessage = global.postMessage;
	global.postMessage = function(obj){
		orginalPostMessage(obj);
	}
}

dojoWorker();