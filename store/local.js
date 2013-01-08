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
	"dojo/topic",
	"dojo/sniff"
], function(
	declare, store, aspect, lang, lzw, aes, md5, JSON, topic, sniff
){
	"use strict";
	
	var construct = declare(store, {
		"id": "simpoStoreLocal",
		"compress": false,
		"encrypt": false,
		"sessionOnly": true,
		
		"_localStore": false,
		"_encryptionKey": "",
		"_orginalPut": {},
		"_orginalAdd": {},
		"_orginalRemove": {},
		
		"_idCache": [],
		"_initPopulateInterval": null,
		"_trottle": 50,
		"_slicer": 250,
		
		constructor: function(args){
			this._init(args);
			
			if(this._localStore){
				try{
					this._initPopulation();
					this._attachAspects();
				}catch(e){
					console.info("Could not load and interface "+((this.sessionOnly)?"SessionStorage":"LocalStorage")+".");
				}
			}
		},
		
		_init: function(args){
			try{
				if(this._isObject(args)){
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
			if(!sniff("ie")){
				this._trottle /= 3;
			}
			this._idCache = this._getIdArrayFromStorage();
			this._initPopulateInterval = setInterval(
				lang.hitch(this, this._populate), this._trottle
			);
		},
		
		_populate: function(){
			if(this._idCache.length > 0){
				var ids = new Array();
				
				for(var i = 0; ((i < this._idCache.length) && (i < this._slicer)); i++){
					ids.push(this._idCache.shift());
				}
				
				this._populateStoreFromLocal(ids);
			}else{
				clearInterval(this._initPopulateInterval);
				topic.publish("/simpo/store/local/databaseReady");
			}
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
		
		clear: function(doFullClear){
			try{
				doFullClear = ((doFullClear == undefined) ? false : doFullClear);
				var ids = this._getIdArrayFromStorage();
			
				if(!doFullClear){
					for(var n = 0; n < this._localStore.length; n++){
						this._removeItem(ids[n], doFullClear);
					}
				}else{
					this.clear();
					this._localStore.clear();
				}
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
				}catch(e){ }
			}else{
				if(doFullClear){
					try{
						this._localStore.removeItem(id);
						return true;
					}catch(e){ }
				}
			}
			
			return false;
		},
		
		_getIdArrayFromStorage: function(){
			try{
				var ids = new Array();
				for(var n = 0; n < this._localStore.length; n++){
					ids.push(this._localStore.key(n));
				}
				return ids;
			}catch(e){
				console.info("Could not obtain an ID-array for the browser cache.");
				return [];
			}
		},
		
		_populateStoreFromLocal: function(ids){
			try{
				for(var n = 0; n < ids.length; n++){
					//var id = this._localStore.key(n);
					var id = ids[n];
					var obj = this._getLocalObjectByKey(id);
				
					if(this._isObject(obj)){
						this._copyLocalObjectToMemory(obj);
					}
				}
			}catch(e){
				console.info("Could not populate memory store from browser cache.");
			}
		},
		
		_copyLocalObjectToMemory: function(obj){
			try{
				if(this._getStoreIdForObject(obj) == this.id){
					var obj2 = lang.clone(obj);
					obj2.id = obj2.id.replace("_"+obj2._storeUNID,"");
					delete obj2._storeUNID;
					this.put(obj2, {"id": obj2.id, "overwrite": true});
				}
			}catch(e){
				console.info("Could not copy cached object to the dojo memory store.");
			}
		},
		
		_copyMemoryObjectToLocal: function(obj){
			try{
				var obj2 = lang.clone(obj);
				obj2._storeUNID = this.id;
				obj2.id = obj2.id+"_"+obj2._storeUNID;
			
				var jsonString = this._stringifyWithCompressEncrypt(obj2);
				this._localStore.setItem(obj2.id, jsonString);
			}catch(e){
				console.info("Could not transferre dojo store object to browser cache.");
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
		
		_getLocalObjectByKey: function(id){
			try{
				var obj = this._jsonParse(this._localStore.getItem(id));
				if(this._isObject(obj)){
					obj.id = id;
				}
			
				return obj;
			}catch(e){
				console.info("Could not get local object from database using supplied key.");
				return {};
			}
		},
		
		_jsonParse: function(value){
			if((value === "")|(value === undefined)||(value === null)){
				return "";
			}
			
			var nValue = this._uncompressAndDecrypt(value);
			try{
				if(this._isJsonObject(nValue)){
					nValue = JSON.parse(value);
				}
			}catch(e){
				console.info("could JSON parse the supplied value.");
				nValue = value;
			}
			
			return nValue;
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
				if(this._isObject(obj)){
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
		
		_isObject: function(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		},
		
		_localPut: function(orginalPut){
			orginalPut = lang.hitch(this, orginalPut);
			
			return function(obj, options){
				var result = orginalPut(obj, options);
				if(result != undefined){
					this._copyMemoryObjectToLocal(obj);
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