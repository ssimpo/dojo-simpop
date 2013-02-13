// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"simpo/interval",
	"dojo/promise/all",
	"simpo/typeTest"
], function(
	declare, array, lang, interval, promiseAll, typeTest
) {
	"use strict";
	
	var construct = {
		forEach: function(ary, chunkSize, func, callback, thisObj){
			if((thisObj === undefined) || (thisObj === null)){
				if((callback !== undefined) && (callback !== null) && (!typeTest.isFunction(callback))){
					thisObj = callback;
					callback = undefined;
				}
			}
			if((thisObj !== undefined) && (thisObj !== null)){
				func = lang.hitch(thisObj, func);
				if(callback !== undefined){
					callback = lang.hitch(thisObj, callback);
				}
			}
			
			return construct._forEach(ary, chunkSize, func, callback, thisObj);
		},
		
		_forEach: function(ary, chunkSize, func, callback, thisObj){
			var chunks = construct._chunkArray(ary, chunkSize);
			var promises = new Array();
			
			var lock = interval.lock();
			lock.stop();
			if(chunks.length > 0){
				array.forEach(chunks, function(chunk, n){
					promises.push(interval.add(function(){
						array.forEach(chunk, func);
						if(callback !== undefined){
							if(n == (chunks.length - 1)){
								callback();
							}
						}
					}));
				});
			}
			lock.start();
			
			return promiseAll(promises);
		},
		
		_chunkArray: function(ary, chunkSize){
			var chunks = new Array();
			for(var i = 0, chunkNo = 0; i < ary.length; i += chunkSize, chunkNo++){
				chunks[chunkNo] = ary.slice(i, i + chunkSize);
			}
			
			return chunks;
		}
	};
	
	return construct;
});