// @flow

import { createMessager } from './messager/index'

const { bind, define, listener } = createMessager(
    (data: any) => window.postMessage(JSON.stringify(data))
)

window.document.addEventListener('message', e => listener(JSON.parse(e.data)))

export default {
    bind, define
}