var profile = (function(){
	var testResourceRe = /^dojo\/tests\//;
	var copyOnly = function(filename, mid){
		var list = {};
		
		return (mid in list) ||
			/(png|jpg|jpeg|gif|tiff)$/.test(filename) ||
			/built\-i18n\-test\/152\-build/.test(mid);
	};

	return {
		resourceTags:{
			test: function(filename, mid){
				return testResourceRe.test(mid) || mid=="simpo/tests";
			},

			copyOnly: function(filename, mid){
				return copyOnly(filename, mid);
			},

			amd: function(filename, mid){
				return !testResourceRe.test(mid) && !copyOnly(filename, mid) && /\.js$/.test(filename);
			}
		}
	};
})();
