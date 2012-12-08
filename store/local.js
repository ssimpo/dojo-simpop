// dependancies:
//		https://bitbucket.org/ssimpo/dojo-lib

define([
	"dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/aspect",
	"dojo/_base/lang",
	"lib/lzw",
	"lib/aes",
	"lib/md5"
], function(
	declare, store, aspect, lang, lzw, aes, md5
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
		
		constructor: function(args){
			this._init(args);
			if(this._localStore){
				this._populateStoreFromLocal();
				this._attachAspects();
			}
		},
		
		_init: function(args){
			if(this._isObject(args)){
				for(var key in args){
					this[key] = args[key];
				}
			}
			
			this._encryptionKey = md5(this.id);
			this._initLocalstore();
		},
		
		_initLocalstore: function(){
			if(this.sessionOnly){
				if(sessionStorage){
					this._localStore  = sessionStorage;
				}
			}else{
				if(localStorage){
					this._localStore  = localStorage;
				}
			}
		},
		
		_attachAspects: function(){
			aspect.around(this, "put", lang.hitch(this, this._localPut));
			aspect.around(this, "add", lang.hitch(this, this._localPut));
			aspect.around(this, "remove", lang.hitch(this, this._localRemove));
		},
		
		clear: function(doFullClear){
			doFullClear = ((doFullClear == undefined) ? false : doFullClear);
			var ids = this._getIdArrayFromStorage();
			
			for(var n = 0; n < this._localStore.length; n++){
				this._removeItem(ids[n])
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
			var ids = new Array();
			for(var n = 0; n < this._localStore.length; n++){
				ids.push(this._localStore.key(n));
			}
			return ids;
		},
		
		_populateStoreFromLocal: function(){
			for(var n = 0; n < this._localStore.length; n++){
				var id = this._localStore.key(n);
				var obj = this._getLocalObjectByKey(id);
				
				if(this._isObject(obj)){
					this._copyLocalObjectToMemory(obj);
				}
			}
		},
		
		_copyLocalObjectToMemory: function(obj){
			if(this._getStoreIdForObject(obj) == this.id){
				var obj2 = lang.clone(obj);
				obj2.id = obj2.id.replace("_"+obj2._storeUNID,"");
				delete obj2._storeUNID;
				this.put(obj2, {"id": obj2.id, "overwrite": true});
			}
		},
		
		_copyMemoryObjectToLocal: function(obj){
			var obj2 = lang.clone(obj);
			obj2._storeUNID = this.id;
			obj2.id = obj2.id+"_"+obj2._storeUNID;
			
			var jsonString = JSON.stringify(obj2);
			if(this.compress){
				jsonString = lzw.encode(jsonString);
			}
			if(this.encrypt){
				jsonString = aes.encrypt(
					jsonString,
					this._encryptionKey,
					256
				);
			}
			
			this._localStore.setItem(obj2.id, jsonString);
		},
		
		_getLocalObjectByKey: function(id){
			var obj = this._jsonParse(this._localStore.getItem(id));
			if(this._isObject(obj)){
				obj.id = id;
			}
			
			return obj;
		},
		
		_jsonParse: function(value){
			var nValue = lzw.decode(value);
			if(this._isJsonObject(nValue)){
				return JSON.parse(nValue);
			}
			
			nValue = aes.decrypt(value, this._encryptionKey, 256);
			nValue = lzw.decode(nValue);
			if(this._isJsonObject(nValue)){
				return JSON.parse(nValue);
			}
			
			return value;
		},
		
		_isJsonObject: function(value){
			return ((value.charAt(0) == "{") || (value.charAt(0) == "["));
		},
		
		_getStoreIdForObject: function(obj){
			if(this._isObject(obj)){
				if(this.id != ""){
					if(obj.hasOwnProperty("_storeUNID")){
						return obj._storeUNID;
					}
				}
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
		}
	});
	
	return construct;
});