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
	"simpo/interval"
], function(
	declare, array, lang, interval
) {
	"use strict";
	
	var construct = {
		forEach: function(ary, chunkSize, func, callback, thisObj){
			var chunks = construct._chunkArray(ary, chunkSize);
			if((thisObj !== undefined) && (thisObj !== null)){
				func = lang.hitch(thisObj, func);
				if(callback !== undefined){
					callback = lang.hitch(thisObj, callback);
				}
			}
			if(chunks.length > 0){
				array.forEach(chunks, function(chunk, n){
					interval.add(function(){
						array.forEach(chunk, func);
						if(callback !== undefined){
							if(n == (chunks.length - 1)){
								callback();
							}
						}
					});
				});
			}else{
				if(callback !== undefined){
					callback();
				}
			}
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