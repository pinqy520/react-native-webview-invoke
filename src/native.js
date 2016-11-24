// @flow

declare type payloadStatic = { id: number, command: string, data: any, reply?: boolean }
declare type messageProcessor = (command: string, data: any) => Promise<any>

const getUID = (() => {
    let counter = 0
    return () => counter++
})()

export function createMessager(getWebviewInstance: () => any) {
    const MessageTransaction: { [key: string]: (data: any) => any } = {}
    const WebviewMessageSender = (command: string, data: any): Promise<any> => {
        const id = getUID()
        const key = `${command}(${id})`
        const payload = {
            command, id, data
        }
        return new Promise(resolve => {
            MessageTransaction[key] = resolve
            getWebviewInstance().sendToBridge(payload)
        })
    }
    const WebviewMessageListener = (processor: messageProcessor) => (
        async (payload: payloadStatic) => {
            const webviewInstance = getWebviewInstance()
            if (webviewInstance) {
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
                    webviewInstance.sendToBridge(payload)
                }
            }
        }
    )
    return {
        sender: WebviewMessageSender,
        createListener: WebviewMessageListener
    }
}
