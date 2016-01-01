exports.maybeIncludeExpression = function (text) {
  return /\{\{\s*(.+?)\s*\}\}/ig.test(text);
};