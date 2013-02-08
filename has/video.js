// dependancies:
//		https://bitbucket.org/ssimpo/dojo-lib

define([
	"dojo/has",
	"dojo/_base/kernel",
	"dojo/dom-construct"
],function(has, dojo, domConstruct){
	var videoNode = '';
	
	function _createHiddenDiv(){
		var hiddenDiv = domConstruct.create(
			"div",{'style':{
				'visibility':'hidden',
				'width':'1px','height':'1px',
				'overflow':'hidden'
			}}
		);
		
		return hiddenDiv;
	}
	
	function _getBoolean(value){
		var valueStr = value.toString().toLowerCase();
		
		value = ((valueStr == 'maybe')?true:value);
		value = ((valueStr == 'probably')?true:value);
		value = ((valueStr == 'true')?true:value);
		value = ((valueStr == '1')?true:value);
		value = ((valueStr == 'yes')?true:value);
		value = ((valueStr == 'no')?false:value);
		value = ((valueStr == 'false')?false:value);
		value = ((valueStr == '')?false:value);
		value = ((valueStr == '0')?false:value);
		
		return value;
	}
	
	has.add("html5-video", function(){
		var hiddenDiv = _createHiddenDiv();
		videoNode = domConstruct.create("video",{},hiddenDiv);
		
		if(typeof videoNode !== "undefined"){
			return ((videoNode.canPlayType)?true:false);
		}
		return false;
	});
	
	has.add("video-h264-baseline", function(){
		var h264 = false;
		var h264codec = 'video/mp4; codecs="avc1.42E01E';
		
		if(has('html5-video')){
			h264 = (_getBoolean(videoNode.canPlayType(h264codec + '"')) || _getBoolean(videoNode.canPlayType(h264codec + ', mp4a.40.2"')));
		}
		return h264;
	});
	
	has.add("video-ogg-theora", function(){
		var ogg = false;
		if(has('html5-video')){
			ogg = _getBoolean(videoNode.canPlayType('video/ogg; codecs="theora, vorbis'));
		}
		return ogg;
	});
	
	has.add("video-webm", function(){
		var webm = false;
		if(has('html5-video')){
			webm = _getBoolean(videoNode.canPlayType('video/webm; codecs="vp8, vorbis"'));
		}
		return webm;
	});
	
});