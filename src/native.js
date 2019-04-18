import { createMessager } from './messager/index'

export default getWebview => {
    const { bind, define, listener: handler, fn, addEventListener, removeEventListener, isConnect } = createMessager(
        (data) => getWebview().postMessage(JSON.stringify(data))
    )
    return {
        bind, define, fn,
        listener: evt => {
            let data
            try {
                // FIX: webpack hotloader will triger this
                data = JSON.parse(evt.nativeEvent.data)
            } catch (e) {
                __DEV__ && console.warn(e.message, evt.nativeEvent.data)
            }
            data && handler(data)
        },
        addEventListener, removeEventListener, isConnect
    }
}
