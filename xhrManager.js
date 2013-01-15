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
	"dojo/_base/array"
], function(
	declare, interval, request, md5, lang, on, JSON, array
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
	var timeout = 8*1000;
	var queue = new Array();
	var workerQueue = {};
	var running = 0;
	var limit = ((isWorker) ? 4 : 2);
	var worker = null;
	var ready = false;
	
	function workerOnMessage(message){
		if(isProperty(message, "message")){
			if(isProperty(message.message, "type")){
				if(message.message.type == "xhrData"){
					if(isProperty(message.message, "data")){
						if(isProperty(workerQueue, message.message.hash)){
							parseWorkerMessage(
								message.message.data,
								workerQueue[message.message.hash]
							);
						}else{
							console.info("Worker returned data that could not be linked to a request");
						}
					}
				}
			}
		}
	}

	function parseWorkerMessage(data, obj){
		try{
			var parsedData = JSON.parse(data);
			xhrSuccess(parsedData, obj);
		}catch(e){
			console.log("Could not parse data returned for: " + obj.url);
		}
	}
	
	function initWorker(){
		require([
			"simpo/webworker",
			"dojo/has"
		], function(webworker, has){
			if(has("webworker")){
				worker = new webworker({
					"src":"/scripts/simpo/xhrManager/worker"
				});
				on(worker, "message", workerOnMessage);
				reCallQueue();
				ready = true;
			}else{
				ready = true;
			}
		});
	}
	
	function reCallQueue(){
		var tempQueue = new Array();
		array.forEach(queue, function(obj){
			tempQueue.push(obj);
		});
		queue = new Array();
		array.forEach(tempQueue, function(obj){
			construct.add(obj);
		});
	}
	
	if(!isWorker){
		initWorker();
	}else{
		ready = true;
	}

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
		decCounter();
		if(isWorker){
			global.postMessage({
				"type": "xhrData",
				"hash": obj.hash,
				"data": data
			});
		}else{
			obj.success(data);
		}
	}
	
	function intConstructor(args){
		var obj = null;
		
		if(args.length === 1){
			var obj = args[0];
		}else{
			if(args.length > 1){
				var obj = {
					"url": args[0],
					"success": args[1]
				};
			}
			if(args.length > 2){
				obj.errorMsg = args[2];
			}
		}
		
		if(isObject(obj)){
			obj = lang.mixin({
				"errorMsg": "Failed to load: " + obj.url,
				"handleAs": "json",
				"timeout": timeout,
				"preventCache": true,
				"hash": md5(obj.url)
			}, obj);
			
			if(isProperty(obj, "hitch")){
				obj.success = lang.hitch(obj.hitch, obj.success);
				if(isProperty(obj, "onError")){
					obj.onError = lang.hitch(obj.hitch, obj.onError);
				}
			}
		}
		
		return obj;
	}
	
	function createPostMessage(obj){
		var message = {
			"type": "command",
			"command": "getXhr",
			"url": obj.url,
			"timeout": obj.timeout,
			"preventCache": obj.preventCache,
			"hash": obj.hash
		}
		
		return message;
	}
	
	function xhrError(obj, e){
		// summary:
		//		Fallback when XHR request fails.
		// description:
		//		Fallback for XHR on failure, will retry a few
		//		times before a total fail.
		
		decCounter();
		if(!isProperty(xhrAttemptsLookup, obj.hash)){
			xhrAttemptsLookup[obj.hash] = attempts;
		}
			
		if(xhrAttemptsLookup[obj.hash] > 0){
			xhrAttemptsLookup[obj.hash]--;
			queue.push(obj);
		}else{
			if(isProperty(obj, "onError")){
				if(isWorker){
					console.info(obj.errorMsg);
				}else{
					obj.onError(e);
				}
			}else{
				console.info(obj.errorMsg);
			}
		}
	}
	
	function checkQueue(){
		if((running < limit) && (queue.length > 0) && (ready)){
			var obj = queue.shift();
			if(!isWorker){
				console.log(ready, obj.url);
			}
			xhrCall(obj);
		}
	}
	
	function isObject(value){
		return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
	}
	
	function isProperty(obj, propName){
		if(isObject(obj)){
			return ((Object.prototype.hasOwnProperty.call(obj, propName)) || (propName in obj));
		}
			
		return false;
	}
	
	var construct = {
		set: function(propName, value){
			if(propName === "timeout"){
				timeout = value;
			}else if(propName === "limitt"){
				limit = value;
			}else if(propName === "attempts"){
				attempts = value;
			}
		},
		
		add: function(url, success, errorMsg){
			var obj = intConstructor(arguments);
			
			if((!isWorker) && (worker !== null)){
				var message = createPostMessage(obj);
				workerQueue[obj.hash] = obj;
				worker.postMessage(message);
			}else{
				queue.push(obj);
			}
		}
	};
	
	interval.add(checkQueue, true, 1);
	
	return construct;
});