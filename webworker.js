// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/Evented",
	"require",
	"dojo/_base/lang",
	"dojo/has",
	"dojo/json",
	"dojo/_base/array",
	"dojo/on"
], function(
	declare, Evented, require, lang, has, JSON, array, on
){
	"use strict";
	
	var construct = declare([Evented], {
		"src": null,
		"worker": null,
		
		constructor: function(){
			lang.mixin(this, arguments[0]);
			this._init(arguments);
		},
		
		_init: function(args){
			if(has("webworker")){
				this._loadWorker();
			}
		},
		
		_loadWorker: function(){
			if(this.src !== null){
				if(has("webworker")){
					var dojoWorkerUrl = require.toUrl("./worker/worker.js");
					this.worker = new Worker(dojoWorkerUrl);
					
					on(this.worker, "message", lang.hitch(this, this._receiveMessage));
					
					this.postMessage({
						"type": "init",
						"message": {
							"src": require.toUrl(this.src),
							"relativePath": require.toUrl("./"),
							"dojoConfig": dojoConfig
						}
					});
				}
			}
		},
		
		_receiveMessage: function(message){
			var messageObj = message.data;
			if(!has("webworker-can-post-objects")){
				messageObj = this._parseStringToObject(messageObj);
			}
			
			if(!this._handleConsole(messageObj)){
				if(this._isObject(messageObj)){
					if(messageObj.hasOwnProperty("type") && messageObj.hasOwnProperty("message")){
						if(messageObj.type == "message"){
							on.emit(this, "message", {
								"bubbles": false,
								"cancelable": false,
								"message": messageObj.message
							});
						}
					}
				}
				
				// Do something else? (if other message types needed)?
			}
		},
		
		_isObject: function(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		},
		
		_handleConsole: function(messageObj){
			if(
				(Object.prototype.toString.call(messageObj) === '[object Object]')
			){
				if(
					(messageObj.hasOwnProperty("type"))
					&&
					(messageObj.hasOwnProperty("message"))
				){
					if(messageObj.type == "log"){
						this._callConsole("log", messageObj.message);
						return true;
					}
					if(messageObj.type == "error"){
						this._callConsole("error", messageObj.message);
						return true;
					}
					if(messageObj.type == "warn"){
						this._callConsole("warn", messageObj.message);
						return true;
					}
					if(messageObj.type == "info"){
						this._callConsole("info", messageObj.message);
						return true;
					}
				}
			}
			
			return false;
		},
		
		_callConsole: function(msgType, args){
			if(args == undefined){
				args = msgType;
				msgType = "log";
			}
			if(Object.prototype.toString.call(args) !== '[object Array]'){
				args = new Array(args);
			}
			
			console[msgType].apply(console,args);
		},
		
		_parseMessageToObject: function(text){
			var message = text;
			if(Object.prototype.toString.call(text) === '[object String]'){
				try{
					message = JSON.parse(text);
				}catch(e){
					message = text;
				}
			}
			
			return message;
		},
		
		postMessage: function(message){
			if(has("webworker")){
				if(this.worker !== null){
					this.worker.postMessage(message);
				}else{
					console.error("Tried to post a message to a worker that has not been initialized.");
				}
			}
		}
		
	});
	
	var main = {
		_called: false,
		_hasCanPostObjectsCalled: false,
		_hasCanPostObjects: false,
		
		init: function(){
			if(!main._called){
				has.add("webworker", main.hasWorker);
				if(has("webworker")){
					this._hasCanPostObjectsSetup();
				}
				has.add("webworker-can-post-objects", main.hasWorker);
				
				main._called = true;
			}
		},
		
		hasWorker: function(global, document, anElement){
			return (typeof global.Worker === "function");
		},
		
		hasCanPostObjects: function(global, document, anElement){
			return main._hasCanPostObjects;
		},
		
		_hasCanPostObjectsSetup: function(){
			if(!main._hasCanPostObjectsCalled){
				var dummyUrl = require.toUrl("./worker/dummy.js");
				var worker = new Worker(dummyUrl);
				
				on(worker, "message", function(event){
					if(!main._hasCanPostObjectsCalled){
						main._hasCanPostObjects = (event.data.value === 'dummy');
						//main._hasCanPostObjectsCallback.call(
							//null, (event.data.value === 'dummy')
						//);
					}
					main._hasCanPostObjectsCalled = true;
					worker.terminate();
				});
					
				try{
					worker.postMessage({'value': 'dummy'});
				}catch(e){
					if(!main._hasCanPostObjectsCalled){
						main._hasCanPostObjects = false;
						//main._hasCanPostObjectsCallback.call(null, false);
					}
					main._hasCanPostObjectsCalled = true;
					worker.terminate();
				}
			}
		}
		/*,
		_hasCanPostObjectsCallback: function(objectSupported) {
			main._hasCanPostObjects = objectSupported;
			console.log("POSTMESSAGE SUPPORTS OBJECTS: ",objectSupported);
		}*/
	};
	
	main.init();
	return construct;
});