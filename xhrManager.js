// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/interval",
	"dojo/request",
	"lib/md5",
	"dojo/_base/lang"
], function(
	declare, interval, request, md5, lang
) {
	"use strict";
	
	var xhrAttemptsLookup = new Object();
	var attempts = 3;
	var timeout = 8*1000;
	var queue = new Array();
	var running = 0;
	var limit = 2;
	
	function xhrCall(obj){
		try{
			if(obj !== null){
				running++;
				request(
					obj.url, {
						"handleAs": obj.handleAs,
						"preventCache": obj.preventCache,
						"timeout": obj.timeout
					}
				).then(
					function(data){
						running--;
						obj.success(data);
					},
					function(e){
						running--;
						running = ((running < 0) ? 0 : running);
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
				"preventCache": true
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
	
	function xhrError(obj, e){
		// summary:
		//		Fallback when XHR request fails.
		// description:
		//		Fallback for XHR on failure, will retry a few
		//		times before a total fail.
		
		running--;
		running = ((running < 0) ? 0 : running);
		
		var hash = md5(url);
		if(!isProperty(xhrAttemptsLookup, hash)){
			xhrAttemptsLookup[hash] = attempts;
		}
			
		if(xhrAttemptsLookup[hash] > 0){
			xhrAttemptsLookup[hash]--;
			queue.push(obj);
		}else{
			if(isProperty(obj, "onError")){
				obj.onError(e);
			}else{
				console.info(obj.errorMsg);
			}
		}
	}
	
	function checkQueue(){
		if((running < limit) && (queue.length > 0)){
			var obj = queue.shift();
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
			queue.push(obj);
		}
	};
	
	interval.add(checkQueue, true, 1);
	
	return construct;
});