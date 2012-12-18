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
		if(obj.hasOwnProperty("response")){
			obj.message = obj.response
		}
		if(obj.hasOwnProperty("code")){
			obj.number = obj.code
		}
		
		var errMessage = "Error"
		if(obj.hasOwnProperty("number") || obj.hasOwnProperty("lineNumber")){
			errMessage += ": ("
			if(obj.hasOwnProperty("number")){
				errMessage += obj.number.toString();
			}
			if(obj.hasOwnProperty("number") && obj.hasOwnProperty("lineNumber")){
				errMessage += " - "
			}
			if(obj.hasOwnProperty("lineNumber")){
				errMessage += "LineNo: " + obj.lineNumber.toString();
			}
			errMessage += ") "
		}else{
			errMessage += ": "
		}
		
		if(obj.hasOwnProperty("message")){
			errMessage += obj.message
		}
		if(obj.hasOwnProperty("fileName")){
			errMessage += " (" + obj.fileName + ")"
		}
		
		return errMessage;
	},
	_isErrorObject: function(obj){
		if(typeof obj === "object"){
			return ((obj.hasOwnProperty("response") && obj.hasOwnProperty("fileName") && obj.hasOwnProperty("lineNumber")) || (obj.hasOwnProperty("message") && obj.hasOwnProperty("code")));
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
