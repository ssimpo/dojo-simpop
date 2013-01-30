// summary:
//		Interval controller.
// description:
//		Global interval controller, allowing code to be broken into chunks
//		or code scheduled.
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
		// summary:
		//		Start running the intervals.
		
		try{
			if(intervalFunction === null){
				intervalFunction = setInterval(interval, _period);
			}
		}catch(e){
			console.info("Failed to create interval.");
		}
	}
	
	function clearCurrentInterval(){
		// summary:
		//		Stop intervals.
		
		try{
			if(intervalFunction !== null){
				clearInterval(intervalFunction);
				intervalFunction = null;
			}
		}catch(e){
			console.info("Failed to clear interval.");
		}
	}
	
	function interval(){
		// summary:
		//		Interval controller. Only run if interval not already excuting.
		
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
			console.info("Could not run the interval.", point);
		}
	}
	
	function incCounter(){
		// summary:
		//		Increment the counter and return to 1 if past the max value.
		
		try{
			counter++;
			counter = (
				(counter > counterMax) ? 1 : counter
			);
		}catch(e){
			console.info("Could not increment the interval counter");
		}
	}
	
	function runInterval(){
		// summary:
		//		Run an interval.  Will run all the items in sequence in the
		//		function list.  After running the list, run the next item in the
		//		queue. Hence, list functions are run every interval according
		//		to their specfied frequency but queue functions are ran one per
		//		interval.
		// description:
		//		Run an interval.
		
		try{
			incCounter();
			array.forEach(functionList, function(funcObj, n){
				if((counter % funcObj.frequency) == 0){
					funcObj.execute();
				}
			}, this);
			
			if(functionQueue.length > 0){
				var func = functionQueue.shift();
				func();
			}
		}catch(e){
			console.info("Could not run the interval functions.");
		}
	}
	
	var construct = {
		set: function(propName, value){
			// summary:
			//		Set a property.
			
			try{
				if(propName === "period"){
					period = value;
				}
			}catch(e){
				console.info("Could not change property, "+propName+" to "+value+".");
			}
		},
		
		add: function(func, every, frequency){
			// summary:
			//		Add a new scheduled function.
			// func: function
			//		Function to add to the schedule.
			// every: boolean (dafault = false)
			//		If true, will be ran every interval (according to frequency
			//		paramater).  Dafault to only run on the next available
			//		interval slot; this means it will be be placed in a queue,
			//		only one item from the queue is run each interval.
			// frequency: interger (default = 1)
			//		If every is set to true this sets the frequency of running
			//		of the supplied function.  If set to 1, it will run every
			//		interval; if set to 2 then it will run every second interval
			//		...etc.
			
			try{
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
			}catch(e){
				console.info("Could not add interval.");
			}
		},
		
		stop: function(){
			// summary:
			//		Stop all intervals running (will not empty the queue or
			//		the function list).
			
			clearCurrentInterval();
		},
		
		start: function(){
			// summary:
			//		Start running the intervals.
			
			initInterval();
		}
	};
	
	construct.start();
	
	return construct;
});