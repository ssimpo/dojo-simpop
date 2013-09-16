// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"simpo/xhrManager",
	"simpo/typeTest",
	"dojo/_base/lang"
], function(
	xhrManager, typeTest, lang
) {
	"use strict";
	
	xhrManager.addOptionsParser(function(construct){
		if(typeTest.isProperty(construct, "method")){
			if(/^wp[^a-z]/.test(construct.method)){
				if(typeTest.isProperty(construct, "data")){
					construct = lang.mixin(construct, {
						"data": {"action": construct.method}
					});
				}else{
					construct.data = {"action": construct.method};
				}
				construct.method = "post";
				construct.url = ajaxurl;
			}
		}
		
		return construct;
	});
});