import { createEventBus } from './event-bus';

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

function getTransactionKey(data) {
  return `${data.command}(${data.id})`;
}

function createPayload(command, data) {
  return {
    id: _count++,
    command,
    data,
    reply: false,
    status: STATUS_SUCCESS,
  };
}

export function createMessager(sendHandler) {
  let needWait = [];
  const eventBus = createEventBus();
  const transactions = {};
  const callbacks = {}; //
  const fn = {}; // all other side functions

  function isConnect() {
    return !needWait;
  }

  function bind(name) {
    return (...args) => send(name, args);
  }

  function define(name, func) {
    callbacks[name] = args => func(...args);
    !needWait && sync();
    return { define, bind };
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
      waiting.forEach(function (payload) {
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
            .then(function (d) {
              reply(data, d, STATUS_SUCCESS);
            })
            .catch(function (e) {
              reply(data, e, STATUS_FAIL);
            });
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
    defines
      .filter(function (d) {
        return !fn[d];
      })
      .map(function (d) {
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
    bind,
    define,
    listener,
    ready: sync,
    fn,
    addEventListener: eventBus.addEventListener,
    removeEventListener: eventBus.removeEventListener,
    isConnect,
  };
}
