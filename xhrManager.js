// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/interval",
	"dojo/request/xhr",
	"lib/md5",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/json",
	"lib/jsonParse",
	"dojo/_base/array",
	"simpo/typeTest"
], function(
	declare, interval, request, md5, lang, on, JSON, JSON2,
	array, typeTest
) {
	"use strict";
	
	function workerTest(){
		try {
			var test = (!document && !window);
			return test;
		}catch(e){
			return true;
		}
	}

	var global = Function('return this')() || (42, eval)('this');
	var isWorker = workerTest();
	var xhrAttemptsLookup = new Object();
	var attempts = 3;
	var timeout = ((workerTest()) ? 12*1000 : 8*1000);
	var queue = new Array();
	var dataQueue = new Array();
	var workerQueue = {};
	var running = 0;
	var limit = ((isWorker) ? 4 : 2);
	var worker = ((isWorker) ? global.worker : null);
	var ready = false;
	var breakout = false;

	function decCounter(){
		running--;
		running = ((running < 0) ? 0 : running);
	}
	
	function xhrCall(obj){
		try{
			if(obj !== null){
				running++;
				request(
					obj.url, {
						"handleAs": ((isWorker) ? "text" : obj.handleAs),
						"preventCache": obj.preventCache,
						"timeout": obj.timeout
					}
				).then(
					function(data){
						xhrSuccess(data, obj);
					},
					function(e){
						xhrError(obj, e);
					}
				);
			}else{
				console.info("Could not load URL");
			}
		}catch(e){
			console.info(obj.errorMsg);
		}
	}
	
	function xhrSuccess(data, obj){
		try{
			decCounter();
			if(isWorker){
				worker.sendMessage("gotXhr", {
					"hash": obj.hash,
					"data": data
				});
			}else{
				obj.success(data);
			}
		}catch(e){
			console.info("Failed to handle XHR success.");
		}
	}
	
	function intConstructor(args){
		var obj = parseIntConstructorParameters(args);
		
		try{
			if(typeTest.isObject(obj)){
				obj = lang.mixin({
					"errorMsg": "Failed to load: " + obj.url,
					"handleAs": "json",
					"timeout": timeout,
					"preventCache": true,
					"hash": md5(obj.url)
				}, obj);
			
				if(typeTest.isProperty(obj, "hitch")){
					obj.success = lang.hitch(obj.hitch, obj.success);
					if(typeTest.isProperty(obj, "onError")){
						obj.onError = lang.hitch(obj.hitch, obj.onError);
					}
				}
			}
		}catch(e){
			console.info("Could not create a constructor for XHR.");
		}
		
		return obj;
	}
	
	function parseIntConstructorParameters(args){
		var obj = null;
		
		try{
			if(args.length === 1){
				obj = args[0];
			}else{
				if(args.length > 1){
					obj = {
						"url": args[0],
						"success": args[1]
					};
				}
				if(args.length > 2){
					obj.errorMsg = args[2];
				}
			}
		}catch(e){
			console.info("Could not parse initilization parameters.");
		}
		
		return obj;
	}
	
	function createPostMessage(obj){
		var message = {};
		
		try{
			var message = {
				"url": obj.url,
				"timeout": obj.timeout,
				"preventCache": obj.preventCache,
				"hash": obj.hash
			}
		}catch(e){
			console.info("Could not create message to send to worker.");
		}
		
		return message;
	}
	
	function xhrError(obj, e){
		// summary:
		//		Fallback when XHR request fails.
		// description:
		//		Fallback for XHR on failure, will retry a few
		//		times before a total fail.
		
		try{
			decCounter();
			if(!typeTest.isProperty(xhrAttemptsLookup, obj.hash)){
				xhrAttemptsLookup[obj.hash] = attempts;
			}
			
			if(xhrAttemptsLookup[obj.hash] > 0){
				xhrAttemptsLookup[obj.hash]--;
				queue.push(obj);
			}else{
				if(typeTest.isProperty(obj, "onError")){
					if(isWorker){
						console.info(obj.errorMsg);
					}else{
						obj.onError(e);
					}
				}else{
					console.info(obj.errorMsg);
				}
			}
		}catch(e){
			console.info("Error handling a XHR error or timeout.");
		}
	}
	
	function checkQueue(){
		try{
			if((running < limit) && (queue.length > 0) && (ready)){
				var obj = queue.shift();
				if((obj !== null) && (obj !== undefined)){
					xhrCall(obj);
				}
			}
		}catch(e){
			console.info("Could not check the queue.");
		}
	}
	
	function initWorker(){
		require([
			"simpo/webworker",
			"dojo/has"
		], function(webworker, has){
			if(has("webworker")){
				try{
					worker = new webworker({
						"src":"/scripts/simpo/xhrManager/worker"
					});
					on(worker, "gotXhr", onGotXhr);
					reCallQueue();
					ready = true;
					interval.add(checkDataQueue, true, 1);
				}catch(e){
					console.info("Could not create webworker.");
				}
			}else{
				ready = true;
			}
		});
	}
	
	function onGotXhr(message){
		try{
			var messageTemplate = {"message" : {"data":"", "hash":""}};
			if(typeTest.isProperty(message, messageTemplate)){
				var data = message.message.data;
				var hash = message.message.hash;
				
				if(typeTest.isProperty(workerQueue, hash)){
					parseWorkerMessage(
						data,
						workerQueue[hash]
					);
				}else{
					console.info("Worker returned data that could not be linked to a request.");
				}
			}
		}catch(e){
			console.info("Worker returned a message that could not be parsed.");
		}
	}

	function parseWorkerMessage(data, obj){
		try{
			dataQueue.push({"data": data, "obj": obj});
		}catch(e){
			console.info("Could not push worker result to the data queue.");
		}
	}
	
	function jsonParse(txt){
		var parsed = null;
		
		try{
			parsed = JSON.parse(txt);
		}catch(e){
			try{
				parsed = JSON2(txt);
			}catch(e){
				console.warn("PARSE FAIL");
				parsed = txt;
			}
		}
		
		return parsed;
	}
	
	function checkDataQueue(){
		try{
			if(dataQueue.length > 0){
				var obj = dataQueue.shift();
				if(!typeTest.isObject(obj.data)){
					var parsedData = jsonParse(obj.data);
					xhrSuccess(parsedData, obj.obj);
				}else{
					xhrSuccess(obj.data, obj.obj);
				}
			}
		}catch(e){
			//console.log(obj);
			console.log("Could not parse data returned for: " + obj.url + ".");
		}
	}
	
	function reCallQueue(){
		try{
			var tempQueue = new Array();
			array.forEach(queue, function(obj){
				tempQueue.push(obj);
			});
			queue = new Array();
			array.forEach(tempQueue, function(obj){
				construct.add(obj);
			});
		}catch(e){
			console.info("Could not re-call the queue.");
		}
	}
	
	var construct = {
		set: function(propName, value){
			try{
				if(propName === "timeout"){
					timeout = value;
				}else if(propName === "limitt"){
					limit = value;
				}else if(propName === "attempts"){
					attempts = value;
				}
			}catch(e){
				console.info("Could not add set the property, "+propName+", to: " + value.toString() + ".");
			}
		},
		
		add: function(url, success, errorMsg){
			try{
				var obj = intConstructor(arguments);
				if(obj !== null){
					if((!isWorker) && (worker !== null)){
						var message = createPostMessage(obj);
						workerQueue[obj.hash] = obj;
						worker.sendMessage("getXhr", message);
					}else{
						queue.push(obj);
					}
				}
			}catch(e){
				console.info("Could not add: "+url+", to the queue.");
			}
		}
	};
	
	function init(){
		try{
			if(!isWorker){
				initWorker();
			}else{
				ready = true;
			}
			interval.add(checkQueue, true, 1);
		}catch(e){
			console.info("Could not initiate xhrManager.");
		}
	}
	
	init();
	return construct;
});