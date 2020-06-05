(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.WebViewCreateInvoke = {}));
}(this, (function (exports) { 'use strict';

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

  exports.createMessager = createMessager;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
