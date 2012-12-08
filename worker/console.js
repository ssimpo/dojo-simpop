if (console && !orginalConsole) var orginalConsole = console;

var console = {
	_global: Function('return this')() || (42, eval)('this'),
	
	log: function(){
		var ary = new Array();
		for(var i = 0; i < arguments.length; i++){
			ary.push(arguments[i]);
		}
		
		console._global.postMessage({
			"type": "log", "message": ary
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	error: function(){
		console._global.postMessage({
			"type": "error", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	info: function(){
		console._global.postMessage({
			"type": "info", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	warn: function(){
		console._global.postMessage({
			"type": "warn", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	}
};
