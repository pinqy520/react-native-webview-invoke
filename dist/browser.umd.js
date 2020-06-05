(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.WebViewInvoke = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function createEventBus() {
    var listeners = {
      send: [],
      receive: [],
      ready: []
    };

    function addEventListener(name, cb) {
      if (name in listeners) {
        var fns = listeners[name];

        if (fns.indexOf(cb) < 0) {
          fns.push(cb);
        }
      }
    }

    function removeEventListener(name, cb) {
      if (name in listeners) {
        var fns = listeners[name];
        var idx = fns.indexOf(cb);

        if (idx >= 0) {
          fns.splice(idx, 1);
        }
      }
    }

    function emitEvent(name, event) {
      if (name in listeners) {
        listeners[name].forEach(function (fn) {
          return fn(event);
        });
      }
    }

    return {
      addEventListener: addEventListener,
      removeEventListener: removeEventListener,
      emitEvent: emitEvent
    };
  }

  var SYNC_COMMAND = 'RNWV:sync';
  var STATUS_SUCCESS = 'success';
  var STATUS_FAIL = 'fail';
  var _count = 0;

  var Deferred = function Deferred() {
    var _this = this;

    _classCallCheck(this, Deferred);

    this.promise = new Promise(function (resolve, reject) {
      _this.resolve = resolve;
      _this.reject = reject;
    });
  };

  function getTransactionKey(data) {
    return "".concat(data.command, "(").concat(data.id, ")");
  }

  function createPayload(command, data) {
    return {
      id: _count++,
      command: command,
      data: data,
      reply: false,
      status: STATUS_SUCCESS
    };
  }

  function createMessager(sendHandler) {
    var needWait = [];
    var eventBus = createEventBus();
    var transactions = {};
    var callbacks = {}; //

    var fn = {}; // all other side functions

    function isConnect() {
      return !needWait;
    }

    function bind(name) {
      return function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return send(name, args);
      };
    }

    function define(name, func) {
      callbacks[name] = function (args) {
        return func.apply(void 0, _toConsumableArray(args));
      };

      !needWait && sync();
      return {
        define: define,
        bind: bind
      };
    }
    /** sender parts */


    function sender(data) {
      var force = data.command === SYNC_COMMAND; // force send the message when the message is the sync message

      if (!force && needWait) {
        needWait.push(data);
      } else {
        sendHandler(data);
      }

      eventBus.emitEvent('send', data);
    }

    function initialize() {
      if (needWait) {
        var waiting = needWait;
        needWait = null;
        waiting.forEach(function (payload) {
          sender(payload);
        });
        eventBus.emitEvent('ready');
      }
    }

    function send(command, data) {
      var payload = createPayload(command, data);
      var defer = new Deferred();
      transactions[getTransactionKey(payload)] = defer;
      sender(payload);
      return defer.promise;
    }

    function reply(data, result, status) {
      data.reply = true;
      data.data = result;
      data.status = status;
      sender(data);
    }
    /** listener parts */


    function listener(data) {
      if (data.reply) {
        var key = getTransactionKey(data);

        if (transactions[key]) {
          if (data.status === STATUS_FAIL) {
            transactions[key].reject(data.data);
          } else {
            transactions[key].resolve(data.data);
          }
        }
      } else {
        if (callbacks[data.command]) {
          var result = callbacks[data.command](data.data);

          if (result && result.then) {
            result.then(function (d) {
              reply(data, d, STATUS_SUCCESS);
            })["catch"](function (e) {
              reply(data, e, STATUS_FAIL);
            });
          } else {
            reply(data, result, STATUS_SUCCESS);
          }
        } else {
          reply(data, "function ".concat(data.command, " is not defined"), STATUS_FAIL);
        }
      }

      eventBus.emitEvent('receive', data);
    }

    var __sync = bind(SYNC_COMMAND);

    function _sync() {
      var defines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      defines.filter(function (d) {
        return !fn[d];
      }).map(function (d) {
        fn[d] = bind(d);
      });
      initialize();
      return Object.keys(callbacks);
    }

    define(SYNC_COMMAND, _sync);

    function sync() {
      __sync(Object.keys(callbacks)).then(_sync);
    }

    return {
      bind: bind,
      define: define,
      listener: listener,
      ready: sync,
      fn: fn,
      addEventListener: eventBus.addEventListener,
      removeEventListener: eventBus.removeEventListener,
      isConnect: isConnect
    };
  }

  var _postMessage = null;
  var isBrowser = typeof window !== 'undefined';

  var _createMessager = createMessager(function (data) {
    return isBrowser && _postMessage && _postMessage(JSON.stringify(data));
  }),
      bind = _createMessager.bind,
      define = _createMessager.define,
      listener = _createMessager.listener,
      ready = _createMessager.ready,
      fn = _createMessager.fn,
      addEventListener = _createMessager.addEventListener,
      removeEventListener = _createMessager.removeEventListener,
      isConnect = _createMessager.isConnect;
  /*Handle only the messages which are of structure rn-webview-invoke.
  Ignore messages which came from other sources.

  Ex: In case of vimeo player, vimeo player will throw some self messages.
  These messages need to be ignored*/


  var handleMessage = function handleMessage(message) {
    var jsonMessage = undefined;

    if (_typeof(message) === 'object') {
      jsonMessage = message;
    } else if (typeof message === 'string') {
      try {
        jsonMessage = JSON.parse(message);
      } catch (error) {}
    }

    if (jsonMessage && (jsonMessage.command || jsonMessage.reply)) {
      listener(jsonMessage);
    }
  };

  if (isBrowser) {
    // react-native
    var originalPostMessage = window.originalPostMessage;

    if (originalPostMessage) {
      _postMessage = function _postMessage() {
        var _window;

        return (_window = window).postMessage.apply(_window, arguments);
      };

      ready();
    } else {
      var descriptor = {
        get: function get() {
          return originalPostMessage;
        },
        set: function set(value) {
          originalPostMessage = value;

          if (originalPostMessage) {
            _postMessage = function _postMessage() {
              var _window2;

              return (_window2 = window).postMessage.apply(_window2, arguments);
            };

            setTimeout(ready, 50);
          }
        }
      };
      Object.defineProperty(window, 'originalPostMessage', descriptor);
    } // react-native-webview


    var ReactNativeWebView = window.ReactNativeWebView;

    if (ReactNativeWebView) {
      _postMessage = function _postMessage() {
        var _window$ReactNativeWe;

        return (_window$ReactNativeWe = window.ReactNativeWebView).postMessage.apply(_window$ReactNativeWe, arguments);
      };

      ready();
    } else {
      var _descriptor = {
        get: function get() {
          return ReactNativeWebView;
        },
        set: function set(value) {
          ReactNativeWebView = value;

          if (ReactNativeWebView) {
            _postMessage = function _postMessage() {
              var _window$ReactNativeWe2;

              return (_window$ReactNativeWe2 = window.ReactNativeWebView).postMessage.apply(_window$ReactNativeWe2, arguments);
            };

            setTimeout(ready, 50);
          }
        }
      };
      Object.defineProperty(window, 'ReactNativeWebView', _descriptor);
    } // onMessage react native


    window.document.addEventListener('message', function (e) {
      return originalPostMessage && handleMessage(e.data);
    }); // onMessage react-native-webview 

    window.addEventListener('message', function (e) {
      return ReactNativeWebView && handleMessage(e.data);
    }); // onMessage react-native-webview  with android

    window.document.addEventListener('message', function (e) {
      return ReactNativeWebView && handleMessage(e.data);
    });
  }

  var browser = {
    bind: bind,
    define: define,
    fn: fn,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    isConnect: isConnect
  };

  return browser;

})));
