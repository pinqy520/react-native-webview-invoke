// @flow

import { createMessager } from './messager/index'

const { send, on, off, listener } = createMessager(
    (data: any) => window.postMessage(JSON.stringify(data))
)



window.document.addEventListener('message', e => listener(JSON.parse(e.data)))

export default {
    send, on, off
}