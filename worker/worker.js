var worker = new Object();

(function(worker, global){
	var messageQueue = new Array();
	
	function isObject(value){
		return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
	}
	
	function isArrayBuffer(value){
		return (Object.prototype.toString.call(value) === '[object ArrayBuffer]');
	}
	
	function isProperty(obj, propName){
		if(isObject(obj)){
			return ((Object.prototype.hasOwnProperty.call(obj, propName)) || (propName in obj));
		}
			
		return false;
	}
	
	function isString(value){
		return (Object.prototype.toString.call(value) === '[object String]');
	}
	
    var staticObj = {
		"relativePath": "",
		"_includes": [
			"worker/console",
			"../dojo/dojo"
		],
		"transferableObjects": false,
		"on": null,
		"lang": null,
		"ready": false,
		"readySent": false,
		
		_init: function(obj, ready){
			if(isObject(obj)){
				global.dojoConfig = obj.dojoConfig;
				
				if((isProperty(obj, "relativePath")) && (isProperty(obj, "src"))){
					staticObj.relativePath = obj.relativePath;
					staticObj._loadIncludes();
					
					if(isProperty(obj, "transferableObjects")){
						staticObj.transferableObjects = obj.transferableObjects;
					}
					
					staticObj._assignDojoClasses(function(){
						staticObj._importScript(obj.src);
						staticObj.ready = true;
						ready();
					});
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
		
		_assignDojoClasses: function(callback){
			require([
				"dojo/on",
				"dojo/_base/lang",
				"dojo/Evented"
			], function(on, lang, Evented){
				var sendMessage = global.worker.sendMessage;
				staticObj.on = on;
				staticObj.lang = lang;
				global.worker = new Evented();
				global.worker.sendMessage = sendMessage;
				callback();
			});
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
		
		_emitMessage: function(message){
			if(staticObj.on !== null){
				staticObj.on.emit(global.worker, message.type, {
					"bubbles": false,
					"cancelable": false,
					"message": message.message,
					"target": global.worker
				});
			}
		}
	};
	
	function handleInitMessage(message){
		staticObj._init(message, function(){
			global.worker.sendMessage("ready", "ready");
			staticObj.readySent = true;
			while(messageQueue.length > 0){
				var qMessage = messageQueue.shift();
				global.worker.sendMessage(qMessage[0], qMessage[1]);
			}
		});
	}
	
	function convertArrayBufferToObject(buffer){
		try{
			var view = new Uint16Array(buffer);
			var type = "";
			var i = 0;
			var code = view[i++];
			while((code !== 0) && (i < view.length) && (i < 100)){
				type += String.fromCharCode(code);
				code = view[i++];
			}
		
			view = new Uint16Array(buffer, (type.length*2)+2);
			var message = "";
			for(var i = 0; i < view.length; i++){
				message += String.fromCharCode(view[i]);
			}
			message = convertJson(message);
		
			return {
				"type": type,
				"message": message
			};
		}catch(e){
			console.info("Could not convert array buffer to object in worker thread.");
			return null;
		}
	}
	
	function trim(value){
		return value.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
	};
	
	function convertJson(txt){
		try{
			if(isString(txt)){
				var trimmed = trim(txt);
				if(trimmed.length > 1){
					var firstChar = trimmed.substring(0, 1);
					var lastChar = trimmed.substring(trimmed.length-1);
					
					if(
					   ((firstChar == "{") && (lastChar == "}"))
					   ||
					   ((firstChar == "[") && (lastChar == "]"))
					){
						trimmed = JSON.parse(trimmed);
						return trimmed;
					}
				}
			}
		}catch(e){
			console.info("JSON conversion error in worker thread.");
		}
		
		return txt;
	}
	
	function calcBufferLength(type, message){
		try{
			return ((message.length*2) + (type.length*2) + 2);
		}catch(e){
			console.info("Could not calculate buffer size in worker thread.");
			return 0;
		}
	}
	
	function createTransferableObject(type, message){
		try{
			if(!isString(message)){
				message = JSON.stringify(message);
			}
		
			var bufferSize = calcBufferLength(type, message);
			var buffer = new ArrayBuffer(bufferSize);
			var view = new Uint16Array(buffer);
		
			for (var i = 0; i < type.length; i++){
				view[i] = type.charCodeAt(i);
			}
			view[i] = 0;
			for (var ii = 0; ii < message.length; ii++){
				view[i+ii+1] = message.charCodeAt(ii);
			}
			
			return buffer;
		}catch(e){
			return {
				"type": type,
				"message": e.message
			}
		}
	}
	
	function createMessage(type, message){
		var sMessage = null;
		
		try{
			if(staticObj.transferableObjects){
				sMessage = createTransferableObject(type, message);
			}else{
				sMessage = {
					"type": type,
					"message": message
				};
			}
		}catch(e){
			console.info("Could not create message object for postMessage in worker thread.");
		}
		
		return sMessage;
	}
	
	var orginalOnMessage = global.onmessage;
	global.onmessage = function(e){
		var message = e.data;
		
		if(isArrayBuffer(message)){
			message = convertArrayBufferToObject(message);
		}
		
		if(isObject(message)){
			if(isProperty(message, "type") && isProperty(message, "message")){
				if(message.type == "init"){
					handleInitMessage(message.message);
				}else{
					staticObj._emitMessage(message);
				}
			}else{
				//emitMessage(e, message);
			}
		}
	}

	global.worker.sendMessage = function(type, message){
		if(((!staticObj.ready) || (!staticObj.readySent)) && (type != "ready")){
			messageQueue.push([type, message]);
		}else{
			if(global.worker !== null){
				var sMessage = createMessage(type, message);
				global.postMessage(sMessage);
			}
		}
	};
}(worker, this));