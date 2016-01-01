function bind(element, collections, context) {
  for (var i = 0, len = collections.length; i < len; i++) {
    var collection = collections[i];
    var type = collection.type;
    console.log(type);
  }
}

module.exports = bind;