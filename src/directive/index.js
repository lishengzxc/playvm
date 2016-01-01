var DirectiveMap = {};

var register = function (name, directive) {
  DirectiveMap[name] = directive;
};

var create = function (name, options) {
  var createFunction = DirectiveMap[name];
  return new createFunction(options);
};

var has = function (name) {
  return name in DirectiveMap;
};

var ModelDirective = require('./model');
// todo: 注册内置指令


module.exports = {
  register: register,
  create: create,
  has: has
};