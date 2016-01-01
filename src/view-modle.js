var ViewModel = function (object) {
  var callbackMap = {};

  object.$watch = function (path, callback) {
    var callbacks = callbackMap[path];
    if (!callbacks) {
      callbacks = callbackMap[path] = [];
    }
    callbacks.push(callback);
  };

  object.$unwatch = function (path, callback) {
    var callbacks = callbackMap[path];
    if (callbacks) {
      if (callback) {
        for (var i = 0, len = callbacks.length; i < len; i++) {
          if (callback == callbacks[i]) {
            callbacks.splice(i, 1);
            break;
          }
        }
      } else {
        callbackMap[path] = [];
      }
    }
  };

  object.$extend = function () {
    return ViewModel(Object.create(this));
  };

  object.$destroy = function () {
    for (var path in callbackMap) {
      if (callbackMap.hasOwnProperty(path)) {
        var callbacks = callbackMap[path] || [];

        for (var i = 0, len = callbacks.length; i < len; i++) {
          var callback = callbacks[i];
          callback.destroy();
        }
      }
    }

    callbackMap = {};
  };

  Object.observe(object, function (changes) {
    // todo...
    console.log(changes);
  });

  return object;
};

module.exports = ViewModel;