if (console && !orginalConsole) var orginalConsole = console;

var console = {
	_global: Function('return this')() || (42, eval)('this'),
	
	_hasOwnProperty: function(obj, propName){
		return Object.prototype.hasOwnProperty.call(obj, propName);
	},
	
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
		var args = arguments;
		if(arguments.length > 0){
			args = new Array();
			for(var i = 0; i < arguments.length; i++){
				if(this._isErrorObject(arguments[i])){
					args.push(this._convertErrorObjectToString(arguments[i]));
				}else{
					args.push(arguments[i]);
				}
			}
		}
		
		console._global.postMessage({
			"type": "error", "message": args
		});
		if(orginalConsole){
			if(orginalConsole.log){
				orginalConsole.log(arguments);
			}
		}
	},
	_convertErrorObjectToString: function(obj){
		return obj.toString();
	},
	_isErrorObject: function(obj){
		if(typeof obj === "object"){
			return ((console._hasOwnProperty(obj, "response") && console._hasOwnProperty(obj, "fileName") && console._hasOwnProperty(obj, "lineNumber")) || (console._hasOwnProperty(obj, "message") && console._hasOwnProperty(obj, "code")));
		}else{
			return false;
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
