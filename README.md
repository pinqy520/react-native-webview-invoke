# react-native-webview-invoke

[中文文档](https://github.com/pinqy520/react-native-webview-invoke/wiki/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3)

[![npm version](https://badge.fury.io/js/react-native-webview-invoke.svg)](https://badge.fury.io/js/react-native-webview-invoke)

> Invoke functions between React Native and WebView directly

Just like: 

``` javascript
// Side A
const answer = await ask(question) 

// Side B
function ask(question) { return 'I don\'t know' }
```

Before using like that, you should firstly define the function you want to expose.

``` javascript
// Side A
const ask = invoke.bind('ask')

// Side B
invoke.define('ask', ask)
```

![rnwm](https://cloud.githubusercontent.com/assets/5719833/20641896/1fb6431c-b43d-11e6-83ec-3fe78e49220f.gif)

## Installation

```
$ npm install react-native-webview-invoke --save
```

Requires：

- React Native >= 0.37

## Basic Usage

There are two sides: native and web.

### React Native Side

Import

``` javascript
import createInvoke from 'react-native-webview-invoke/native'
```

Create `invoke`

``` javascript
class SomePage extends React.Component {
    webview: WebView
    invoke = createInvoke(() => this.webview)
    render() {
        return <Webview
            ref={webview => this.webview = webview}
            onMessage={this.invoke.listener}
            source={require('./index.html')}
            />
    }
}
```

Now, we can start to expose functions for Web, and get the function from Web. (See Start to use)

### Web Side

Import

``` javascript
import invoke from 'react-native-webview-invoke/browser'
```

Or use `<script>` in `.html`

``` html
<script src="./node_modules/react-native-webview-invoke/browser.js"></script>
<script>
var invoke = window.WebViewInvoke
</script>
```

### Start to use

For better illumination, we define two sides named `A` and `B`. each of them can be React Native or Web, and if `A` is React Native, then `B` is Web.

Assume that there are some functions in A side.

``` javascript
function whatIsTheNameOfA() {
    return 'A'
}

function tellAYouArea(someone: string, prefix: string) {
    return 'Hi, ' + prefix + someone + '!'
}
```

Expose them for B side.

``` javascript
invoke
    .define('whatIsTheNameOfA', whatIsTheNameOfA)
    .define('tellAYouArea', tellAYouArea)
```

---

OK, Go to the B side:

Firstly, bind some functions which exposed from `A`.

``` javascript
const whatIsTheNameOfA = invoke.bind('whatIsTheNameOfA')
const tellAYouArea = invoke.bind('tellAYouArea')
```

Now, we can use them.

``` javascript
await whatIsTheNameOfA()
// 'A'
await tellAYouArea('B', 'Mr.')
// 'Hi, Mr.B'
```

In addition, you can use them without definition too.

``` javascript
await invoke.fn.whatIsTheNameOfA()
// 'A'
await invoke.fn.tellAYouArea('B', 'Mr.')
// 'Hi, Mr.B'
```

## API

### `createInvoke(getWebViewInstance)`

> (RN only) create `invoke` with the `Webview` instance.

Args:

- getWebViewInstance [`() => React.WebView`] getter for `Webview` instance

Return:

- invoke [`invoke`] invoke object

### `invoke.define(name, fn)`

> expose function to another side.

Args:

- name [`string`] function name
- fn [`Function`] 

### `invoke.bind(name)`

> get function from another side

Args:

- name [`string`] function name

Return:

[`(...args: any[]) => Promise<any>`] function


### `invoke.fn`

> All functions that defined at the other side

用法

``` javascript
// A side
invoke.define('test', test)

// B side
invoke.fn.test()
```


### `invoke.listener`

> (RN only) the handler for the `onMessage` property of `WebView` element.

Usage:

``` javascript
<WebView onMessage={invoke.listener} />
```




