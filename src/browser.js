import { createMessager } from './messager/index'

let _postMessage = null

const isBrowser = typeof window !== 'undefined'

const { bind, define, listener, ready, fn, addEventListener, removeEventListener, isConnect } = createMessager(
  data => isBrowser && _postMessage && _postMessage(JSON.stringify(data))
)

/*Handle only the messages which are of structure rn-webview-invoke.
Ignore messages which came from other sources.

Ex: In case of vimeo player, vimeo player will throw some self messages.
These messages need to be ignored*/
const handleMessage = (message) => {
  let jsonMessage = undefined;

  if (typeof message === 'object') {
    jsonMessage = message;
  } else if (typeof message === 'string') {
    try {
      jsonMessage = JSON.parse(message)
    } catch (error) {}
  }

  if ((jsonMessage) && (jsonMessage.command || jsonMessage.reply)) {
    listener(jsonMessage);
  }
}

if (isBrowser) {

  // react-native
  let originalPostMessage = window.originalPostMessage

  if (originalPostMessage) {
    _postMessage = (...args) => window.postMessage(...args)
    ready()
  } else {
    const descriptor = {
      get: function() {
        return originalPostMessage
      },
      set: function(value) {
        originalPostMessage = value
        if (originalPostMessage) {
          _postMessage = (...args) => window.postMessage(...args)
          setTimeout(ready, 50)
        }
      }
    }
    Object.defineProperty(window, 'originalPostMessage', descriptor)
  }

  // react-native-webview
  let ReactNativeWebView = window.ReactNativeWebView

  if (ReactNativeWebView) {
    _postMessage = (...args) => window.ReactNativeWebView.postMessage(...args)
    ready()
  } else {
    const descriptor = {
      get: function() {
        return ReactNativeWebView
      },
      set: function(value) {
        ReactNativeWebView = value
        if (ReactNativeWebView) {
          _postMessage = (...args) => window.ReactNativeWebView.postMessage(...args)
          setTimeout(ready, 50)
        }
      }
    }
    Object.defineProperty(window, 'ReactNativeWebView', descriptor)
  }

  // onMessage react native
  window.document.addEventListener('message', e => originalPostMessage && handleMessage(e.data))
  // onMessage react-native-webview 
  window.addEventListener('message', e => ReactNativeWebView && handleMessage(e.data))
  // onMessage react-native-webview  with android
  window.document.addEventListener('message', e => ReactNativeWebView && handleMessage(e.data));

}

export default {
  bind,
  define,
  fn,
  addEventListener,
  removeEventListener,
  isConnect
}