var PlayVM =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var walk = __webpack_require__(/*! ./walk */ 1);
	var compile = __webpack_require__(/*! ./compile */ 2);
	
	module.exports = {
	  walk: walk,
	  compile: compile
	};

/***/ },
/* 1 */
/*!*********************!*\
  !*** ./src/walk.js ***!
  \*********************/
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
/*!************************!*\
  !*** ./src/compile.js ***!
  \************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var walk = __webpack_require__(/*! ./walk */ 1);
	var expression = __webpack_require__(/*! ./expression */ 3);
	var inlineText = __webpack_require__(/*! ./parse/inline-text */ 4);
	var directive = __webpack_require__(/*! ./directive */ 6);
	var createDirective = directive.create;
	var isPairDirective = directive.isPair;
	var hasDirective = directive.has;
	var bind = __webpack_require__(/*! ./bind */ 11);
	var ViewModel = __webpack_require__(/*! ./view-model */ 12);
	var maybeIncludeExpression = expression.maybeIncludeExpression;
	
	function compile(element, context) {
	  context = new ViewModel(context);
	
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
	
	        if (hasDirective(attrKey)) {
	          collections.push({
	            type: attrKey,
	            attr: attrKey,
	            value: attrValue
	          });
	        }
	
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
	      bind(element, collections, context);
	    }
	  });
	}
	
	module.exports = compile;

/***/ },
/* 3 */
/*!***************************!*\
  !*** ./src/expression.js ***!
  \***************************/
/***/ function(module, exports) {

	"use strict";
	
	exports.maybeIncludeExpression = function (text) {
	  return (/\{\{\s*(.+?)\s*\}\}/ig.test(text)
	  );
	};

/***/ },
/* 4 */
/*!**********************************!*\
  !*** ./src/parse/inline-text.js ***!
  \**********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var parseText = __webpack_require__(/*! ./parse-text */ 5);
	
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
/*!*********************************!*\
  !*** ./src/parse/parse-text.js ***!
  \*********************************/
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
/* 6 */
/*!********************************!*\
  !*** ./src/directive/index.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var DirectiveMap = {};
	
	var register = function register(name, directive) {
	  DirectiveMap[name] = directive;
	};
	
	var create = function create(name, options) {
	  var createFunction = DirectiveMap[name];
	  return new createFunction(options);
	};
	
	var has = function has(name) {
	  return name in DirectiveMap;
	};
	
	var isPair = function isPair(name) {
	  var fn = DirectiveMap[name];
	  if (!fn) return false;
	  return !!fn.prototype.isPair;
	};
	
	var ModelDirective = __webpack_require__(/*! ./model */ 7);
	
	register('d-model', ModelDirective);
	
	module.exports = {
	  register: register,
	  create: create,
	  has: has,
	  isPair: isPair
	};

/***/ },
/* 7 */
/*!********************************!*\
  !*** ./src/directive/model.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var Directive = __webpack_require__(/*! ./directive */ 8);
	
	var setter = function setter(obj, path, newValue) {
	  if (!obj || !path) return;
	  var paths = path.split('.'),
	      target = obj;
	  for (var i = 0, len = paths.length; i < len; i++) {
	    var subPath = paths[i],
	        value = target[subPath];
	    if (i == len - 1) {
	      target[subPath] = newValue;
	    } else {
	      if (value) target = value;else return;
	    }
	  }
	};
	
	var ModelDirective = (function (_Directive) {
	  _inherits(ModelDirective, _Directive);
	
	  function ModelDirective(options) {
	    _classCallCheck(this, ModelDirective);
	
	    return _possibleConstructorReturn(this, Object.getPrototypeOf(ModelDirective).call(this, options));
	  }
	
	  _createClass(ModelDirective, [{
	    key: 'bind',
	    value: function bind() {
	      Directive.prototype.bind.call(this, arguments);
	      var element = this.element;
	
	      var listener = function listener() {
	        // todo: 其他表单的支持
	        if (element.type = 'checkbox') {
	          setter(this.context, this.expression, element.checked);
	        } else {
	          setter(this.context, this.expression, element.value);
	        }
	
	        element.addEventListener('keyup', listener, false);
	        element.addEventListener('change', listener, false);
	      };
	    }
	  }, {
	    key: 'update',
	    value: function update() {
	      var value = this.valueFn();
	      var element = this.element;
	
	      // todo: 其他表单的支持
	      if (element) {
	        if (element.type === 'checkbox') {
	          value = !!value;
	          if (element.checked !== value) {
	            element.checked = value;
	          }
	        } else {
	          if (element.value !== value) {
	            element.value = value;
	          }
	        }
	      }
	    }
	  }]);
	
	  return ModelDirective;
	})(Directive);
	
	module.exports = ModelDirective;

