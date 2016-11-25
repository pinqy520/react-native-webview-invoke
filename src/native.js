// @flow

import { createMessager } from './messager/index'

export default (getWebview: () => any) => {
    const { send, on, off, listener: handler } = createMessager(
        (data: any) => getWebview().postMessage(JSON.stringify(data))
    )
    return {
        send, on, off,
        listener: (e: any) => handler(JSON.parse(e.nativeEvent.data))
    }
}
