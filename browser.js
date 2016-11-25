'use strict';

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

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
    var send = function () {
        var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee(command, data) {
            var payload, defer;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            payload = {
                                command: command, data: data, id: getUID(), reply: false
                            };
                            defer = new Deferred();

                            transactions[getTransactionKey(payload)] = defer;
                            sender(payload);
                            return _context.abrupt("return", defer.promise);

                        case 5:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function send(_x, _x2) {
            return _ref.apply(this, arguments);
        };
    }();

    var listener = function () {
        var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2(data) {
            var _key, result;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            if (!data.reply) {
                                _context2.next = 5;
                                break;
                            }

                            _key = getTransactionKey(data);

                            transactions[_key] && transactions[_key].resolve(data.data);
                            _context2.next = 12;
                            break;

                        case 5:
                            if (!callbacks[data.command]) {
                                _context2.next = 12;
                                break;
                            }

                            _context2.next = 8;
                            return callbacks[data.command](data.data);

                        case 8:
                            result = _context2.sent;

                            data.reply = true;
                            data.data = result;
                            sender(data);

                        case 12:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        return function listener(_x3) {
            return _ref2.apply(this, arguments);
        };
    }();

    var transactions = {};
    var callbacks = {};

    function on(command, fn) {
        callbacks[command] = fn;
    }

    function off(command, fn) {
        delete callbacks[command];
    }

    function sender(data) {}

    return { send: send, on: on, off: off, listener: listener };
}

var _createMessager = createMessager(function (data) {
    return window.postMessage(JSON.stringify(data));
});
var send = _createMessager.send;
var on = _createMessager.on;
var off = _createMessager.off;
var listener = _createMessager.listener;

window.addEventListener('message', function (e) {
    return listener(JSON.parse(e.data));
});

var browser = {
    send: send, on: on, off: off
};

module.exports = browser;
