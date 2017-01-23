// @flow


export function createEventBus() {
    const listeners: { [key: string]: Function[] } = {
        send: [],
        receive: [],
        ready: []
    }

    function addEventListener<T>(name: string, cb: (event: T) => any) {
        if (name in listeners) {
            const fns = listeners[name]
            if (fns.indexOf(cb) < 0) {
                fns.push(cb)
            }
        }
    }

    function removeEventListener(name: string, cb: any) {
        if (name in listeners) {
            const fns = listeners[name]
            const idx = fns.indexOf(cb)
            if (idx >= 0) {
                fns.splice(idx, 1)
            }
        }
    }

    function emitEvent<T>(name: string, event: T) {
        if (name in listeners) {
            listeners[name].forEach(fn => fn(event))
        }
    }
    return { addEventListener, removeEventListener, emitEvent }
}

// export const GlobalEventBus = createEventBus()