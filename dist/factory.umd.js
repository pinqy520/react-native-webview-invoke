(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.WebViewCreateInvoke = {}));
}(this, (function (exports) { 'use strict';

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

    const SYNC_COMMAND = 'RNWV:sync';
    const STATUS_SUCCESS = 'success';
    const STATUS_FAIL = 'fail';
    let _count = 0;

    class Deferred {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
    }

    const getTransactionKey = data => `${data.command}(${data.id})`;

    const createPayload = (command, data) => ({
        id: _count++,
        command, data,
        reply: false,
        status: STATUS_SUCCESS
    });

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
            const payload = createPayload(command, data);
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
                    if (data.status === STATUS_FAIL) {
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
                            .then(d => reply(data, d, STATUS_SUCCESS))
                            .catch(e => reply(data, e, STATUS_FAIL));
                    } else {
                        reply(data, result, STATUS_SUCCESS);
                    }
                } else {
                    reply(data, `function ${data.command} is not defined`, STATUS_FAIL);
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

    exports.createMessager = createMessager;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
