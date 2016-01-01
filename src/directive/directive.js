class Directive {
  constructor(options = {}) {
    this.element = options.element;
    this.expression = options.extensions;
    this.context = options.context;

    this.bind();
  }

  bind() {
    // todo: ...
  }

  unbind() {
    // todo: ...
  }

  destroy() {
    // todo: ...
  }
}

module.exports = Directive;