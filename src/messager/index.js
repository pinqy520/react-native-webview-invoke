// @flow

class Deferred {
    promise: Promise<any>
    resolve: (data: any) => void
    reject: (reason: any) => void
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

interface IPayload<T> {
    id: number,
    command: string,
    data: T,
    reply: boolean
}

let count = 0

function getUID() {
    return count++
}

type TCallback = (...data: any) => any

const getTransactionKey = (data: IPayload<any>) => `${data.command}(${data.id})`

const SYNC_COMMAND = 'RNWV:sync'

export function createMessager(sendHandler: (data: any) => void) {
    let needWait: IPayload<any>[] | null = []

    const transactions: { [key: string]: Deferred } = {}
    const callbacks: { [key: string]: TCallback } = {}
    const fn: { [key: string]: any } = {}

    function bind(name: string) {
        return (...args: any): Promise<any> => send(name, args)
    }

    function define(name: string, func: TCallback) {
        callbacks[name] = (args: any) => func(...args)
        !needWait && sync()
        return { define, bind }
    }

    /** sender parts */
    function sender(data: IPayload<any>) {
        const force = data.command === SYNC_COMMAND
        if (!force && needWait) {
            needWait.push(data)
        } else {
            sendHandler(data)
        }
    }
    function initialize() {
        if (needWait) {
            const waiting = needWait
            needWait = null
            waiting.forEach(payload => {
                sender(payload)
            })
        }
    }

    function send(command: string, data: any) {
        const payload: IPayload<any> = {
            command, data, id: getUID(), reply: false
        }
        const defer = new Deferred()
        transactions[getTransactionKey(payload)] = defer
        sender(payload)
        return defer.promise
    }

    function reply(data: IPayload<any>, result: any) {
        data.reply = true
        data.data = result
        sender(data)
    }
    /** listener parts */
    function listener(data: IPayload<any>) {
        if (data.reply) {
            const key = getTransactionKey(data)
            transactions[key] && transactions[key].resolve(data.data)
        } else {
            if (callbacks[data.command]) {
                const result = callbacks[data.command](data.data)
                if (result && result.then) {
                    result.then(d => reply(data, d))
                } else {
                    reply(data, result)
                }
            } else {
                reply(data, null)
            }
        }
    }



    const __sync = bind(SYNC_COMMAND)
    function _sync(defines: string[] = []) {
        defines.filter(d => !(d in fn))
            .map(d => {
                fn[d] = bind(d)
            })
        initialize()
        return Object.keys(callbacks)
    }
    define(SYNC_COMMAND, _sync)

    function sync() {
        __sync(Object.keys(callbacks)).then(_sync)
    }


    return { bind, define, listener, ready: sync, fn }
}