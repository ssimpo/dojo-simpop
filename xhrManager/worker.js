require([
	"dojo/_base/lang",
	"dojo/on",
	"simpo/xhrManager",
	"simpo/typeTest"
], function(lang, on, xhrManager, typeTest){
	on(worker, "getXhr", function(message){
		xhrManager.add(message.message);
	});
});