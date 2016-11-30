// @flow

import { createMessager } from './messager/index'

export default (getWebview: () => any) => {
    const { bind, define, listener: handler, fn } = createMessager(
        (data: any) => getWebview().postMessage(JSON.stringify(data))
    )
    return {
        bind, define, fn,
        listener: (e: any) => handler(JSON.parse(e.nativeEvent.data))
    }
}
