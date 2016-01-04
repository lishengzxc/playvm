var Directive = require('./directive');

class AttrDirective extends Directive {
  constructor(options) {
    super(options);
  }

  bind() {
    Directive.prototype.bind.call(this, arguments);
  }

  update() {
    if (this.attr && this.element && this.valueFn) {
      //console.log(this);
      this.element.setAttribute('data-value', this.valueFn() || '');
    }
  }
}

module.exports = AttrDirective;