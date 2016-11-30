// @flow

import { createMessager } from './messager/index'

export default (getWebview: () => any) => {
    const { bind, define, listener: handler } = createMessager(
        (data: any) => getWebview().postMessage(JSON.stringify(data))
    )
    return {
        bind, define,
        listener: (e: any) => handler(JSON.parse(e.nativeEvent.data))
    }
}
