import { createMessager } from './messager/index'

const isBrowser = typeof window !== 'undefined'

const { bind, define, listener, ready, fn, addEventListener, removeEventListener, isConnect } = createMessager(
    data => { isBrowser && window.postMessage(JSON.stringify(data)) }
)

if (isBrowser) {

    let originalPostMessage = window['originalPostMessage']

    if (originalPostMessage) {
        ready()
    } else {
        const descriptor = {
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

}

export default {
    bind, define, fn, addEventListener, removeEventListener, isConnect
}