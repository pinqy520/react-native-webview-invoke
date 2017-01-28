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

    return { bind: bind, define: define, listener: listener, ready: sync, fn: fn, addEventListener: eventBus.addEventListener, removeEventListener: eventBus.removeEventListener, isConnect: isConnect };
}

var native = (function (getWebview) {
    var _createMessager = createMessager(function (data) {
        return getWebview().postMessage(JSON.stringify(data));
    }),
        bind = _createMessager.bind,
        define = _createMessager.define,
        handler = _createMessager.listener,
        fn = _createMessager.fn,
        addEventListener = _createMessager.addEventListener,
        removeEventListener = _createMessager.removeEventListener,
        isConnect = _createMessager.isConnect;

    return {
        bind: bind, define: define, fn: fn,
        listener: function listener(e) {
            var data = void 0;
            try {
                // FIX: webpack hotloader will triger this
                data = JSON.parse(e.nativeEvent.data);
            } catch (e) {}
            data && handler(data);
        },
        addEventListener: addEventListener, removeEventListener: removeEventListener, isConnect: isConnect
    };
});

export default native;
