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

function createMessager(getWebviewInstance) {
    var _this = this;

    var MessageTransaction = {};
    var WebviewMessageSender = function WebviewMessageSender(command, data) {
        var id = getUID();
        var key = command + "(" + id + ")";
        var payload = {
            command: command, id: id, data: data
        };
        return new Promise(function (resolve) {
            MessageTransaction[key] = resolve;
            getWebviewInstance().sendToBridge(payload);
        });
    };
    var WebviewMessageListener = function WebviewMessageListener(processor) {
        return function () {
            var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee(payload) {
                var webviewInstance, _key, resolver;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                webviewInstance = getWebviewInstance();

                                if (!webviewInstance) {
                                    _context.next = 13;
                                    break;
                                }

                                if (!payload.reply) {
                                    _context.next = 8;
                                    break;
                                }

                                _key = payload.command + "(" + payload.id + ")";
                                resolver = MessageTransaction[_key];

                                if (resolver) {
                                    resolver(payload.data);
                                    delete MessageTransaction[_key];
                                }
                                _context.next = 13;
                                break;

                            case 8:
                                _context.next = 10;
                                return processor(payload.command, payload.data);

                            case 10:
                                payload.data = _context.sent;

                                payload.reply = true;
                                webviewInstance.sendToBridge(payload);

                            case 13:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, _this);
            }));

            return function (_x) {
                return _ref.apply(this, arguments);
            };
        }();
    };
    return {
        sender: WebviewMessageSender,
        createListener: WebviewMessageListener
    };
}

module.exports = createMessager;
