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
	"lib/md5"
], function(
	declare, interval, request, md5
) {
	"use strict";
	
	var xhrAttemptsLookup = new Object();
	var attempts = 3;
	var timeout = 8*1000;
	var queue = new Array();
	var running = 0;
	var limit = 2;
	
	function xhrCall(url, success, errorMsg){
		try{
			running++;
			request(
				url, {
					"handleAs": "json",
					"preventCache": true,
					"timeout": timeout
				}
			).then(
				function(data){
					running--;
					success(data);
				},
				function(e){
					running--;
					running = ((running < 0) ? 0 : running);
					xhrError(url, success, errMsg, e);
				}
			);
		}catch(e){
			console.info(errorMsg);
		}
	}
	
	function xhrError(url, success, errorMsg, e){
		// summary:
		//		Fallback when XHR request fails.
		// description:
		//		Fallback for XHR on failure, will retry a few
		//		times before a total fail.
		
		running--;
		running = ((running < 0) ? 0 : running);
		
		var hash = md5(url);
		if(!hasProperty(xhrAttemptsLookup, hash)){
			xhrAttemptsLookup[hash] = attempts;
		}
			
		if(xhrAttemptsLookup[hash] > 0){
			xhrAttemptsLookup[hash]--;
			queue.push([url, success, errorMsg]);
		}else{
			console.info("Failed to load: " + url);
			console.info(errorMsg);
		}
	}
	
	function checkQueue(){
		if((running < limit) && (queue.length > 0)){
			var data = queue.shift();
			xhrCall(data[0], data[1], data[2]);
		}
	}
	
	function isObject(value){
		return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
	}
	
	function hasProperty(obj, propName){
		if(this._isObject(obj)){
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
			queue.push([url, success, errorMsg]);
		}
	};
	
	interval.add(checkQueue, true, 1);
	
	return construct;
});