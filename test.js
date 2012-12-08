

/*var dojoConfig = {
	"async": true,
	"cacheBust": new Date(),
	"parseOnLoad": false,
	"packages": [
		{"name": "dojo", "location":"/scripts/dojo"},
		{"name": "dojox", "location":"/scripts/dojox"},
		{"name": "dijit", "location":"/scripts/dijit"},
		{"name": "rcbc", "location":"/scripts/rcbc"},
		{"name": "lib", "location":"/scripts/lib"},
		{"name": "simpop", "location":"/scripts/simpop"},
		{"name": "simpo", "location":"/scripts/simpo"}
	]
};

importScripts("/scripts/simpo/worker/console.js");
importScripts("/scripts/dojo/dojo.js");*/

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
			console.log(data);
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

