(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WebViewMessager = global.WebViewMessager || {})));
}(this, (function (exports) { 'use strict';

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

var _this = undefined;

var MessageTransaction = {};

var listeners = {};
var listening = false;
var onReadyCallbacks = [];

function init() {
    if (window['WebViewBridge'] && window['WebViewBridge'].addMessageListener && !listening) {
        // console.log(JSON.stringify(window['WebViewBridge'], '\n', 2))
        window['WebViewBridge'].addMessageListener(function (msg) {
            for (var _key in listeners) {
                listeners[_key](msg);
            }
        });
        listening = true;
        for (var i = 0; i < onReadyCallbacks.length; i++) {
            onReadyCallbacks[i] && onReadyCallbacks[i]();
        }
        onReadyCallbacks = [];
    }
}

function send(payload) {
    if (window['WebViewBridge']) {
        init();
        window['WebViewBridge'].send(payload);
    }
}

var WebviewMessageSender = function WebviewMessageSender(command, data) {
    var id = getUID();
    var key = command + '(' + id + ')';
    var payload = {
        command: command, id: id, data: data
    };
    return new Promise(function (resolve) {
        MessageTransaction[key] = resolve;
        send(payload);
    });
};
var WebviewMessageListener = function WebviewMessageListener(processor) {
    return function () {
        var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee(payload) {
            var _key2, resolver;

            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!window['WebViewBridge']) {
                                _context.next = 12;
                                break;
                            }

                            if (!payload.reply) {
                                _context.next = 7;
                                break;
                            }

                            _key2 = payload.command + '(' + payload.id + ')';
                            resolver = MessageTransaction[_key2];

                            if (resolver) {
                                resolver(payload.data);
                                delete MessageTransaction[_key2];
                            }
                            _context.next = 12;
                            break;

                        case 7:
                            _context.next = 9;
                            return processor(payload.command, payload.data);

                        case 9:
                            payload.data = _context.sent;

                            payload.reply = true;
                            send(payload);

                        case 12:
                        case 'end':
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

var WebviewMessageListenerRegister = function WebviewMessageListenerRegister(key, fn) {
    return listeners[key] = WebviewMessageListener(fn);
};

var WebviewMessageListenerUnregister = function WebviewMessageListenerUnregister(key) {
    return delete listeners[key];
};

var WebviewMessageOnReady = function WebviewMessageOnReady(fn) {
    if (listening) {
        fn();
    } else {
        onReadyCallbacks.push(fn);
    }
};

var getUID = function () {
    var counter = 0;
    return function () {
        return counter++;
    };
}();

var messager = {
    sender: WebviewMessageSender,
    register: WebviewMessageListenerRegister,
    unregister: WebviewMessageListenerUnregister,
    onReady: WebviewMessageOnReady
};

window.addEventListener('webviewbridge:init', function () {
    init();
});

init();

exports.messager = messager;

Object.defineProperty(exports, '__esModule', { value: true });

})));
