// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"doh",
	"../typeTest",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dijit/form/TextBox"
], function(
	doh, typeTest, domConstr, domAttr, TextBox
){
	"use strict";
	
	var fixtures = {
		"blank": function(){},
		"deferred": function(){
			this.deferred = new doh.Deferred();
		}
	};
	
	var tearDowns = {
		"blank":function(){}	
	};
	
	doh.register("simpo/typeTest", [{
		"name": "isStringTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isString(""));
			doh.assertTrue(typeTest.isString("TEST"));
			doh.assertTrue(typeTest.isString(new String()));
			doh.assertTrue(typeTest.isString("1"));
			doh.assertFalse(typeTest.isString(1));
			doh.assertFalse(typeTest.isString([""]));
			doh.assertFalse(typeTest.isString({}));
			doh.assertFalse(typeTest.isString(undefined));
			doh.assertFalse(typeTest.isString(null));
			doh.assertFalse(typeTest.isString(NaN));
		}
	}, {
		"name": "isNumberTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isNumber(1));
			doh.assertTrue(typeTest.isNumber(0));
			doh.assertTrue(typeTest.isNumber(2.786));
			doh.assertTrue(typeTest.isNumber(-17));
			doh.assertTrue(typeTest.isNumber(new Number()));
			doh.assertTrue(typeTest.isNumber(1.7976931348623157E+10));
			doh.assertFalse(typeTest.isNumber("1"));
			doh.assertFalse(typeTest.isNumber(NaN));
			doh.assertFalse(typeTest.isNumber([""]));
			doh.assertFalse(typeTest.isNumber({}));
			doh.assertFalse(typeTest.isNumber(undefined));
			doh.assertFalse(typeTest.isNumber(null));
			doh.assertFalse(typeTest.isNumber("number"));
			doh.assertFalse(typeTest.isNumber("Number"));
		}
	}, {
		"name": "isObjectTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isObject({}));
			doh.assertTrue(typeTest.isObject(new Object()));
			doh.assertFalse(typeTest.isObject([]));
			doh.assertFalse(typeTest.isObject(7));
			doh.assertFalse(typeTest.isObject(""));
			doh.assertFalse(typeTest.isObject(undefined));
			doh.assertFalse(typeTest.isObject(null));
			doh.assertFalse(typeTest.isObject(NaN));
			doh.assertFalse(typeTest.isObject(new String()));
			doh.assertFalse(typeTest.isObject(function(){}));
			doh.assertFalse(typeTest.isObject("object"));
			doh.assertFalse(typeTest.isObject("Object"));
		}
	}, {
		"name": "isPropertyTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testObj":{
			"test1": "hello1",
			"test2": "helllo2",
			"test3": {
				"test4": "hello3",
				"test5": "hello4",
				"test6": {
					"test7": "hello7",
					"test8": "helllo8",
				}
			},
			"test9": function(){},
			"test10": ["hello10", "hello11", "hello12"]
		},
		"runTest": function(){
			this.testBasic();
			this.testArray();
			this.testObject();
		},
		"testBasic": function(){
			doh.assertTrue(typeTest.isProperty(this.testObj, "test1"));
			doh.assertFalse(typeTest.isProperty(this.testObj, "test4"));
			doh.assertTrue(typeTest.isProperty(this.testObj, "test9"));
			doh.assertTrue(typeTest.isProperty(window, "document"));
		},
		"testArray": function(){
			doh.assertTrue(typeTest.isProperty(
				this.testObj, ["test1", "test2", "test3", "test9"]
			));
			doh.assertFalse(typeTest.isProperty(
				this.testObj, ["test1", "test2", "test3", "test4"]
			));
		},
		"testObject": function(){
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {"test1":"", "test2":""}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {"test1":"", "test2":"", "test3":""}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3":["test4", "test5", "test6"]
				}
			));
			doh.assertFalse(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3":["test4", "test5", "test6", "test7"]
				}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3":{"test4":"", "test5":"", "test6":""}
				}
			));
			doh.assertFalse(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3":{"test4":"", "test5":"", "test6":"", "test7":""}
				}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3": {"test4":"", "test5":"", "test6":{
						"test7":""
					}}
				}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {
					"test1":"", "test2":"",
					"test3": {"test4":"", "test5":"", "test6":[
						"test7", "test8"
					]}
				}
			));
			doh.assertTrue(typeTest.isProperty(
				this.testObj, {
					"test1":"string", "test2":"string",
					"test9":"function", "test10":"array"
				}
			));
			doh.assertFalse(typeTest.isProperty(
				this.testObj, {
					"test1":"string", "test2":"string",
					"test9":"string", "test10":"array"
				}
			));
		}
	}, {
		"name": "isTypeTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isType([], "array"));
			doh.assertTrue(typeTest.isType(new Array, "array"));
			doh.assertTrue(typeTest.isType(new Array, "object"));
			doh.assertFalse(typeTest.isType(new Array, ""));
			doh.assertTrue(typeTest.isType(function(){}, "function"));
			doh.assertTrue(typeTest.isType(1, "number"));
			doh.assertTrue(typeTest.isType("", "string"));
			doh.assertTrue(typeTest.isType(null, "null"));
			doh.assertTrue(typeTest.isType(undefined, "undefined"));
			doh.assertTrue(typeTest.isType(NaN, "nan"));
		}
	}, {
		"name": "isFunctionTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isFunction(function(){}));
			doh.assertTrue(typeTest.isFunction(this.setUp));
			doh.assertFalse(typeTest.isFunction(this));
			doh.assertFalse(typeTest.isFunction(""));
			doh.assertFalse(typeTest.isFunction("function"));
			doh.assertFalse(typeTest.isFunction("Function"));
		}
	}, {
		"name": "isTrueTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testWidget": new TextBox(),
		"runTest": function(){
			doh.assertTrue(typeTest.isTrue(true));
			doh.assertFalse(typeTest.isTrue(false));
			doh.assertTrue(typeTest.isTrue("on"));
			doh.assertTrue(typeTest.isTrue("YES"));
			doh.assertTrue(typeTest.isTrue("true"));
			doh.assertTrue(typeTest.isTrue("checked"));
			doh.assertTrue(typeTest.isTrue("ticked"));
			doh.assertTrue(typeTest.isTrue(1));
			doh.assertTrue(typeTest.isTrue(1.0));
			doh.assertFalse(typeTest.isTrue(1.1));
			doh.assertTrue(typeTest.isTrue("1"));
			doh.assertTrue(typeTest.isTrue("1.0"));
			doh.assertFalse(typeTest.isTrue("unticked"));
			doh.assertFalse(typeTest.isTrue(this.testWidget));
			this.testWidget.set("value","on");
			doh.assertTrue(typeTest.isTrue(this.testWidget));
		}
	}, {
		"name": "isFalseTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testWidget": new TextBox(),
		"runTest": function(){
			doh.assertTrue(typeTest.isFalse(false));
			doh.assertFalse(typeTest.isFalse(true));
			doh.assertTrue(typeTest.isFalse("off"));
			doh.assertTrue(typeTest.isFalse("no"));
			doh.assertTrue(typeTest.isFalse("FALSE"));
			doh.assertTrue(typeTest.isFalse("unchecked"));
			doh.assertTrue(typeTest.isFalse("unticked"));
			doh.assertTrue(typeTest.isFalse(0));
			doh.assertFalse(typeTest.isFalse(0.01));
			doh.assertTrue(typeTest.isFalse("0"));
			doh.assertFalse(typeTest.isFalse("ticked"));
			doh.assertFalse(typeTest.isFalse("NaN"));
			doh.assertFalse(typeTest.isFalse("null"));
			doh.assertFalse(typeTest.isFalse("undefined"));
			doh.assertTrue(typeTest.isFalse(""));
			doh.assertTrue(typeTest.isFalse(null));
			doh.assertTrue(typeTest.isFalse(undefined));
			doh.assertTrue(typeTest.isFalse(NaN));
			doh.assertTrue(typeTest.isFalse([]));
			doh.assertTrue(typeTest.isFalse({}));
			doh.assertFalse(typeTest.isFalse([""]));
			doh.assertFalse(typeTest.isFalse({"":""}));
			doh.assertFalse(typeTest.isFalse(this.testWidget));
			this.testWidget.set("value","off");
			doh.assertTrue(typeTest.isFalse(this.testWidget));
		}
	}, {
		"name": "isBlankTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testElement": domConstr.create("div"),
		"testWidget": new TextBox(),
		"runTest": function(){
			doh.assertTrue(typeTest.isBlank(false));
			doh.assertTrue(typeTest.isBlank(NaN));
			doh.assertTrue(typeTest.isBlank(undefined));
			doh.assertTrue(typeTest.isBlank(null));
			doh.assertTrue(typeTest.isBlank(""));
			doh.assertTrue(typeTest.isBlank("     "));
			doh.assertTrue(typeTest.isBlank({}));
			doh.assertTrue(typeTest.isBlank([]));
			doh.assertFalse(typeTest.isBlank("test"));
			doh.assertFalse(typeTest.isBlank("null"));
			doh.assertFalse(typeTest.isBlank("undefined"));
			doh.assertFalse(typeTest.isBlank("NaN"));
			doh.assertFalse(typeTest.isBlank({"test":""}));
			doh.assertTrue(typeTest.isBlank({"":undefined}));
			doh.assertFalse(typeTest.isBlank({"":"hello"}));
			doh.assertTrue(typeTest.isBlank([""]));
			doh.assertTrue(typeTest.isBlank(["", undefined, null]));
			doh.assertFalse(typeTest.isBlank(["", undefined, null, "test"]));
			doh.assertTrue(typeTest.isBlank(this.testElement));
			domAttr.set(this.testElement, "innerHTML", "HELLO");
			doh.assertFalse(typeTest.isBlank(this.testElement));
			doh.assertTrue(typeTest.isBlank(this.testWidget));
			this.testWidget.set("value","HELLO");
			doh.assertFalse(typeTest.isBlank(this.testWidget));
		}
	}, {
		"name": "isEmptyTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(typeTest.isEmpty([]));
			doh.assertTrue(typeTest.isEmpty({}));
			doh.assertFalse(typeTest.isEmpty([""]));
			doh.assertFalse(typeTest.isEmpty([undefined]));
			doh.assertFalse(typeTest.isEmpty({"":undefined}));
			doh.assertFalse(typeTest.isEmpty(""));
		}
	}, {
		"name": "isElementTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testElement": domConstr.create("div"),
		"testWidget": new TextBox(),
		"runTest": function(){
			doh.assertTrue(typeTest.isElement(this.testElement));
			doh.assertFalse(typeTest.isElement(this.testWidget));
			doh.assertFalse(typeTest.isElement(document));
			doh.assertTrue(typeTest.isElement(document.body));
			doh.assertFalse(typeTest.isElement(""));
			doh.assertFalse(typeTest.isElement({}));
		}
	}, {
		"name": "isWidgetTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"testElement": domConstr.create("div"),
		"testWidget": new TextBox(),
		"runTest": function(){
			doh.assertFalse(typeTest.isWidget(this.testElement));
			doh.assertTrue(typeTest.isWidget(this.testWidget));
			doh.assertFalse(typeTest.isElement(document));
			doh.assertFalse(typeTest.isElement(""));
			doh.assertFalse(typeTest.isElement({}));
		}
	}, {
		"name": "isEqualTest",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			this.testBasic();
			this.testAdvanced();
		},
		"testBasic": function(){
			doh.assertTrue(typeTest.isEqual("test","test"));
			doh.assertTrue(typeTest.isEqual("Test","tEST"));
			doh.assertTrue(typeTest.isEqual("  test","Test  "));
			doh.assertFalse(typeTest.isEqual("  test2","Test1  "));
			doh.assertTrue(typeTest.isEqual("  1",1));
			doh.assertTrue(typeTest.isEqual("  1.0",1));
			doh.assertTrue(typeTest.isEqual("  1.1",1.1));
			doh.assertFalse(typeTest.isEqual("  1.1",1));
			doh.assertTrue(typeTest.isEqual(undefined, undefined));
			doh.assertFalse(typeTest.isEqual(undefined, "undefined"));
			doh.assertFalse(typeTest.isEqual(undefined, null)); // FAIL IE
			doh.assertTrue(typeTest.isEqual(null, null));
			doh.assertFalse(typeTest.isEqual(null, "null"));
			doh.assertTrue(typeTest.isEqual(NaN, NaN));
			doh.assertFalse(typeTest.isEqual(NaN, "NaN"));
			doh.assertFalse(typeTest.isEqual(NaN, null));
			doh.assertTrue(typeTest.isEqual(
				function(){var test = "hello"},
				function(){var test = "hello"}
			));
			doh.assertFalse(typeTest.isEqual(
				function(){var test = "hello"},
				function(){var test = "hello2"}
			));
			doh.assertTrue(typeTest.isEqual(
				function(){var test = "hello"},
				function(){var test =    "hello"}
			));
		},
		"testAdvanced": function(){
			// todo: object comparison tests.
		}
	}]);
});