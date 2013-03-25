// dependancies:
//		https://bitbucket.org/ssimpo/dojo-lib

define([
	"dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/aspect",
	"dojo/_base/lang",
	"lib/lzw",
	"lib/aes",
	"lib/md5",
	"dojo/json",
	"lib/jsonParse",
	"dojo/sniff",
	"simpo/array",
	"simpo/interval",
	"simpo/typeTest",
	"dojo/Deferred",
	"dojo/_base/array"
], function(
	declare, store, aspect, lang, lzw, aes, md5, JSON, JSON2, sniff,
	iarray, interval, typeTest, Deferred, array
){
	"use strict";
	
	var idCacheLocal = new Array();
	var idCacheCallbacksLocal = new Array();
	var idCacheDoneLocal = false;
	var idCacheRunningLocal = false;
	
	var idCacheSession = new Array();
	var idCacheCallbacksSession = new Array();
	var idCacheDoneSession = false;
	var idCacheRunningSession = false;
	
	function getIdArrayFromStorage(store){
		try{
			var ids = new Array();
			var tester = new RegExp("^[A-Za-z0-9]+_[A-Za-z0-9]+$");
			for(var n = 0; n < store.length; n++){
				var id = store.key(n);
				if(!tester.test(id)){
					store.remove(id);
				}else{
					ids.push(id);
				}
			}
			return ids;
		}catch(e){
			console.info("Could not obtain an ID-array for the browser cache.");
			return [];
		}
	}
	
	function populateIdCache(store, sessionOnly){
		if(sessionOnly){
			return populateIdCacheSession(store);
		}else{
			return populateIdCacheLocal(store)
		}
		
		return null;
	}
	
	function populateIdCacheLocal(store){
		var def = new Deferred();
		idCacheCallbacksLocal.push(def);
		
		if(!idCacheDoneLocal){
			if(!idCacheRunningLocal){
				idCacheRunningLocal = true;
				idCacheLocal = getIdArrayFromStorage(store);
				idCacheDoneLocal = true;
				
				array.forEach(idCacheCallbacksLocal, function(def){
					def.resolve(idCacheLocal);
				});
			}
		}else{
			def.resolve(idCacheLocal);
		}
		
		return def; 
	}
	
	function populateIdCacheSession(store){
		try{
		var def = new Deferred();
		idCacheCallbacksSession.push(def);
		
		if(!idCacheDoneSession){
			if(!idCacheRunningSession){
				idCacheRunningSession = true;
				idCacheSession = getIdArrayFromStorage(store);
				idCacheDoneSession = true;
				
				array.forEach(idCacheCallbacksSession, function(def){
					def.resolve(idCacheSession);
				});
			}
		}else{
			def.resolve(idCacheSession);
		}
		}catch(e){
			console.info(3, e);
		}
		
		return def; 
	}
	
	var construct = declare([store], {
		"id": "simpoStoreLocal",
		"compress": false,
		"encrypt": false,
		"sessionOnly": true,
		"ready": function(){},
		"slicer": 130,
		
		"_localStore": false,
		"_encryptionKey": "",
		"_orginalPut": {},
		"_orginalAdd": {},
		"_orginalRemove": {},
		
		"_idCache": [],
		"_clearing": false,
		"_initDone": false,
		
		constructor: function(args){
			this._init(args);
			if(this._localStore){
				try{
					this._attachAspects();
					this._initPopulation();
				}catch(e){
					console.info("Could not load and interface "+((this.sessionOnly)?"SessionStorage":"LocalStorage")+".", e);
				}
			}
			
			this._initDone = true;
		},
		
		_init: function(args){
			try{
				if(typeTest.isObject(args)){
					for(var key in args){
						this[key] = args[key];
					}
				}
			
				this._encryptionKey = md5(this.id);
				this._initLocalstore();
			}catch(e){
				console.info("Could inititiate the dojo local store.");
			}
		},
		
		_initPopulation: function(){
			populateIdCache(this._localStore, this.sessionOnly).then(
				lang.hitch(this, function(cache){
					this._idCache = cache;
					this._populate();
				})
			);
		},
		
		_stringEndsWith: function(txt, suffix) {
			return txt.indexOf(suffix, txt.length - suffix.length) !== -1;
		},
		
		_populate: function(){
			var size = 0;
			var items = 0;
			var self = this;
			var counter = 0;
			
			iarray.forEach(this._idCache, this.slicer, function(id){
				try{
					if(self._stringEndsWith(id, "_"+self.id)){
						var jsonTxt = self._localStore.getItem(id);
						var obj = self._parseLocalObject(id, jsonTxt);
						
						if(!typeTest.isEmpty(obj)){
							self._copyLocalObjectToMemory(obj);
							size += jsonTxt.length;
							items++;
						}else{
							self._localStore.removeItem(id);
						}
					}
				}catch(e){
					console.info("POPULATE ERROR", e);
				}
			}).then(function(){
				self._checkAndRunReady({
					"bubbles": false,
					"cancelable": false,
					"target": self,
					"size": size,
					"items": items
				});
			});
		},
		
		_getLocalObjectSize: function(id){
			var size = 0;
			
			try{
				var localObjString = self._localStore.getItem(id);
				size = localObjString.length;
			}catch(e){
				console.info("Could not get size of local object: "+id);
			}
			
			return size;
		},
		
		_checkAndRunReady: function(readyObj){
			if(this._initDone){
				this.ready(readyObj);
			}else{
				interval.add(
					lang.hitch(this, this._checkAndRunReady, readyObj)
				);
			}
		},
		
		size: function(callback){
			var size = 0;
			var uncompressedSize = 0;
			var self = this;
			this._idCache = this._getIdArrayFromStorage();
			
			iarray.forEach(this._idCache, this.slicer, function(id){
				var localObjString = self._localStore.getItem(id);
				size += localObjString.length;
			}, function(){
				callback(size, uncompressedSize);
			});
		},
		
		_initLocalstore: function(){
			try{
				if(this.sessionOnly){
					if(sessionStorage){
						this._localStore = sessionStorage;
					}
				}else{
					if(localStorage){
						this._localStore = localStorage;
					}
				}
			}catch(e){
				console.info("Could not initiate browser storage.")
			}
		},
		
		_attachAspects: function(){
			try{
				aspect.around(this, "put", lang.hitch(this, this._localPut));
				aspect.around(this, "add", lang.hitch(this, this._localPut));
				aspect.around(this, "remove", lang.hitch(this, this._localRemove));
			}catch(e){
				console.info("Could not obtain aspects for dojo store.")
			}
		},
		
		clear: function(doFullClear, callback){
			try{
				doFullClear = ((doFullClear == undefined) ? false : doFullClear);
				var ids = this._getIdArrayFromStorage();
				
				this._clearing = true;
				iarray.forEach(
					ids, this.slicer, function(id){
						if(!this._removeItem(id, doFullClear)){
							console.warn("FAILED TO REMOVE ", id);
						}
					}, function(){
						this._clearing = false;
						if(callback !== undefined){
							callback();
						}
					}, this
				);
			}catch(e){
				console.info("Could not clear the storage.")
			}
		},
		
		_removeItem: function(id, doFullClear){
			doFullClear = ((doFullClear == undefined) ? false : doFullClear);
			
			var qry = this.query({"id":id});
			if(qry.length > 0){
				try{
					this.remove(id);
					return true;
				}catch(e){
					return false;
				}
			}else{
				if(doFullClear){
					try{
						this._localStore.removeItem(id);
						return true;
					}catch(e){
						return false;
					}
				}
			}
			
			return false;
		},
		
		_copyLocalObjectToMemory: function(obj){
			try{
				if(this._getStoreIdForObject(obj) == this.id){
					obj = this._removeStoreIdFromId(obj, obj._storeUNID);
					delete obj._storeUNID;
					this.put(obj, {
						"id": obj.id,
						"overwrite": true,
						"memoryOnly": true
					});
				}
			}catch(e){
				console.info("Could not copy cached object to the dojo memory store.", e);
			}
		},
		
		_removeStoreIdFromId: function(obj, storeId){
			var replacer = new RegExp("_"+storeId+"$");
			while(replacer.test(obj.id)){
				obj.id = obj.id.replace(replacer, "");
			}
			
			return obj;
		},
		
		_copyMemoryObjectToLocal: function(obj){
			try{
				var obj2 = lang.clone(obj);
				obj2._storeUNID = this.id;
				obj2 = this._removeStoreIdFromId(obj2, obj2._storeUNID);
				obj2.id = obj2.id+"_"+obj2._storeUNID;
				
				var jsonString = this._stringifyWithCompressEncrypt(obj2);
				try{
					this._localStore.setItem(obj2.id, jsonString);
					var localObjString = this._localStore.getItem(obj2.id);
					return (localObjString === jsonString);
				}catch(e){
					return false
				}
			}catch(e){
				console.info("Could not transferre dojo store object to browser cache.");
				return false;
			}
		},
		
		_stringifyWithCompressEncrypt: function(obj){
			try{
				var jsonString = JSON.stringify(obj);
				if(this.compress){
					jsonString = lzw.encode(jsonString);
				}
				if(this.encrypt){
					this.jsonString = _encryptString(jsonString);
				}
			
				return jsonString;
			}catch(e){
				console.info("Could stringify (with compression & encyptrion) the supplied object.");
				return JSON.stringify(obj);
			}
		},
		
		_encryptString: function(string){
			try{
				return aes.encrypt(string, this._encryptionKey, 256);
			}catch(e){
				console.info("Could not encrypt the suppplied string");
				return string;
			}
		},
		
		_parseLocalObject: function(id, jsonTxt){
			try{
				var obj = this._jsonParse(jsonTxt);
				if(typeTest.isObject(obj)){
					obj.id = id;
				}
			
				return obj;
			}catch(e){
				console.info("Could not parse local object text (ID="+id+")");
				return {};
			}
		},
		
		_getLocalObjectByKey: function(id){
			try{
				var obj = this._jsonParse(this._localStore.getItem(id));
				if(typeTest.isObject(obj)){
					obj.id = id;
				}
			
				return obj;
			}catch(e){
				console.info("Could not get local object from database using supplied key.");
				return {};
			}
		},
		
		_jsonParse: function(value){
			if(typeTest.isBlank(value)){
				return "";
			}
			
			var nValue = this._uncompressAndDecrypt(value);
			try{
				if(this._isJsonObject(nValue)){
					nValue = JSON.parse(nValue);
				}
			}catch(e){
				try{
					nValue = this._jsonFix1(nValue);
				}catch(e){
					try{
						nValue = this._jsonFix2(nValue);
					}catch(e){
						try{
							nValue = eval('(' + nValue + ')');
						}catch(e){
							console.info("could JSON parse the supplied value.", nValue);
							nValue = null;
						}
					}
				}
			}
			
			return nValue;
		},
		
		_jsonFix1: function(txt){
			if(typeTest.isEqual(txt.charAt(0), "[") && !typeTest.isEqual(txt.slice(-1), "]")){
				return txt + "]";
			}else if(typeTest.isEqual(txt.charAt(0), "{") && !typeTest.isEqual(txt.slice(-1), "}")){
				return txt + "}";
			}
			
			return txt
		},
		
		_jsonFix2: function(txt){
			if(typeTest.isEqual(txt.charAt(0), "[") && !typeTest.isEqual(txt.slice(-1), "]")){
				return txt + "\"]";
			}else if(typeTest.isEqual(txt.charAt(0), "{") && !typeTest.isEqual(txt.slice(-1), "}")){
				return txt + "\"}";
			}
			
			return txt
		},
		
		_uncompressAndDecrypt: function(value){
			var nValue = value;
			try{
				if(this.compress && this.encrypt){
					nValue = aes.decrypt(value, this._encryptionKey, 256);
					nValue = lzw.decode(nValue);
				}else if(this.compress && !this.encrypt){
					nValue = lzw.decode(value);
				}else if(!this.compress && this.encrypt){
					nValue = aes.decrypt(value, this._encryptionKey, 256);
				}
			}catch(e){
				console.info("could not uncompress/decrypt the supplied value.");
				nValue = value;
			}
			
			return nValue;
		},
		
		_isJsonObject: function(value){
			return ((value.charAt(0) == "{") || (value.charAt(0) == "["));
		},
		
		_getStoreIdForObject: function(obj){
			try{
				if(typeTest.isObject(obj)){
					if(this.id != ""){
						if(this._hasOwnProperty(obj,"_storeUNID")){
							return obj._storeUNID;
						}
					}
				}
			}catch(e){
				console.info("Could not get ID from supplied object.");
			}
			
			return "";
		},
		
		_localPut: function(orginalPut){
			if(this._clearing){
				return function(){
					return false;
				}
			}
			orginalPut = lang.hitch(this, orginalPut);
			
			return function(obj, options, useLocalStore){
				useLocalStore = ((useLocalStore === undefined) ? true : useLocalStore);
				var result = orginalPut(obj, options);
				if(typeTest.isProperty(options, "memoryOnly")){
					if(options.memoryOnly){
						return result;
					}
				}
				
				if((result != undefined) && (useLocalStore)){
					if(!this._copyMemoryObjectToLocal(obj)){
						console.warn("Could not write " + obj.id + " to local storage.");
					}
				}
				
				return result;
			};
		},
		
		_localRemove: function(orginalRemove){
			orginalRemove = lang.hitch(this, orginalRemove);
			
			return function(id){
				var result = orginalRemove(id);
				
				if(result){
					this._localStore.removeItem(id+"_"+this.id);
				}
				
				return result;
			};
		},
		
		_hasOwnProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		}
	});
	
	return construct;
});