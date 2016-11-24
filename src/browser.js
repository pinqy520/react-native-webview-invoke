// @flow

export type payloadStatic = { id: number, command: string, data: any, reply?: boolean }
export type messageProcessor = (command: string, data: any) => Promise<any>

const MessageTransaction: { [key: string]: (data: any) => any } = {}

let listeners: { [key: string]: (message: payloadStatic) => any } = {}
let listening = false
let onReadyCallbacks = []

function init() {
    if (window['WebViewBridge'] && window['WebViewBridge'].addMessageListener && !listening) {
        // console.log(JSON.stringify(window['WebViewBridge'], '\n', 2))
        window['WebViewBridge'].addMessageListener(function (msg: payloadStatic) {
            for (let key in listeners) {
                listeners[key](msg)
            }
        })
        listening = true
        for (let i = 0; i < onReadyCallbacks.length; i++) {
            onReadyCallbacks[i] && onReadyCallbacks[i]()
        }
        onReadyCallbacks = []
    }
}

function send(payload: any) {
    if (window['WebViewBridge']) {
        init()
        window['WebViewBridge'].send(payload)
    }
}

const WebviewMessageSender = (command: string, data: any): Promise<any> => {
    const id = getUID()
    const key = `${command}(${id})`
    const payload = {
        command, id, data
    }
    return new Promise(resolve => {
        MessageTransaction[key] = resolve
        send(payload)
    })
}
const WebviewMessageListener = (processor: messageProcessor) => (
    async (payload: payloadStatic) => {
        if (window['WebViewBridge']) {
            if (payload.reply) {
                const key = `${payload.command}(${payload.id})`
                const resolver = MessageTransaction[key]
                if (resolver) {
                    resolver(payload.data)
                    delete MessageTransaction[key]
                }
            } else {
                payload.data = await processor(payload.command, payload.data)
                payload.reply = true
                send(payload)
            }
        }
    }
)

const WebviewMessageListenerRegister = (key: string, fn: messageProcessor) => listeners[key] = WebviewMessageListener(fn)

const WebviewMessageListenerUnregister = (key: string) => delete listeners[key]

const WebviewMessageOnReady = (fn: () => any) => {
    if (listening) {
        fn()
    } else {
        onReadyCallbacks.push(fn)
    }
}

const getUID = (() => {
    let counter = 0
    return () => counter++
})()

export const messager = {
    sender: WebviewMessageSender,
    register: WebviewMessageListenerRegister,
    unregister: WebviewMessageListenerUnregister,
    onReady: WebviewMessageOnReady
}

window.addEventListener('webviewbridge:init', function () {
    init()
})

init()