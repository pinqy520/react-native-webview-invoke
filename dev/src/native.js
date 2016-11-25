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

    function on(command, fn) {
        callbacks[command] = fn;
    }

    function off(command, fn) {
        delete callbacks[command];
    }

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

    function listener(data) {
        if (data.reply) {
            var _key = getTransactionKey(data);
            transactions[_key] && transactions[_key].resolve(data.data);
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
    return { send: send, on: on, off: off, listener: listener };
}

var native = (function (getWebview) {
    var _createMessager = createMessager(function (data) {
        return getWebview().postMessage(JSON.stringify(data));
    }),
        send = _createMessager.send,
        on = _createMessager.on,
        off = _createMessager.off,
        handler = _createMessager.listener;

    return {
        send: send, on: on, off: off,
        listener: function listener(e) {
            return handler(JSON.parse(e.nativeEvent.data));
        }
    };
});

export default native;
