var Directive = require('./directive');

var setter = function (obj, path, newValue) {
  if (!obj || !path) return;
  var paths = path.split('.'), target = obj;
  for (var i = 0, len = paths.length; i < len; i++) {
    var subPath = paths[i], value = target[subPath];
    if (i == len - 1) {
      target[subPath] = newValue;
    } else {
      if (value)
        target = value;
      else
        return;
    }
  }
};

class ModelDirective extends Directive {
  constructor(options) {
    super(options);
  }

  bind() {
    Directive.prototype.bind.call(this, arguments);
    var element = this.element;

    var listener = function () {
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

  update() {
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
}

module.exports = ModelDirective;
