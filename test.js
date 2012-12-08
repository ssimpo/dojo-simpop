require([
	"dojo/request/xhr",
	"dojo/_base/lang"
], function(
	request, lang
){
	request(
		"/getService.json", {
		//"handleAs": "text",
			"handleAs": "json",
			"preventCache": true
		}
	).then(
		function(data){
			postMessage(data);
			var gb = Function('return this')() || (42, eval)('this');
			
			for(var prop in gb){
				console.log(prop);
			}
		},
		function(err){
			console.error(err);
		}
	);
})

