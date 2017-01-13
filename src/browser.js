// @flow

import { createMessager } from './messager/index'

let originalPostMessage = window['originalPostMessage']

const { bind, define, listener, ready, fn, addEventListener, removeEventListener } = createMessager(
    (data: any) => window.postMessage(JSON.stringify(data))
)

if (originalPostMessage) {
    ready()
} else {
    const descriptor: any = {
        get: function () {
            return originalPostMessage
        },
        set: function (value) {
            originalPostMessage = value
            if (originalPostMessage) {
                setTimeout(ready, 50)
            }
        }
    }
    Object.defineProperty(window, 'originalPostMessage', descriptor)
}

window.document.addEventListener('message', e => listener(JSON.parse(e.data)))

export default {
    bind, define, fn, addEventListener, removeEventListener
}