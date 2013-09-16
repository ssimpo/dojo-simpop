(function(){
	var global = Function('return this')() || (42, eval)('this');
	
	function convertArgumentToArray(args){
		var ary = new Array();
		for(var i = 0; i < args.length; i++){
			ary.push(args[i]);
		}
		
		return ary;
	}
	
	function sendConsoleMessage(type, args){
		var message = convertArgumentToArray(args);
		
		worker.sendMessage(
			"console",
			{"type": type, "message": message}
		)
	}
	
	global.console = {
		"log": function(){
			sendConsoleMessage("log", arguments);
		},
	
		"info": function(){
			sendConsoleMessage("info", arguments);
		},
	
		"error": function(){
			sendConsoleMessage("error", arguments);
		},
	
		"warn": function(){
			sendConsoleMessage("warn", arguments);
		}
	}
}());