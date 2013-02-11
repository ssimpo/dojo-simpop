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
	"dojo/json"
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
			try{
				if(arguments.length > 0){
					for(var key in arguments[0]){
						this[key] = arguments[0][key];
					}
				}
			}catch(e){
				console.info("Could not mix properties into new class.");
			}
			
			this._init();
		},
		
		_init: function(){
			try{
				createWorker(this);
			}catch(e){
				console.info("Could not create and intilalize new worker.");
			}
		},
		
		sendMessage: function(type, message){
			try{
				if(this.worker !== null){
					if((this.ready) || (type == "init")){
						var sMessage = createMessage(type, message);
						this.worker.postMessage(sMessage);
					}else{
						this._messageQueue.push([type, message]);
					}
				}
			}catch(e){
				console.info("Could not send message of type: "+type+", to the webworker");
			}
		}
	});
	
	function createMessage(type, message){
		var sMessage = null;
		
		try{
			if(has("transferable-objects")){
				sMessage = createTransferableObject(type, message);
			}else{
				sMessage = {
					"type": type,
					"message": message
				};
			}
		}catch(e){
			console.info("Could not create message object for postMessage.");
		}
			
		return sMessage;
	}
	
	function calcBufferLength(type, message){
		try{
			return ((message.length*2) + (type.length*2) + 2);
		}catch(e){
			console.info("Could not calculate buffer size.");
			return 0;
		}
	}
	
	function createTransferableObject(type, message){
		try{
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
		}catch(e){
			console.info("Could not create transferrable object.");
			return null;
		}
	}
	
	function createWorker(worker){
		worker.worker = null;
		
		if(has("webworker")){
			try{
				var dojoWorkerUrl = require.toUrl("./worker/worker.js");
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
			console.info("Could not convert array buffer to object.");
			return null;
		}
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
			console.info("JSON conversion error.");
		}
		
		return txt;
	}
	
	function getMessageObject(data){
		var message = null;
		
		try{
			if(typeTest.isObject(data)){
				if(typeTest.isProperty(data, "data")){
					message = data.data;
				
					if(typeTest.isArrayBuffer(message)){
						message = convertArrayBufferToObject(message);
					}
				}
			}
		}catch(e){
			console.info("Could not get message object.");
		}
		
		return message;
	}
	
	function handleReadyMessage(worker){
		try{
			while(worker._messageQueue.length > 0){
				worker.ready = true;
				var qMessage = worker._messageQueue.shift();
				worker.sendMessage(qMessage[0], qMessage[1]);
			}
		}catch(e){
			console.info("Could not handle ready message.");
		}
	}
	
	function handleConsole(message){
		try{
			console[message.type].apply(console, message.message);
		}catch(e){
			console.info("Could not pass-on console message from the webworker.");
		}
	}
	
	function emitMessage(worker, message){
		try{
			on.emit(worker, message.type, {
				"bubbles": false,
				"cancelable": false,
				"message": message.message,
				"target": worker
			});
		}catch(e){
			console.info("Could not emit message on worker.");
		}
	}
	
	function receiveMessage(worker, data){
		try{
			var message = getMessageObject(data);
			if((message !== null) && (typeTest.isObject(message))){
				if(
					(typeTest.isProperty(message, "type"))
					&&
					(typeTest.isProperty(message, "message"))
				){
					if(message.type == "ready"){
						handleReadyMessage(worker);
					}else if(message.type == "console"){
						handleConsole(message.message);
					}else{
						emitMessage(worker, message)
					}
				}
			}
		}catch(e){
			console.info("Could not handle received message properly.");
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