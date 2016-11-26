# react-native-webview-messager

> react-native-webview-messager provides a useful API using async / await for easier communicating with react native webview. 

Jusk like:

``` javascript
// one side
const answer = await messager.send('ask', question) 

// another side
messager.on('ask', question => 'I don\'t know')
```

![rnwm](https://cloud.githubusercontent.com/assets/5719833/20641896/1fb6431c-b43d-11e6-83ec-3fe78e49220f.gif)

## installation

```
$ npm install react-native-webview-messager --save
```

Require

- React Native >= 0.37

## basic usage

There are two side of the lib

### react-native side

Import the `createMessager` function

``` javascript
import createMessager from 'react-native-webview-messager/native'
```

Init the `messager`

``` javascript
class SomePage extends React.Component {
  webview
  messager = createMessager(() => this.webview)
  render() {
    return <Webview
      ref={webview => this.webview = webview}
      onMessage={this.messager.listener}
    />	
  }
}

```

### web side

Require

``` javascript
import messager from 'react-native-webview-messager/browser'
```

Or 

``` html
<script src="//example.com/rnwm-browser.js" ></script>
```










