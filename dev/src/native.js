var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};









var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Deferred = function Deferred() {
    var _this = this;

    classCallCheck(this, Deferred);

    this.promise = new Promise(function (resolve, reject) {
        _this.resolve = resolve;
        _this.reject = reject;
    });
};

var count = 0;

function getUID() {
    return count++;
}

var getTransactionKey = function getTransactionKey(data) {
    return data.command + "(" + data.id + ")";
};

function createMessager(sendHandler) {

    var transactions = {};
    var callbacks = {};

    function bind(name) {
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return send(name, args);
        };
    }

    function define(name, fn) {
        callbacks[name] = function (args) {
            return fn.apply(undefined, toConsumableArray(args));
        };
        return { define: define, bind: bind };
    }

    /** sender parts */
    function sender(data) {
        sendHandler(data);
    }

    function send(command, data) {
        var payload = {
            command: command, data: data, id: getUID(), reply: false
        };
        var defer = new Deferred();
        transactions[getTransactionKey(payload)] = defer;
        sender(payload);
        return defer.promise;
    }

    function reply(data, result) {
        data.reply = true;
        data.data = result;
        sender(data);
    }
    /** listener parts */
    function listener(data) {
        if (data.reply) {
            var _key2 = getTransactionKey(data);
            transactions[_key2] && transactions[_key2].resolve(data.data);
        } else {
            if (callbacks[data.command]) {
                var result = callbacks[data.command](data.data);
                if (result && result.then) {
                    result.then(function (d) {
                        return reply(data, d);
                    });
                } else {
                    reply(data, result);
                }
            } else {
                reply(data, null);
            }
        }
    }
    return { bind: bind, define: define, listener: listener };
}

var native = (function (getWebview) {
    var _createMessager = createMessager(function (data) {
        return getWebview().postMessage(JSON.stringify(data));
    }),
        bind = _createMessager.bind,
        define = _createMessager.define,
        handler = _createMessager.listener;

    return {
        bind: bind, define: define,
        listener: function listener(e) {
            return handler(JSON.parse(e.nativeEvent.data));
        }
    };
});

export default native;
