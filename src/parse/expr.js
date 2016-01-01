var jsep = require('jsep');

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
      var arguments = ast.arguments;
      var parsedValues = [];
      if (arguments) {
        arguments.forEach(function (arg) {
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
      var elements = ast.elements, mappedValues = [];

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
  var converted = parser(string);
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
