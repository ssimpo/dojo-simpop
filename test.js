require([
	"dojo/request/xhr",
	"dojo/_base/lang"
], function(
	request, lang
){
	request(
		"/test/stephen/pin.nsf/getService?openagent&id=DD0C5C64625A045380257A48002B0D32", {
		//"handleAs": "text",
			"handleAs": "json",
			"preventCache": true
		}
	).then(
		function(data){
			postMessage(data);
		},
		function(err){
			console.error(err);
		}
	);
})

