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
	      var _this2 = this;
	
	      Directive.prototype.bind.call(this, arguments);
	      var element = this.element;
	
	      var listener = function listener() {
	        // todo: 其他表单的支持
	        if (element.type === 'checkbox') {
	          setter(_this2.context, _this2.expression, element.checked);
	        } else {
	          setter(_this2.context, _this2.expression, element.value);
	        }
	      };
	
	      element.addEventListener('keyup', listener, false);
	      element.addEventListener('change', listener, false);
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
	    this.expression = options.expression;
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
	  var converted = parse('newTodo');
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
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }
	
	var Observed = __webpack_require__(/*! observed */ 13);
	
	var ViewModel = function ViewModel(object) {
	  var callbackMap = {};
	  var observer = Observed(object);
	
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
	
	  observer.on('change', function (change) {
	    var path = change.path;
	    if (path && path.charAt(0) === '$') return;
	
	    var callbacks = callbackMap[path] || [];
	
	    for (var i = 0, len = callbacks.length; i < len; i++) {
	      var callback = callbacks[i];
	      if ((typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) === 'object' && callback.update) {
	        callback.update();
	      } else if (typeof callback === 'function') {
	        callback(change);
	      }
	    }
	  });
	
	  return object;
	};
	
	module.exports = ViewModel;

/***/ },
/* 13 */
/*!************************************!*\
  !*** ./~/observed/lib/observed.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	// http://wiki.ecmascript.org/doku.php?id=harmony:observe
	
	var Change = __webpack_require__(/*! ./change */ 14);
	var Emitter = __webpack_require__(/*! events */ 15).EventEmitter;
	var debug = __webpack_require__(/*! debug */ 16)('observed');
	
	module.exports = exports = Observable;
	
	/**
	 * Observable constructor.
	 *
	 * The passed `subject` will be observed for changes to
	 * all properties, included nested objects and arrays.
	 *
	 * An `EventEmitter` will be returned. This emitter will
	 * emit the following events:
	 *
	 * - add
	 * - update
	 * - delete
	 * - reconfigure
	 *
	 * // - setPrototype?
	 *
	 * @param {Object} subject
	 * @param {Observable} [parent] (internal use)
	 * @param {String} [prefix] (internal use)
	 * @return {EventEmitter}
	 */
	
	function Observable (subject, parent, prefix) {
	  if ('object' != typeof subject)
	    throw new TypeError('object expected. got: ' + typeof subject);
	
	  if (!(this instanceof Observable))
	    return new Observable(subject, parent, prefix);
	
	  debug('new', subject, !!parent, prefix);
	
	  Emitter.call(this);
	  this._bind(subject, parent, prefix);
	};
	
	// add emitter capabilities
	for (var i in Emitter.prototype) {
	  Observable.prototype[i] = Emitter.prototype[i];
	}
	
	Observable.prototype.observers = undefined;
	Observable.prototype.onchange = undefined;
	Observable.prototype.subject = undefined;
	
	/**
	 * Binds this Observable to `subject`.
	 *
	 * @param {Object} subject
	 * @param {Observable} [parent]
	 * @param {String} [prefix]
	 * @api private
	 */
	
	Observable.prototype._bind = function (subject, parent, prefix) {
	  if (this.subject) throw new Error('already bound!');
	  if (null == subject) throw new TypeError('subject cannot be null');
	
	  debug('_bind', subject);
	
	  this.subject = subject;
	
	  if (parent) {
	    parent.observers.push(this);
	  } else {
	    this.observers = [this];
	  }
	
	  this.onchange = onchange(parent || this, prefix);
	  Object.observe(this.subject, this.onchange);
	
	  this._walk(parent || this, prefix);
	}
	
	/**
	 * Pending change events are not emitted until after the next
	 * turn of the event loop. This method forces the engines hand
	 * and triggers all events now.
	 *
	 * @api public
	 */
	
	Observable.prototype.deliverChanges = function () {
	  debug('deliverChanges')
	  this.observers.forEach(function(o) {
	    Object.deliverChangeRecords(o.onchange);
	  });
	}
	
	/**
	 * Walk down through the tree of our `subject`, observing
	 * objects along the way.
	 *
	 * @param {Observable} [parent]
	 * @param {String} [prefix]
	 * @api private
	 */
	
	Observable.prototype._walk = function (parent, prefix) {
	  debug('_walk');
	
	  var object = this.subject;
	
	  // keys?
	  Object.keys(object).forEach(function (name) {
	    var value = object[name];
	
	    if ('object' != typeof value) return;
	    if (null == value) return;
	
	    var path = prefix
	      ? prefix + '.' + name
	      : name;
	
	    new Observable(value, parent, path);
	  });
	}
	
	/**
	 * Stop listening to all bound objects
	 */
	
	Observable.prototype.stop = function () {
	  debug('stop');
	
	  this.observers.forEach(function (observer) {
	    Object.unobserve(observer.subject, observer.onchange);
	  });
	}
	
	/**
	 * Stop listening to changes on `subject`
	 *
	 * @param {Object} subject
	 * @api private
	 */
	
	Observable.prototype._remove = function (subject) {
	  debug('_remove', subject);
	
	  this.observers = this.observers.filter(function (observer) {
	    if (subject == observer.subject) {
	      Object.unobserve(observer.subject, observer.onchange);
	      return false;
	    }
	
	    return true;
	  });
	}
	
	/*!
	 * Creates an Object.observe `onchange` listener
	 */
	
	function onchange (parent, prefix) {
	  return function (ary) {
	    debug('onchange', prefix);
	
	    ary.forEach(function (change) {
	      var object = change.object;
	      var type = change.type;
	      var name = change.name;
	      var value = object[name];
	
	      var path = prefix
	        ? prefix + '.' + name
	        : name
	
	      if ('add' == type && null != value && 'object' == typeof value) {
	        new Observable(value, parent, path);
	      } else if ('delete' == type && 'object' == typeof change.oldValue) {
	        parent._remove(change.oldValue);
	      }
	
	      change = new Change(path, change);
	      parent.emit(type, change);
	      parent.emit(type + ' ' + path, change);
	      parent.emit('change', change);
	      parent.emit('change' + ' ' + path, change);
	    })
	  }
	}
	


