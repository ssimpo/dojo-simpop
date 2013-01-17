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
	"simpo/typeTest",
	"dojo/has",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/JSON"
], function(
	declare, Evented, require, typeTest, has, on, lang, JSON
){
	"use strict";
	
	var construct = declare([Evented], {
		"src": null,
		"worker": null,
		"ready": false,
		
		"_messageQueue": [],
		
		constructor: function(){
			if(arguments.length > 0){
				for(var key in arguments[0]){
					this[key] = arguments[0][key];
				}
			}
			
			this._init();
		},
		
		_init: function(){
			createWorker(this);
			on(this, "console", handleConsole);
		},
		
		sendMessage: function(type, message){
			if(this.worker !== null){
				if((this.ready) || (type == "init")){
					var sMessage = createMessage(type, message);
					//console.log("SENDING", sMessage);
					this.worker.postMessage(sMessage);
				}else{
					this._messageQueue.push([type, message]);
				}
			}
		}
	});
	
	function createMessage(type, message){
		var sMessage = null;
		
		if(has("transferable-objects")){
			sMessage = createTransferableObject(type, message);
			//console.log(1, sMessage);
			//sMessage = convertArrayBufferToObject(sMessage);
			//console.log(2, sMessage);
		}else{
			sMessage = {
				"type": type,
				"message": message
			};
		}
		
		return sMessage;
	}
	
	function calcBufferLength(type, message){
		return ((message.length*2) + (type.length*2) + 2);
	}
	
	function createTransferableObject(type, message){
		if(!typeTest.isString(message)){
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
	}
	
	function createWorker(worker){
		worker.worker = null;
		
		if(has("webworker")){
			try{
				var dojoWorkerUrl = require.toUrl("./worker/worker2.js");
				worker.worker = new Worker(dojoWorkerUrl);
				
				on(
					worker.worker,
					"message",
					lang.hitch(this, receiveMessage, worker)
				);
				
				worker.sendMessage("init", {
					"src": require.toUrl(worker.src),
					"relativePath": require.toUrl("./"),
					"dojoConfig": dojoConfig,
					"transferableObjects": has("transferable-objects")
				});
			}catch(e){
				console.info("Could not create new WebWorker", e);
			}
		}
	}
	
	function convertArrayBufferToObject(buffer){
		var view = new Uint16Array(buffer);
		var type = "";
		var i = 0;
		var code = view[i++];
		while((code !== 0) && (i < view.length) && (i < 100)){
			type += String.fromCharCode(code);
			code = view[i++];
		}
		
		view = new Uint16Array(buffer, (type.length*2)+2);
		var message = String.fromCharCode.apply(null, view);
		message = convertJson(message);
		
		return {
			"type": type,
			"message": message
		};
	}
	
	function convertJson(txt){
		try{
			if(typeTest.isString(txt)){
				var trimmed = lang.trim(txt);
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
			console.info("JSON ERROR", e);
		}
		
		return txt;
	}
	
	function getMessageObject(data){
		var message = null;
		
		if(typeTest.isObject(data)){
			if(typeTest.isProperty(data, "data")){
				message = data.data;
				
				if(typeTest.isArrayBuffer(message)){
					message = convertArrayBufferToObject(message);
					//console.log("CONVERSION RESULT", message);
				}
			}
		}
		
		return message;
	}
	
	function handleReadyMessage(worker){
		while(worker._messageQueue.length > 0){
			worker.ready = true;
			var qMessage = worker._messageQueue.shift();
			worker.sendMessage(qMessage[0], qMessage[1]);
		}
	}
	
	function handleConsole(e){
		console[e.message.type].apply(console, e.message.message);
	}
	
	function receiveMessage(worker, data){
		//console.log("RECEIVED MESSAGE", data.data);
		
		var message = getMessageObject(data);
		if((message !== null) && (typeTest.isObject(message))){
			if(
				(typeTest.isProperty(message, "type"))
				&&
				(typeTest.isProperty(message, "message"))
			){
				if(message.type == "ready"){
					handleReadyMessage(worker);
				}else{
					
					//console.log("EMMITTING: ["+message.type+"]", message.message);
					on.emit(worker, message.type, {
						"bubbles": false,
						"cancelable": false,
						"message": message.message,
						"target": worker
					});
				}
			}
		}
	}
	
	var hasTests = {
		"_called": false,
		
		init: function(){
			if(!hasTests._called){
				has.add("webworker", hasTests.hasWorker);
				if(has("webworker")){
					has.add(
						"transferable-objects",
						hasTests.hasTransferableObjects
					);
				}else{
					has.add(
						"transferable-objects",
						false
					);
				}
				
				hasTests._called = true;
			}
		},
		
		hasWorker: function(global, document, anElement){
			return typeTest.isFunction(global.Worker);
		},
		
		hasTransferableObjects: function(global, document, anElement){
			var dummyUrl = require.toUrl("./worker/dummy.js");
			var worker = new Worker(dummyUrl);
			
			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			var ab = new ArrayBuffer(1);
			worker.postMessage(ab, [ab]);
			if (ab.byteLength) {
				worker.terminate();
				return false;
			}
			
			worker.terminate();
			return true;
		}
	};
	
	hasTests.init();
	return construct;
});