/***/ },
/* 8 */
/*!************************************!*\
  !*** ./src/directive/directive.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var expr = __webpack_require__(/*! ../parse/expr */ 9);
	var compileExpr = expr.compile;
	var getDepends = expr.getDepends;
	
	var Directive = (function () {
	  function Directive(options) {
	    _classCallCheck(this, Directive);
	
	    this.element = options.element;
	    this.expression = options.extensions;
	    this.context = options.context;
	
	    this.bind();
	  }
	
	  _createClass(Directive, [{
	    key: 'bind',
	    value: function bind() {
	      var _this = this;
	
	      if (this.element && this.expression && this.context) {
	        this.valueFn = compileExpr(this.expression, this.context);
	        var depends = getDepends(this.expression);
	        var context = this.context;
	
	        depends.forEach(function (depend) {
	          context.$watch(depend, _this);
	        });
	
	        this.update();
	      }
	    }
	  }, {
	    key: 'unbind',
	    value: function unbind() {
	      var _this2 = this;
	
	      var depends = getDepends(this.expression);
	      var context = this.context;
	
	      depends.forEach(function (depend) {
	        context.$unwatch(depend, _this2);
	      });
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy() {
	      this.unbind();
	
	      this.element = null;
	      this.expression = null;
	      this.context = null;
	      this.valueFn = null;
	    }
	  }, {
	    key: 'update',
	    value: function update() {}
	  }]);
	
	  return Directive;
	})();
	
	module.exports = Directive;

/***/ },
/* 9 */
/*!***************************!*\
  !*** ./src/parse/expr.js ***!
  \***************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var jsep = __webpack_require__(/*! jsep */ 10);
	
	var PARSED_CACHE = {};
	var DEPENDS_CACHE = {};
	
	var FUNCTIONS_CACHE = {};
	
	function parse(string) {
	  var depends;
	
	  function parseMemberExpression(ast) {
	    var path = '';
	    var currentObject = ast.object;
	    var stack = [ast.property.name];
	
	    while (currentObject) {
	      if (currentObject.type === 'Identifier') {
	        stack.unshift(currentObject.name);
	        path = stack.join('.');
	
	        break;
	      } else if (currentObject.type === 'MemberExpression') {
	        stack.unshift(currentObject.property.name);
	        currentObject = currentObject.object;
	      }
	    }
	
	    if (depends && depends.indexOf(path) === -1) {
	      depends.push(path);
	    }
	
	    return path;
	  }
	
	  function astToCode(ast) {
	    if (ast.type === 'Literal') {
	      return typeof ast.value === 'string' ? '"' + ast.value + '"' : '' + ast.value;
	    } else if (ast.type === 'ThisExpression') {
	      return 'this';
	    } else if (ast.type === 'UnaryExpression') {
	      return ast.operator + astToCode(ast.argument);
	    } else if (ast.type === 'BinaryExpression' || ast.type === 'LogicalExpression') {
	      return astToCode(ast.left) + ' ' + ast.operator + ' ' + astToCode(ast.right);
	    } else if (ast.type === 'ConditionalExpression') {
	      return '(' + astToCode(ast.test) + ' ? (' + astToCode(ast.consequent) + ') : (' + astToCode(ast.alternate) + '))';
	    } else if (ast.type === 'Identifier') {
	      if (depends && depends.indexOf(ast.name) === -1) {
	        depends.push(ast.name);
	      }
	
	      return 'this.' + ast.name;
	    } else if (ast.type === 'CallExpression') {
	      var args = ast.arguments;
	      var parsedValues = [];
	      if (args) {
	        args.forEach(function (arg) {
	          parsedValues.push(astToCode(arg));
	        });
	      }
	
	      var callee = ast.callee;
	
	      if (callee.type === 'Identifier') {
	        return astToCode(callee) + '(' + parsedValues.join(', ') + ')';
	      }
	
	      return astToCode(callee.object) + '.' + callee.property.name + '(' + parsedValues.join(', ') + ')';
	    } else if (ast.type === 'MemberExpression') {
	      return 'this.' + parseMemberExpression(ast);
	    } else if (ast.type === 'ArrayExpression') {
	      var elements = ast.elements,
	          mappedValues = [];
	
	      elements.forEach(function (item) {
	        mappedValues.push(astToCode(item));
	      });
	
	      return '[' + mappedValues.join(', ') + ']';
	    }
	  }
	
	  var result = PARSED_CACHE[string];
	
	  if (!result) {
	    var parsedTree = jsep(string);
	    depends = [];
	    result = astToCode(parsedTree);
	
	    PARSED_CACHE[string] = result;
	    DEPENDS_CACHE[string] = depends;
	  }
	
	  return result;
	}
	
	function getDepends(string) {
	  var depends = DEPENDS_CACHE[string];
	
	  if (!depends) {
	    parse(string);
	    depends = DEPENDS_CACHE[string];
	  }
	
	  return depends;
	}
	
	function compile(string, context) {
	  console.log(string);
	  var converted = parse(string);
	  var body = 'return ' + converted + ';';
	
	  var fn = FUNCTIONS_CACHE[string];
	  if (!fn) {
	    fn = new Function(body);
	  }
	  if (context) {
	    return fn.bind(context);
	  }
	  return fn;
	}
	
	module.exports = {
	  parse: parse,
	  getDepends: getDepends,
	  compile: compile
	};

