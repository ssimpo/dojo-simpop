// dependancies:
//		https://bitbucket.org/ssimpo/dojo-lib

define([
	"dojo/has",
	"dojo/_base/kernel",
	"lib/flashDetect"
], function(has, dojo, flashDetect){
	var flash = null;
	
	has.add("flash", function(){
		if(flash == null){
			flash = new flashDetect();
		}
		return flash.installed;
	});
	
	has.add("flash-version", function(){
		if(flash == null){
			flash = new flashDetect();
		}
		return Number(flash.major+'.'+flash.minor);
	});
});