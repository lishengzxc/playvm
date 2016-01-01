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
	var expression = __webpack_require__(3);
	var inlineText = __webpack_require__(4);
	var bind = __webpack_require__(7);
	var maybeIncludeExpression = expression.maybeIncludeExpression;

	function compile(element, context) {
	  //context = new ViewModel(context);

	  walk(element, function (element) {
	    var collections = [];

	    if (element.nodeType === 1) {
	      var attributes = element.attributes;

	      for (var i = 0, len = attributes.length; i < len; i++) {
	        var attrNode = attributes.item(i);

	        var attrKey = attrNode.nodeName;
	        var attrValue = attrNode.nodeValue;

	        if (maybeIncludeExpression(attrValue)) {
	          collections.push({
	            type: 'd-attr',
	            attr: attrKey,
	            value: inlineText(attrValue)
	          });
	        }

	        // todo: 如果有指令

	        // todo: 如果指令是d-repeat
	        if (attrKey === 'd-repeat') {
	          return false;
	        }
	      }
	    } else if (element.nodeType === 3) {
	      var text = element.nodeValue;
	      if (maybeIncludeExpression(text)) {
	        var expression = inlineText(text);
	        collections.push({
	          type: 'd-text',
	          value: expression
	        });
	      }
	    }

	    if (collections.length > 0) {
	      //bind(element, collections, context);
	    }
	  });
	}

	module.exports = compile;

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";

	exports.maybeIncludeExpression = function (text) {
	  return (/\{\{\s*(.+?)\s*\}\}/ig.test(text)
	  );
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var parseText = __webpack_require__(5);

	var inlineText = function inlineText(text) {
	  var parts = parseText(text);
	  if (!parts) return '';
	  var resultArray = [];
	  for (var i = 0, len = parts.length; i < len; i++) {
	    var part = parts[i];
	    if (part.type === 'text') {
	      resultArray.push('"' + part.value + '"');
	    } else if (part.type === 'expression') {
	      resultArray.push(part.value);
	    }
	  }
	  return resultArray.join(' + ').trim();
	};

	module.exports = inlineText;

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	var startTag = '{{',
	    finishTag = '}}';

	var parseText = function parseText(line) {
	  var result = [];
	  var index = 0;
	  var partBeginIndex = 0;

	  var appendText = function appendText(offset) {
	    offset = offset || 0;
	    if (partBeginIndex >= 0) {
	      var text = line.substring(partBeginIndex, index + offset);
	      if (text) result.push({
	        type: 'text',
	        value: text
	      });
	    }
	  };

	  var appendExpr = function appendExpr(offset) {
	    offset = offset || 0;
	    if (partBeginIndex >= 0) {
	      result.push({
	        type: 'expression',
	        value: line.substring(partBeginIndex + 2, index + offset)
	      });
	    }
	  };

	  var level = 0;
	  var curChar = null;
	  var prevChar = null;
	  var prevCurChar = null;
	  var quotationChar = null;
	  var inExpression = false;
	  var charCount = line.length;

	  for (index = 0; index < charCount; index++) {
	    prevChar = curChar;
	    curChar = line[index];
	    prevCurChar = prevChar + curChar;

	    if (prevCurChar === startTag && !inExpression) {
	      if (index !== 0) appendText(-1);
	      partBeginIndex = index - 1;
	      inExpression = true;
	    }

	    if (prevCurChar === finishTag && level === 0 && inExpression) {
	      appendExpr(-1);
	      partBeginIndex = index + 1;
	      inExpression = false;
	    }

	    if (inExpression) {
	      if (curChar === '"' || curChar === '\'') {
	        if (quotationChar && quotationChar === curChar && prevChar !== '\\') {
	          quotationChar = null;
	          continue;
	        }

	        if (!quotationChar) {
	          quotationChar = curChar;
	          continue;
	        }
	      }

	      if (!quotationChar) {
	        if (curChar === '(' || curChar === '{' || curChar === '[') {
	          level++;
	        } else if (curChar === ')' || curChar === '}' || curChar === ']') {
	          level--;
	        }
	      }
	    }
	  }

	  if (partBeginIndex < charCount - 1) {
	    appendText();
	  }

	  return result;
	};

	module.exports = parseText;

/***/ },
/* 6 */,
/* 7 */
/***/ function(module, exports) {

	"use strict";

	function bind(element, collections, context) {
	  for (var i = 0, len = collections.length; i < len; i++) {
	    var collection = collections[i];
	    var type = collection.type;
	    console.log(type);
	  }
	}

	module.exports = bind;

/***/ }
/******/ ]);