var expr = require('../parse/expr');
var compileExpr = expr.compile;
var getDepends = expr.getDepends;

class Directive {
  constructor(options) {
    this.element = options.element;
    this.expression = options.extensions;
    this.context = options.context;

    this.bind();
  }

  bind() {
    if (this.element && this.expression && this.context) {
      this.valueFn = compileExpr(this.expression, this.context);
      var depends = getDepends(this.expression);
      var context = this.context;

      depends.forEach((depend) => {
        context.$watch(depend, this)
      });

      this.update();
    }
  }

  unbind() {
    var depends = getDepends(this.expression);
    var context = this.context;

    depends.forEach((depend) => {
      context.$unwatch(depend, this);
    });
  }

  destroy() {
    this.unbind();

    this.element = null;
    this.expression = null;
    this.context = null;
    this.valueFn = null;
  }

  update() {

  }
}

module.exports = Directive;
