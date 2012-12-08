if (console && !orginalConsole) var orginalConsole = console;

var console = {
	log: function(){
		var ary = new Array();
		for(var i = 0; i < arguments.length; i++){
			ary.push(arguments[i]);
		}
		
		global.postMessage({
			"type": "log", "message": ary
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	error: function(){
		global.postMessage({
			"type": "error", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	info: function(){
		global.postMessage({
			"type": "info", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	warn: function(){
		global.postMessage({
			"type": "warn", "message": arguments
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	}
};
