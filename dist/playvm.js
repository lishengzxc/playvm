var PlayVM =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var walk = __webpack_require__(1);
	var compile = __webpack_require__(2);

	module.exports = {
	  walk: walk,
	  compile: compile
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	function walk(node, callback) {
	  if (node.nodeType === 1 || node.nodeType === 3) {
	    var returnValue = callback(node);
	    if (returnValue === false) return;
	  }

	  if (node.nodeType === 1) {
	    var current = node.firstChild;
	    while (current) {
	      walk(current, callback);
	      current = current.nextSibling;
	    }
	  }
	}

	module.exports = walk;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var walk = __webpack_require__(1);

	function compile(element, context) {
	  walk(element, function (element) {
	    var collections = [];

	    if (element.nodeType === 1) {
	      var attrs = element.attributes;
	      console.log(attrs);
	    } else if (element.nodeType === 3) {
	      var text = element.nodeValue;
	      console.log(text);
	    }
	  });
	}

	module.exports = compile;

/***/ }
/******/ ]);