/***/ },
/* 10 */
/*!******************************!*\
  !*** ./~/jsep/build/jsep.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	//     JavaScript Expression Parser (JSEP) 0.3.0
	//     JSEP may be freely distributed under the MIT License
	//     http://jsep.from.so/
	
	/*global module: true, exports: true, console: true */
	(function (root) {
		'use strict';
		// Node Types
		// ----------
		
		// This is the full set of types that any JSEP node can be.
		// Store them here to save space when minified
		var COMPOUND = 'Compound',
			IDENTIFIER = 'Identifier',
			MEMBER_EXP = 'MemberExpression',
			LITERAL = 'Literal',
			THIS_EXP = 'ThisExpression',
			CALL_EXP = 'CallExpression',
			UNARY_EXP = 'UnaryExpression',
			BINARY_EXP = 'BinaryExpression',
			LOGICAL_EXP = 'LogicalExpression',
			CONDITIONAL_EXP = 'ConditionalExpression',
			ARRAY_EXP = 'ArrayExpression',
	
			PERIOD_CODE = 46, // '.'
			COMMA_CODE  = 44, // ','
			SQUOTE_CODE = 39, // single quote
			DQUOTE_CODE = 34, // double quotes
			OPAREN_CODE = 40, // (
			CPAREN_CODE = 41, // )
			OBRACK_CODE = 91, // [
			CBRACK_CODE = 93, // ]
			QUMARK_CODE = 63, // ?
			SEMCOL_CODE = 59, // ;
			COLON_CODE  = 58, // :
	
			throwError = function(message, index) {
				var error = new Error(message + ' at character ' + index);
				error.index = index;
				error.description = message;
				throw error;
			},
	
		// Operations
		// ----------
		
		// Set `t` to `true` to save space (when minified, not gzipped)
			t = true,
		// Use a quickly-accessible map to store all of the unary operators
		// Values are set to `true` (it really doesn't matter)
			unary_ops = {'-': t, '!': t, '~': t, '+': t},
		// Also use a map for the binary operations but set their values to their
		// binary precedence for quick reference:
		// see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
			binary_ops = {
				'||': 1, '&&': 2, '|': 3,  '^': 4,  '&': 5,
				'==': 6, '!=': 6, '===': 6, '!==': 6,
				'<': 7,  '>': 7,  '<=': 7,  '>=': 7, 
				'<<':8,  '>>': 8, '>>>': 8,
				'+': 9, '-': 9,
				'*': 10, '/': 10, '%': 10
			},
		// Get return the longest key length of any object
			getMaxKeyLen = function(obj) {
				var max_len = 0, len;
				for(var key in obj) {
					if((len = key.length) > max_len && obj.hasOwnProperty(key)) {
						max_len = len;
					}
				}
				return max_len;
			},
			max_unop_len = getMaxKeyLen(unary_ops),
			max_binop_len = getMaxKeyLen(binary_ops),
		// Literals
		// ----------
		// Store the values to return for the various literals we may encounter
			literals = {
				'true': true,
				'false': false,
				'null': null
			},
		// Except for `this`, which is special. This could be changed to something like `'self'` as well
			this_str = 'this',
		// Returns the precedence of a binary operator or `0` if it isn't a binary operator
			binaryPrecedence = function(op_val) {
				return binary_ops[op_val] || 0;
			},
		// Utility function (gets called from multiple places)
		// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
			createBinaryExpression = function (operator, left, right) {
				var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
				return {
					type: type,
					operator: operator,
					left: left,
					right: right
				};
			},
			// `ch` is a character code in the next three functions
			isDecimalDigit = function(ch) {
				return (ch >= 48 && ch <= 57); // 0...9
			},
			isIdentifierStart = function(ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
						(ch >= 65 && ch <= 90) || // A...Z
						(ch >= 97 && ch <= 122); // a...z
			},
			isIdentifierPart = function(ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
						(ch >= 65 && ch <= 90) || // A...Z
						(ch >= 97 && ch <= 122) || // a...z
						(ch >= 48 && ch <= 57); // 0...9
			},
	
			// Parsing
			// -------
			// `expr` is a string with the passed in expression
			jsep = function(expr) {
				// `index` stores the character number we are currently at while `length` is a constant
				// All of the gobbles below will modify `index` as we move along
				var index = 0,
					charAtFunc = expr.charAt,
					charCodeAtFunc = expr.charCodeAt,
					exprI = function(i) { return charAtFunc.call(expr, i); },
					exprICode = function(i) { return charCodeAtFunc.call(expr, i); },
					length = expr.length,
	
					// Push `index` up to the next non-space character
					gobbleSpaces = function() {
						var ch = exprICode(index);
						// space or tab
						while(ch === 32 || ch === 9) {
							ch = exprICode(++index);
						}
					},
					
					// The main parsing function. Much of this code is dedicated to ternary expressions
					gobbleExpression = function() {
						var test = gobbleBinaryExpression(),
							consequent, alternate;
						gobbleSpaces();
						if(exprICode(index) === QUMARK_CODE) {
							// Ternary expression: test ? consequent : alternate
							index++;
							consequent = gobbleExpression();
							if(!consequent) {
								throwError('Expected expression', index);
							}
							gobbleSpaces();
							if(exprICode(index) === COLON_CODE) {
								index++;
								alternate = gobbleExpression();
								if(!alternate) {
									throwError('Expected expression', index);
								}
								return {
									type: CONDITIONAL_EXP,
									test: test,
									consequent: consequent,
									alternate: alternate
								};
							} else {
								throwError('Expected :', index);
							}
						} else {
							return test;
						}
					},
	
					// Search for the operation portion of the string (e.g. `+`, `===`)
					// Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
					// and move down from 3 to 2 to 1 character until a matching binary operation is found
					// then, return that binary operation
					gobbleBinaryOp = function() {
						gobbleSpaces();
						var biop, to_check = expr.substr(index, max_binop_len), tc_len = to_check.length;
						while(tc_len > 0) {
							if(binary_ops.hasOwnProperty(to_check)) {
								index += tc_len;
								return to_check;
							}
							to_check = to_check.substr(0, --tc_len);
						}
						return false;
					},
	
					// This function is responsible for gobbling an individual expression,
					// e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
					gobbleBinaryExpression = function() {
						var ch_i, node, biop, prec, stack, biop_info, left, right, i;
	
						// First, try to get the leftmost thing
						// Then, check to see if there's a binary operator operating on that leftmost thing
						left = gobbleToken();
						biop = gobbleBinaryOp();
	
						// If there wasn't a binary operator, just return the leftmost node
						if(!biop) {
							return left;
						}
	
						// Otherwise, we need to start a stack to properly place the binary operations in their
						// precedence structure
						biop_info = { value: biop, prec: binaryPrecedence(biop)};
	
						right = gobbleToken();
						if(!right) {
							throwError("Expected expression after " + biop, index);
						}
						stack = [left, biop_info, right];
	
						// Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
						while((biop = gobbleBinaryOp())) {
							prec = binaryPrecedence(biop);
	
							if(prec === 0) {
								break;
							}
							biop_info = { value: biop, prec: prec };
	
							// Reduce: make a binary expression from the three topmost entries.
							while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
								right = stack.pop();
								biop = stack.pop().value;
								left = stack.pop();
								node = createBinaryExpression(biop, left, right);
								stack.push(node);
							}
	
							node = gobbleToken();
							if(!node) {
								throwError("Expected expression after " + biop, index);
							}
							stack.push(biop_info, node);
						}
	
						i = stack.length - 1;
						node = stack[i];
						while(i > 1) {
							node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node); 
							i -= 2;
						}
						return node;
					},
	
					// An individual part of a binary expression:
					// e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
					gobbleToken = function() {
						var ch, to_check, tc_len;
						
						gobbleSpaces();
						ch = exprICode(index);
	
						if(isDecimalDigit(ch) || ch === PERIOD_CODE) {
							// Char code 46 is a dot `.` which can start off a numeric literal
							return gobbleNumericLiteral();
						} else if(ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
							// Single or double quotes
							return gobbleStringLiteral();
						} else if(isIdentifierStart(ch) || ch === OPAREN_CODE) { // open parenthesis
							// `foo`, `bar.baz`
							return gobbleVariable();
						} else if (ch === OBRACK_CODE) {
							return gobbleArray();
						} else {
							to_check = expr.substr(index, max_unop_len);
							tc_len = to_check.length;
							while(tc_len > 0) {
								if(unary_ops.hasOwnProperty(to_check)) {
									index += tc_len;
									return {
										type: UNARY_EXP,
										operator: to_check,
										argument: gobbleToken(),
										prefix: true
									};
								}
								to_check = to_check.substr(0, --tc_len);
							}
							
							return false;
						}
					},
					// Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
					// keep track of everything in the numeric literal and then calling `parseFloat` on that string
					gobbleNumericLiteral = function() {
						var number = '', ch, chCode;
						while(isDecimalDigit(exprICode(index))) {
							number += exprI(index++);
						}
	
						if(exprICode(index) === PERIOD_CODE) { // can start with a decimal marker
							number += exprI(index++);
	
							while(isDecimalDigit(exprICode(index))) {
								number += exprI(index++);
							}
						}
						
						ch = exprI(index);
						if(ch === 'e' || ch === 'E') { // exponent marker
							number += exprI(index++);
							ch = exprI(index);
							if(ch === '+' || ch === '-') { // exponent sign
								number += exprI(index++);
							}
							while(isDecimalDigit(exprICode(index))) { //exponent itself
								number += exprI(index++);
							}
							if(!isDecimalDigit(exprICode(index-1)) ) {
								throwError('Expected exponent (' + number + exprI(index) + ')', index);
							}
						}
						
	
						chCode = exprICode(index);
						// Check to make sure this isn't a variable name that start with a number (123abc)
						if(isIdentifierStart(chCode)) {
							throwError('Variable names cannot start with a number (' +
										number + exprI(index) + ')', index);
						} else if(chCode === PERIOD_CODE) {
							throwError('Unexpected period', index);
						}
	
						return {
							type: LITERAL,
							value: parseFloat(number),
							raw: number
						};
					},
	
					// Parses a string literal, staring with single or double quotes with basic support for escape codes
					// e.g. `"hello world"`, `'this is\nJSEP'`
					gobbleStringLiteral = function() {
						var str = '', quote = exprI(index++), closed = false, ch;
	
						while(index < length) {
							ch = exprI(index++);
							if(ch === quote) {
								closed = true;
								break;
							} else if(ch === '\\') {
								// Check for all of the common escape codes
								ch = exprI(index++);
								switch(ch) {
									case 'n': str += '\n'; break;
									case 'r': str += '\r'; break;
									case 't': str += '\t'; break;
									case 'b': str += '\b'; break;
									case 'f': str += '\f'; break;
									case 'v': str += '\x0B'; break;
								}
							} else {
								str += ch;
							}
						}
	
						if(!closed) {
							throwError('Unclosed quote after "'+str+'"', index);
						}
	
						return {
							type: LITERAL,
							value: str,
							raw: quote + str + quote
						};
					},
					
					// Gobbles only identifiers
					// e.g.: `foo`, `_value`, `$x1`
					// Also, this function checks if that identifier is a literal:
					// (e.g. `true`, `false`, `null`) or `this`
					gobbleIdentifier = function() {
						var ch = exprICode(index), start = index, identifier;
	
						if(isIdentifierStart(ch)) {
							index++;
						} else {
							throwError('Unexpected ' + exprI(index), index);
						}
	
						while(index < length) {
							ch = exprICode(index);
							if(isIdentifierPart(ch)) {
								index++;
							} else {
								break;
							}
						}
						identifier = expr.slice(start, index);
	
						if(literals.hasOwnProperty(identifier)) {
							return {
								type: LITERAL,
								value: literals[identifier],
								raw: identifier
							};
						} else if(identifier === this_str) {
							return { type: THIS_EXP };
						} else {
							return {
								type: IDENTIFIER,
								name: identifier
							};
						}
					},
	
					// Gobbles a list of arguments within the context of a function call
					// or array literal. This function also assumes that the opening character
					// `(` or `[` has already been gobbled, and gobbles expressions and commas
					// until the terminator character `)` or `]` is encountered.
					// e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
					gobbleArguments = function(termination) {
						var ch_i, args = [], node;
						while(index < length) {
							gobbleSpaces();
							ch_i = exprICode(index);
							if(ch_i === termination) { // done parsing
								index++;
								break;
							} else if (ch_i === COMMA_CODE) { // between expressions
								index++;
							} else {
								node = gobbleExpression();
								if(!node || node.type === COMPOUND) {
									throwError('Expected comma', index);
								}
								args.push(node);
							}
						}
						return args;
					},
	
					// Gobble a non-literal variable name. This variable name may include properties
					// e.g. `foo`, `bar.baz`, `foo['bar'].baz`
					// It also gobbles function calls:
					// e.g. `Math.acos(obj.angle)`
					gobbleVariable = function() {
						var ch_i, node;
						ch_i = exprICode(index);
							
						if(ch_i === OPAREN_CODE) {
							node = gobbleGroup();
						} else {
							node = gobbleIdentifier();
						}
						gobbleSpaces();
						ch_i = exprICode(index);
						while(ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
							index++;
							if(ch_i === PERIOD_CODE) {
								gobbleSpaces();
								node = {
									type: MEMBER_EXP,
									computed: false,
									object: node,
									property: gobbleIdentifier()
								};
							} else if(ch_i === OBRACK_CODE) {
								node = {
									type: MEMBER_EXP,
									computed: true,
									object: node,
									property: gobbleExpression()
								};
								gobbleSpaces();
								ch_i = exprICode(index);
								if(ch_i !== CBRACK_CODE) {
									throwError('Unclosed [', index);
								}
								index++;
							} else if(ch_i === OPAREN_CODE) {
								// A function call is being made; gobble all the arguments
								node = {
									type: CALL_EXP,
									'arguments': gobbleArguments(CPAREN_CODE),
									callee: node
								};
							}
							gobbleSpaces();
							ch_i = exprICode(index);
						}
						return node;
					},
	
					// Responsible for parsing a group of things within parentheses `()`
					// This function assumes that it needs to gobble the opening parenthesis
					// and then tries to gobble everything within that parenthesis, assuming
					// that the next thing it should see is the close parenthesis. If not,
					// then the expression probably doesn't have a `)`
					gobbleGroup = function() {
						index++;
						var node = gobbleExpression();
						gobbleSpaces();
						if(exprICode(index) === CPAREN_CODE) {
							index++;
							return node;
						} else {
							throwError('Unclosed (', index);
						}
					},
	
					// Responsible for parsing Array literals `[1, 2, 3]`
					// This function assumes that it needs to gobble the opening bracket
					// and then tries to gobble the expressions as arguments.
					gobbleArray = function() {
						index++;
						return {
							type: ARRAY_EXP,
							elements: gobbleArguments(CBRACK_CODE)
						};
					},
	
					nodes = [], ch_i, node;
					
				while(index < length) {
					ch_i = exprICode(index);
	
					// Expressions can be separated by semicolons, commas, or just inferred without any
					// separators
					if(ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
						index++; // ignore separators
					} else {
						// Try to gobble each expression individually
						if((node = gobbleExpression())) {
							nodes.push(node);
						// If we weren't able to find a binary expression and are out of room, then
						// the expression passed in probably has too much
						} else if(index < length) {
							throwError('Unexpected "' + exprI(index) + '"', index);
						}
					}
				}
	
				// If there's only one expression just try returning the expression
				if(nodes.length === 1) {
					return nodes[0];
				} else {
					return {
						type: COMPOUND,
						body: nodes
					};
				}
			};
	
		// To be filled in by the template
		jsep.version = '0.3.0';
		jsep.toString = function() { return 'JavaScript Expression Parser (JSEP) v' + jsep.version; };
	
		/**
		 * @method jsep.addUnaryOp
		 * @param {string} op_name The name of the unary op to add
		 * @return jsep
		 */
		jsep.addUnaryOp = function(op_name) {
			unary_ops[op_name] = t; return this;
		};
	
		/**
		 * @method jsep.addBinaryOp
		 * @param {string} op_name The name of the binary op to add
		 * @param {number} precedence The precedence of the binary op (can be a float)
		 * @return jsep
		 */
		jsep.addBinaryOp = function(op_name, precedence) {
			max_binop_len = Math.max(op_name.length, max_binop_len);
			binary_ops[op_name] = precedence;
			return this;
		};
	
		/**
		 * @method jsep.removeUnaryOp
		 * @param {string} op_name The name of the unary op to remove
		 * @return jsep
		 */
		jsep.removeUnaryOp = function(op_name) {
			delete unary_ops[op_name];
			if(op_name.length === max_unop_len) {
				max_unop_len = getMaxKeyLen(unary_ops);
			}
			return this;
		};
	
		/**
		 * @method jsep.removeBinaryOp
		 * @param {string} op_name The name of the binary op to remove
		 * @return jsep
		 */
		jsep.removeBinaryOp = function(op_name) {
			delete binary_ops[op_name];
			if(op_name.length === max_binop_len) {
				max_binop_len = getMaxKeyLen(binary_ops);
			}
			return this;
		};
	
		// In desktop environments, have a way to restore the old value for `jsep`
		if (false) {
			var old_jsep = root.jsep;
			// The star of the show! It's a function!
			root.jsep = jsep;
			// And a courteous function willing to move out of the way for other similarly-named objects!
			jsep.noConflict = function() {
				if(root.jsep === jsep) {
					root.jsep = old_jsep;
				}
				return jsep;
			};
		} else {
			// In Node.JS environments
			if (typeof module !== 'undefined' && module.exports) {
				exports = module.exports = jsep;
			} else {
				exports.parse = jsep;
			}
		}
	}(this));


