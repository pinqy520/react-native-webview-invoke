(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.WebViewInvoke = factory());
}(this, (function () { 'use strict';

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
    return { addEventListener: addEventListener, removeEventListener: removeEventListener, emitEvent: emitEvent };
}

// export const GlobalEventBus = createEventBus()

var babelHelpers = {};




var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};











































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers;

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
    return data.command + '(' + data.id + ')';
};

var SYNC_COMMAND = 'RNWV:sync';
var SUCCESS = 'success';
var FAIL = 'fail';

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
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return send(name, args);
        };
    }

    function define(name, func) {
        callbacks[name] = function (args) {
            return func.apply(undefined, toConsumableArray(args));
        };
        !needWait && sync();
        return { define: define, bind: bind };
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
        var payload = {
            command: command, data: data, id: getUID(), reply: false
        };
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
            var _key2 = getTransactionKey(data);
            if (transactions[_key2]) {
                if (data.status === FAIL) {
                    transactions[_key2].reject(data.data);
                } else {
                    transactions[_key2].resolve(data.data);
                }
            }
        } else {
            if (callbacks[data.command]) {
                var result = callbacks[data.command](data.data);
                if (result && result.then) {
                    result.then(function (d) {
                        return reply(data, d, SUCCESS);
                    }).catch(function (e) {
                        return reply(data, e, FAIL);
                    });
                } else {
                    reply(data, result, SUCCESS);
                }
            } else {
                reply(data, 'function ' + data.command + ' is not defined', FAIL);
            }
        }
        eventBus.emitEvent('receive', data);
    }

    var __sync = bind(SYNC_COMMAND);
    function _sync() {
        var defines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        defines.filter(function (d) {
            return !(d in fn);
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
        bind: bind, define: define, listener: listener, ready: sync, fn: fn,
        addEventListener: eventBus.addEventListener,
        removeEventListener: eventBus.removeEventListener,
        isConnect: isConnect
    };
}

var isBrowser = typeof window !== 'undefined';

var _createMessager = createMessager(function (data) {
    isBrowser && window.postMessage(JSON.stringify(data));
});
var bind = _createMessager.bind;
var define = _createMessager.define;
var listener = _createMessager.listener;
var ready = _createMessager.ready;
var fn = _createMessager.fn;
var addEventListener = _createMessager.addEventListener;
var removeEventListener = _createMessager.removeEventListener;
var isConnect = _createMessager.isConnect;

if (isBrowser) {

    var originalPostMessage = window['originalPostMessage'];

    if (originalPostMessage) {
        ready();
    } else {
        var descriptor = {
            get: function get() {
                return originalPostMessage;
            },
            set: function set(value) {
                originalPostMessage = value;
                if (originalPostMessage) {
                    setTimeout(ready, 50);
                }
            }
        };
        Object.defineProperty(window, 'originalPostMessage', descriptor);
    }

    window.document.addEventListener('message', function (e) {
        return listener(JSON.parse(e.data));
    });
}

var browser = {
    bind: bind, define: define, fn: fn, addEventListener: addEventListener, removeEventListener: removeEventListener, isConnect: isConnect
};

return browser;

})));
