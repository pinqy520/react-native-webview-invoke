export function createEventBus() {
    const listeners = {
        send: [],
        receive: [],
        ready: []
    }

    function addEventListener(name, cb) {
        if (name in listeners) {
            const fns = listeners[name]
            if (fns.indexOf(cb) < 0) {
                fns.push(cb)
            }
        }
    }

    function removeEventListener(name, cb) {
        if (name in listeners) {
            const fns = listeners[name]
            const idx = fns.indexOf(cb)
            if (idx >= 0) {
                fns.splice(idx, 1)
            }
        }
    }

    function emitEvent(name, event) {
        if (name in listeners) {
            listeners[name].forEach(fn => fn(event))
        }
    }
    return { addEventListener, removeEventListener, emitEvent }
}