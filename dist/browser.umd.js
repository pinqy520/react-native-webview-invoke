(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.WebViewInvoke = factory());
}(this, function () { 'use strict';

    function createEventBus() {
        const listeners = {
            send: [],
            receive: [],
            ready: []
        };

        function addEventListener(name, cb) {
            if (name in listeners) {
                const fns = listeners[name];
                if (fns.indexOf(cb) < 0) {
                    fns.push(cb);
                }
            }
        }

        function removeEventListener(name, cb) {
            if (name in listeners) {
                const fns = listeners[name];
                const idx = fns.indexOf(cb);
                if (idx >= 0) {
                    fns.splice(idx, 1);
                }
            }
        }

        function emitEvent(name, event) {
            if (name in listeners) {
                listeners[name].forEach(fn => fn(event));
            }
        }
        return { addEventListener, removeEventListener, emitEvent }
    }

    class Deferred {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
    }

    let count = 0;

    function getUID() {
        return count++
    }

    const getTransactionKey = data => `${data.command}(${data.id})`;

    const SYNC_COMMAND = 'RNWV:sync';
    const SUCCESS = 'success';
    const FAIL = 'fail';

    function createMessager(sendHandler) {
        let needWait = [];
        const eventBus = createEventBus();
        const transactions = {};
        const callbacks = {}; // 
        const fn = {}; // all other side functions

        function isConnect() { return !needWait }

        function bind(name) {
            return (...args) => send(name, args)
        }

        function define(name, func) {
            callbacks[name] = (args) => func(...args);
            !needWait && sync();
            return { define, bind }
        }

        /** sender parts */
        function sender(data) {
            const force = data.command === SYNC_COMMAND; // force send the message when the message is the sync message
            if (!force && needWait) {
                needWait.push(data);
            } else {
                sendHandler(data);
            }
            eventBus.emitEvent('send', data);
        }
        function initialize() {
            if (needWait) {
                const waiting = needWait;
                needWait = null;
                waiting.forEach(payload => {
                    sender(payload);
                });
                eventBus.emitEvent('ready');
            }
        }

        function send(command, data) {
            const payload = {
                command, data, id: getUID(), reply: false
            };
            const defer = new Deferred();
            transactions[getTransactionKey(payload)] = defer;
            sender(payload);
            return defer.promise
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
                const key = getTransactionKey(data);
                if (transactions[key]) {
                    if (data.status === FAIL) {
                        transactions[key].reject(data.data);
                    } else {
                        transactions[key].resolve(data.data);
                    }
                }
            } else {
                if (callbacks[data.command]) {
                    const result = callbacks[data.command](data.data);
                    if (result && result.then) {
                        result
                            .then(d => reply(data, d, SUCCESS))
                            .catch(e => reply(data, e, FAIL));
                    } else {
                        reply(data, result, SUCCESS);
                    }
                } else {
                    reply(data, `function ${data.command} is not defined`, FAIL);
                }
            }
            eventBus.emitEvent('receive', data);
        }



        const __sync = bind(SYNC_COMMAND);
        function _sync(defines = []) {
            defines.filter(d => !(d in fn))
                .map(d => {
                    fn[d] = bind(d);
                });
            initialize();
            return Object.keys(callbacks)
        }
        define(SYNC_COMMAND, _sync);

        function sync() {
            __sync(Object.keys(callbacks)).then(_sync);
        }


        return {
            bind, define, listener, ready: sync, fn,
            addEventListener: eventBus.addEventListener,
            removeEventListener: eventBus.removeEventListener,
            isConnect
        }
    }

    const isBrowser = typeof window !== 'undefined';

    const { bind, define, listener, ready, fn, addEventListener, removeEventListener, isConnect } = createMessager(
        data => { isBrowser && window.postMessage(JSON.stringify(data)); }
    );

    if (isBrowser) {

        let originalPostMessage = window['originalPostMessage'];

        if (originalPostMessage) {
            ready();
        } else {
            const descriptor = {
                get: function () {
                    return originalPostMessage
                },
                set: function (value) {
                    originalPostMessage = value;
                    if (originalPostMessage) {
                        setTimeout(ready, 50);
                    }
                }
            };
            Object.defineProperty(window, 'originalPostMessage', descriptor);
        }

        window.document.addEventListener('message', e => listener(JSON.parse(e.data)));

    }

    var browser = {
        bind, define, fn, addEventListener, removeEventListener, isConnect
    };

    return browser;

}));
