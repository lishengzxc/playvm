var directive = require('./directive');
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