/***/ },
/* 11 */
/*!*********************!*\
  !*** ./src/bind.js ***!
  \*********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var directive = __webpack_require__(/*! ./directive */ 6);
	var isPairDirective = directive.isPair;
	var createDirective = directive.create;
	
	function bind(element, collections, context) {
	  for (var i = 0, len = collections.length; i < len; i++) {
	    var collection = collections[i];
	    var type = collection.type;
	
	    if (isPairDirective(type)) {
	      console.log(type);
	    } else {
	      createDirective(collection.type, {
	        element: element,
	        expression: collection.value,
	        context: context,
	        attr: collection.attr
	      });
	    }
	  }
	}
	
	module.exports = bind;

/***/ },
/* 12 */
/*!***************************!*\
  !*** ./src/view-model.js ***!
  \***************************/
/***/ function(module, exports) {

	"use strict";
	
	var ViewModel = function ViewModel(object) {
	  var callbackMap = {};
	
	  object.$watch = function (path, callback) {
	    var callbacks = callbackMap[path];
	    if (!callbacks) {
	      callbacks = callbackMap[path] = [];
	    }
	    callbacks.push(callback);
	  };
	
	  object.$unwatch = function (path, callback) {
	    var callbacks = callbackMap[path];
	    if (callbacks) {
	      if (callback) {
	        for (var i = 0, len = callbacks.length; i < len; i++) {
	          if (callback == callbacks[i]) {
	            callbacks.splice(i, 1);
	            break;
	          }
	        }
	      } else {
	        callbackMap[path] = [];
	      }
	    }
	  };
	
	  object.$extend = function () {
	    return ViewModel(Object.create(this));
	  };
	
	  object.$destroy = function () {
	    for (var path in callbackMap) {
	      if (callbackMap.hasOwnProperty(path)) {
	        var callbacks = callbackMap[path] || [];
	
	        for (var i = 0, len = callbacks.length; i < len; i++) {
	          var callback = callbacks[i];
	          callback.destroy();
	        }
	      }
	    }
	
	    callbackMap = {};
	  };
	
	  Object.observe(object, function (changes) {
	    // todo...
	    console.log(changes);
	  });
	
	  return object;
	};
	
	module.exports = ViewModel;

/***/ }
/******/ ]);
//# sourceMappingURL=playvm.js.map