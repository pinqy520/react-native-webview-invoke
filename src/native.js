// @flow

import { createMessager } from './messager/index'

export default (getWebview: () => any) => {
    const { bind, define, listener: handler, fn, addEventListener, removeEventListener, isConnect } = createMessager(
        (data: any) => getWebview().postMessage(JSON.stringify(data))
    )
    return {
        bind, define, fn,
        listener: (e: any) => {
            let data: any
            try {
                // FIX: webpack hotloader will triger this
                data = JSON.parse(e.nativeEvent.data)
            } catch (e) { }
            data && handler(data)
        },
        addEventListener, removeEventListener, isConnect
    }
}
