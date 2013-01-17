(function(){
	var global = Function('return this')() || (42, eval)('this');
	
	function convertArgumentToArray(args){
		var ary = new Array();
		for(var i = 0; i < args.length; i++){
			ary.push(args[i]);
		}
		
		return ary;
	}
	
	global.console = {
		"log": function(){
			var args = convertArgumentToArray(arguments);
			worker.sendMessage(
				"console",
				{"type": "log", "message": args}
			)
		},
	
		"info": function(){
		
		},
	
		"error": function(){
		
		},
	
		"warn": function(){
		
		}
	}
}());