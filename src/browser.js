// @flow

import { createMessager } from './messager/index'

let postMessage = window.postMessage

const { bind, define, listener, ready, fn } = createMessager(
    (data: any) => postMessage(JSON.stringify(data))
)

if (window['originalPostMessage']) {
    ready()
} else {
    const descriptor: any = {
        get: function () {
            return postMessage
        },
        set: function (value) {
            postMessage = value
            if (window['originalPostMessage']) {
                ready()
            }
        }
    }
    Object.defineProperty(window, 'postMessage', descriptor)
}

window.document.addEventListener('message', e => listener(JSON.parse(e.data)))

export default {
    bind, define, fn
}