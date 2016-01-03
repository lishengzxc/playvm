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
var EventDirective = require('./event');

register('d-model', ModelDirective);
register('d-text', TextDirective);
register('d-event', EventDirective);

var events = ['click', 'focus', 'blur'];

var addEvents = function (event) {
  register('d-' + event, class e extends EventDirective {
    constructor(options) {

      super(options);
      //this.isPair = false;
      this.event = event;

      if (this.element) {
        this.element.addEventListener(this.event, this.valueFn, false);
      }
    }
  });
};

for (var i = 0, len = events.length; i < len; i++) {
  var event = events[i];
  addEvents(event);
}

module.exports = {
  register: register,
  create: create,
  has: has,
  isPair: isPair
};