/***/ },
/* 14 */
/*!**********************************!*\
  !*** ./~/observed/lib/change.js ***!
  \**********************************/
/***/ function(module, exports) {

	
	module.exports = exports = Change;
	
	/*!
	 * Change object constructor
	 *
	 * The `change` object passed to Object.observe callbacks
	 * is immutable so we create a new one to modify.
	 */
	
	function Change (path, change) {
	  this.path = path;
	  this.name = change.name;
	  this.type = change.type;
	  this.object = change.object;
	  this.value = change.object[change.name];
	  this.oldValue = change.oldValue;
	}
	


/***/ },
/* 15 */
/*!********************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/events/events.js ***!
  \********************************************************/
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	
	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 16 */
/*!***************************************!*\
  !*** ./~/observed/~/debug/browser.js ***!
  \***************************************/
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */
	
	exports = module.exports = __webpack_require__(/*! ./debug */ 17);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	
	/**
	 * Use chrome.storage.local if we are in an app
	 */
	
	var storage;
	
	if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
	  storage = chrome.storage.local;
	else
	  storage = window.localStorage;
	
	/**
	 * Colors.
	 */
	
	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];
	
	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */
	
	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  return ('WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}
	
	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */
	
	exports.formatters.j = function(v) {
	  return JSON.stringify(v);
	};
	
	
	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */
	
	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;
	
	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);
	
	  if (!useColors) return args;
	
	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));
	
	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });
	
	  args.splice(lastC, 0, c);
	  return args;
	}
	
	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */
	
	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}
	
	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */
	
	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      storage.removeItem('debug');
	    } else {
	      storage.debug = namespaces;
	    }
	  } catch(e) {}
	}
	
	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */
	
	function load() {
	  var r;
	  try {
	    r = storage.debug;
	  } catch(e) {}
	  return r;
	}
	
	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */
	
	exports.enable(load());


/***/ },
/* 17 */
/*!*************************************!*\
  !*** ./~/observed/~/debug/debug.js ***!
  \*************************************/
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */
	
	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(/*! ms */ 18);
	
	/**
	 * The currently active debug mode names, and names to skip.
	 */
	
	exports.names = [];
	exports.skips = [];
	
	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */
	
	exports.formatters = {};
	
	/**
	 * Previously assigned color.
	 */
	
	var prevColor = 0;
	
	/**
	 * Previous log timestamp.
	 */
	
	var prevTime;
	
	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */
	
	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}
	
	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */
	
	function debug(namespace) {
	
	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;
	
	  // define the `enabled` version
	  function enabled() {
	
	    var self = enabled;
	
	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;
	
	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();
	
	    var args = Array.prototype.slice.call(arguments);
	
	    args[0] = exports.coerce(args[0]);
	
	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }
	
	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);
	
	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });
	
	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;
	
	  var fn = exports.enabled(namespace) ? enabled : disabled;
	
	  fn.namespace = namespace;
	
	  return fn;
	}
	
	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */
	
	function enable(namespaces) {
	  exports.save(namespaces);
	
	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;
	
	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}
	
	/**
	 * Disable debug output.
	 *
	 * @api public
	 */
	
	function disable() {
	  exports.enable('');
	}
	
	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */
	
	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}
	
	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */
	
	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 18 */
/*!******************************************!*\
  !*** ./~/observed/~/debug/~/ms/index.js ***!
  \******************************************/
/***/ function(module, exports) {

	/**
	 * Helpers.
	 */
	
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;
	
	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */
	
	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};
	
	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */
	
	function parse(str) {
	  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 's':
	      return n * s;
	    case 'ms':
	      return n;
	  }
	}
	
	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */
	
	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}
	
	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */
	
	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}
	
	/**
	 * Pluralization helper.
	 */
	
	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}


/***/ }
/******/ ]);
//# sourceMappingURL=playvm.js.map