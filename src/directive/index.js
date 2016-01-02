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

var isPair = function (name) {
  var fn = DirectiveMap[name];
  if (!fn) return false;
  return !!fn.prototype.isPair;
};

var ModelDirective = require('./model');
var TextDirective = require('./text');

register('d-model', ModelDirective);
register('d-text', TextDirective);

module.exports = {
  register: register,
  create: create,
  has: has,
  isPair: isPair
};