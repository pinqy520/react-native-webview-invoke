(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.WebViewInvoke = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};









var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
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

















var set$1 = function set$1(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$1(parent, property, value, receiver);
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
    return data.command + '(' + data.id + ')';
};

var SYNC_COMMAND = 'RNWV:sync';

function createMessager(sendHandler) {
    var needWait = [];

    var transactions = {};
    var callbacks = {};
    var fn = {};

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
        var force = data.command === SYNC_COMMAND;
        if (!force && needWait) {
            needWait.push(data);
        } else {
            sendHandler(data);
        }
    }
    function initialize() {
        if (needWait) {
            var waiting = needWait;
            needWait = null;
            waiting.forEach(function (payload) {
                sender(payload);
            });
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

    return { bind: bind, define: define, listener: listener, ready: sync, fn: fn };
}

var originalPostMessage = window['originalPostMessage'];

var _createMessager = createMessager(function (data) {
    return window.postMessage(JSON.stringify(data));
});
var bind = _createMessager.bind;
var define = _createMessager.define;
var listener = _createMessager.listener;
var ready = _createMessager.ready;
var fn = _createMessager.fn;

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

var browser = {
    bind: bind, define: define, fn: fn
};

return browser;

})));
