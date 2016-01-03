var Directive = require('./directive');

class EventDirective extends Directive {
  constructor(options) {
    super(options);

    if (options) {
      if (options.key !== undefined) {
        this.event = options.key;
      }
    }

  }

  bind() {
    Directive.prototype.bind.call(this);

  }

  update() {
  }
}

EventDirective.prototype.isPair = true;

module.exports = EventDirective;