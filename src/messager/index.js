// @flow

class Deferred<T> {
    promise: Promise<T>
    resolve: (data: T | Promise<T>) => void
    reject: (reason: any) => void
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

interface PayloadStatic<T> {
    id: number,
    command: string,
    data: T,
    reply: boolean
}

let count = 0

function getUID() {
    return count++
}

type callbackStatic = (data: any) => any

const getTransactionKey = (data: PayloadStatic<any>) => `${data.command}(${data.id})`

export function createMessager(sendHandler: (data: any) => void) {

    const transactions: { [key: string]: Deferred<PayloadStatic<any>> } = {}
    const callbacks: { [key: string]: callbackStatic } = {}

    function on(command: string, fn: callbackStatic) {
        callbacks[command] = fn
    }

    function off(command: string, fn: callbackStatic) {
        delete callbacks[command]
    }

    function sender(data: PayloadStatic<any>) {
        sendHandler(data)
    }

    async function send(command: string, data: any) {
        const payload: PayloadStatic<any> = {
            command, data, id: getUID(), reply: false
        }
        const defer = new Deferred
        transactions[getTransactionKey(payload)] = defer
        sender(payload)
        return defer.promise
    }


    async function listener(data: PayloadStatic<any>) {
        if (data.reply) {
            const key = getTransactionKey(data)
            transactions[key] && transactions[key].resolve(data.data)
        } else {
            if (callbacks[data.command]) {
                const result = await callbacks[data.command](data.data)
                data.reply = true
                data.data = result
                sender(data)
            }
        }
    }
    return { send, on, off, listener }
}