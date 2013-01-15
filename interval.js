// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array"
], function(
	declare, array
) {
	"use strict";
	
	var intervalFunction = null;
	var period = 50;
	var _period = 50;
	var running = false;
	var functionQueue = new Array();
	var functionList = new Array();
	var counter = 0;
	var counterMax = 12;
	
	function initInterval(){
		try{
			if(intervalFunction === null){
				intervalFunction = setInterval(interval, _period);
			}
		}catch(e){
			console.info("Failed to create interval.");
		}
	}
	
	function clearCurrentInterval(){
		try{
			if(_intervalFunction !== null){
				clearInterval(intervalFunction);
				intervalFunction = null;
			}
		}catch(e){
			console.info("Failed to clear interval.");
		}
	}
	
	function interval(){
		try{
			if(!running){
				running = true;
				if(_period !== period){
					clearCurrentInterval();
					_period = period;
					running = false;
					initInterval();
				}else{
					runInterval();
					running = false;
				}
			}
		}catch(e){
			console.info("Could not run the interval.", e);
		}
	}
	
	function runInterval(){
		counter++;
		counter = (
			(counter > counterMax) ? 1 : counter
		);
			
		array.forEach(functionList, function(funcObj, n){
			if((counter % funcObj.frequency) == 0){
				funcObj.execute();
			}
		}, this);
			
		if(functionQueue.length > 0){
			var func = functionQueue.shift();
			func();
		}
	}
	
	var construct = {
		set: function(propName, value){
			if(propName === "period"){
				period = value;
			}
		},
		
		add: function(func, every, frequency){
			every = ((every === undefined) ? false : every);
			frequency = ((frequency === undefined) ? 1 : frequency);
			
			if(every){
				functionList.push({
					"execute": func,
					"frequency": frequency
				});
				if((frequency*2) > counterMax){
					counterMax = (frequency*2);
				}
			}else{
				functionQueue.push(func);
			}
		},
		
		stop: function(){
			clearCurrentInterval();
		},
		
		start: function(){
			initInterval();
		}
	};
	
	construct.start();
	
	return construct;
});