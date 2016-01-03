var directive = require('./directive');
var isPairDirective = directive.isPair;
var createDirective = directive.create;
var parsePair = require('./parse/parse-pair');

function bind(element, collections, context) {
  for (var i = 0, len = collections.length; i < len; i++) {
    var collection = collections[i];
    var type = collection.type;

    if (isPairDirective(type)) {
      var pairs = parsePair(collection.value);
      for (var k = 0, l = pairs.length; k < l; k++) {

        var pair = pairs[k];
        createDirective(collection.type, {
          element: element, expression: pair.value, context: context, key: pair.key, attr: collection.attr
        });
      }

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