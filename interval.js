// summary:
//		Interval controller.
// description:
//		Global interval controller, allowing code to be broken into chunks
//		or code scheduled.
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/Deferred",
	"simpo/typeTest"
], function(
	declare, array, Deferred, typeTest
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
	var locks = new Object();
	
	function initInterval(){
		// summary:
		//		Start running the intervals.
		
		try{
			if((intervalFunction === null) && (typeTest.isBlank(locks))){
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
			runIntervalLoop();
			runIntervalQueue();
		}catch(e){
			console.info("Could not run the interval functions.");
		}
	}
	
	function runIntervalQueue(){
		//console.log("Q", functionQueue.length);
		if(functionQueue.length > 0){
			var funcObj = functionQueue.shift();
			while(funcObj.deferred.isCanceled()){
				if(functionQueue.length <= 0){
					break;
				}
				funcObj = functionQueue.shift();
			}
			if(!funcObj.deferred.isCanceled()){
				runIntervalFunction(funcObj, false);
			}
			
		}
	}
	
	function runIntervalLoop(){
		removeCancelled();
		array.forEach(functionList, function(funcObj, n){
			var cCounter = (counter - funcObj.warp);
			if(cCounter <= 0){
				cCounter = (counterMax - cCounter);
			}
				
			if((cCounter % funcObj.frequency) == 0){
				runIntervalFunction(funcObj, true);
			}
		}, this);
	}
	
	function removeCancelled(){
		var cancelled = new Array();
		array.forEach(functionList, function(funcObj, n){
			if(funcObj.deferred.isCanceled()){
				cancelled.push(n);
			}
		});
		
		array.forEach(cancelled, function(n){
			functionList.splice(n, 1);
		}, this);
	}
	
	function runIntervalFunction(funcObj, progress){
		progress = ((progress) ? "progress": "resolve");
		
		if(!funcObj.deferred.isCanceled()){
			try{
				funcObj.execute();
				funcObj.deferred[progress]({
					"status": construct.INTERVALRAN
				});
			
				return true;
			}catch(e){
				funcObj.deferred.reject({
					"status": construct.INTERVALFAILED,
					"error": e
				});
			}
		}
		
		return false;
	}
	
	function rndInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function failedToAdd(deferred, e){
		setTimeout(
			function(){
				deferred.reject({
					"status": construct.INTERVALFAILED,
					"error": e
				});
			}, 1000*2
		);
	}

	
	var construct = {
		"INTERVALRAN": 1,
		"INTERVALFAILED": 2,
		
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
				
				var obj = {
					"execute": func,
					"deferred": new Deferred()
				};
				if(every){
					obj.frequency = frequency;
					obj.warp = rndInt(0,frequency-1);
					functionList.push(obj);
					if((frequency*2) > counterMax){
						counterMax = (frequency*2);
					}
				}else{
					functionQueue.push(obj);
				}
				
				return obj.deferred;
			}catch(e){
				var deferred = new Deferred();
				failedToAdd(deferred, "Could not add interval.");
				return deferred;
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
		},
		
		lock: function(){
			// summary:
			//		
			// description
			//
			
			var lockId = rndInt(0, 1000000000);
			var lock = {
				unlock: function(){
					if(typeTest.isProperty(locks, lockId)){
						delete locks[lockId];
					}
				},
				stop: function(){
					lock.lock();
					construct.stop();
				},
				start: function(){
					lock.unlock();
					construct.start();
				},
				lock: function(){
					locks[lockId] = true;
				}
			};
			
			return lock;
		}
	};
	
	construct.start();
	
	return construct;
});