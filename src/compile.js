var walk = require('./walk');
var expression = require('./expression');
var inlineText = require('./parse/inline-text');
var directive = require('./directive');
var createDirective = directive.create;
var isPairDirective = directive.isPair;
var hasDirective = directive.has;
var bind = require('./bind');
var ViewModel = require('./view-model');
var maybeIncludeExpression = expression.maybeIncludeExpression;


function compile(element, context) {
  context = new ViewModel(context);

  walk(element, function (element) {
    var collections = [];

    if (element.nodeType === 1) {
      var attributes = element.attributes;

      for (var i = 0, len = attributes.length; i < len; i++) {
        var attrNode = attributes.item(i);

        var attrKey = attrNode.nodeName;
        var attrValue = attrNode.nodeValue;

        if (maybeIncludeExpression(attrValue)) {
          collections.push({
            type: 'd-attr',
            attr: attrKey,
            value: inlineText(attrValue)
          });
        }

        if (hasDirective(attrKey)) {
          collections.push({
            type: attrKey,
            attr: attrKey,
            value: attrValue
          });
        }


        // todo: 如果指令是d-repeat
        if (attrKey === 'd-repeat') {
          return false;
        }
      }
    } else if (element.nodeType === 3) {
      var text = element.nodeValue;
      if (maybeIncludeExpression(text)) {
        var expression = inlineText(text);
        collections.push({
          type: 'd-text',
          value: expression
        });
      }
    }

    if (collections.length > 0) {
      bind(element, collections, context);
    }
  });

}

module.exports = compile;