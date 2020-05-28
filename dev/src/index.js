// @flow
import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  // WebView,
  AppRegistry
} from 'react-native';
import { WebView } from 'react-native-webview';
import createInvoke from './native.js';

export default class Test extends React.Component<any, any> {
  state = {
    status: '[Ready] Waiting For WebView Ready',
    value: '',
  };
  webview = React.createRef<WebView>();
  invoke = createInvoke(() => this.webview.current);
  _set = this.invoke.bind('set');
  _get = this.invoke.bind('get');
  webInitialize = () => {
    this.setState({
      status: '[Ready] Done!',
    });
  };
  webWannaGet = () => this.state.value;
  webWannaSet = (data: string) => {
    this.setState({
      status: `[Receive From Web] '${data}'`,
    });
  };
  handleChange = (value: string) => {
    this.setState({ value });
  };
  handleGet = async () => {
    const info = await this._get();
    this.setState({
      status: `[Get From Web] '${info}'`,
    });
  };
  handleSet = async () => {
    this.setState({ status: '[Set To Web] Sending' });
    await this._set(this.state.value);
    this.setState({ status: '[Set To Web] Success' });
  };
  _onMessage = (e: any) => {
    // console.warn(e.nativeEvent.data)
    this.invoke.listener(e);
  };
  componentDidMount() {
    this.invoke.define('init', this.webInitialize).define('get', this.webWannaGet).define('set', this.webWannaSet);
  }
  renderWebSide() {
    return (
      <View style={styles.webviewArea}>
        <WebView
          cacheEnabled={false} // just on dev
          ref={this.webview}
          onMessage={this._onMessage}
          source={{ html }}
        />
      </View>
    );
  }
  renderRNSide() {
    return (
      <View style={styles.rnArea}>
        <Text style={styles.titleText}>React Naitve Side: </Text>
        <Text style={styles.statusText}>{this.state.status}</Text>
        <TextInput
          style={styles.input}
          placeholder="Some..."
          value={this.state.value}
          onChangeText={this.handleChange}
        />
        <View>
          <TouchableOpacity style={styles.button} onPress={this.handleSet}>
            <Text>Send To Web</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.handleGet}>
            <Text>Get From Web</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  render() {
    return (
      <View style={styles.container}>
        {this.renderRNSide()}
        {this.renderWebSide()}
      </View>
    );
  }
}

const styles = {
  container: {
    paddingTop: 20,
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  input: {
    margin: 5,
    padding: 5,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
  },
  rnArea: {
    flex: 1,
    borderWidth: 4,
    borderColor: '#666',
    borderStyle: 'solid',
    padding: 5,
  },
  button: {
    borderColor: '#000',
    borderWidth: 1,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    borderRadius: 15,
  },
  webviewArea: {
    flex: 1,
    borderWidth: 4,
    borderColor: '#000',
    borderStyle: 'solid',
  },
};

const html = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <title>test</title>
    <style>
        .status {
            font-size: 12px;
            text-align: center;
        }

        .input {
            width: 100%;
            box-sizing: border-box;
            line-height: 25px;
            margin: 5px 0;
        }

        button {
            display: block;
            width: 100%;
            box-sizing: border-box;
            margin: 5px 0;
        }
    </style>
</head>

<body>
    <h1>Web Side:</h1>
    <p class="status">[Loading] Waiting for bridge ready</p>
    <input class="input" type="text" placeholder="Some..." />
    <button class="set" label="Send To RN">Send To RN</button>
    <button class="get" label="Get From RN">Get From RN</button>

    <script src="https://cdn.bootcss.com/es6-promise/4.0.5/es6-promise.auto.min.js"></script>
    <!-- TEST
    <script src="https://tb1.bdstatic.com/tb/libs/rnwi-browser.js"></script>
    -->
    <! --  change the 172.20.10.2:8080  with your static server adress -->
    <script src="http://127.0.0.1:8080/browser.umd.js?id=3"></script>

    <script>
        (function () {
            var $input = document.querySelector('.input')
            var $status = document.querySelector('.status')

            var getFromNative = window.WebViewInvoke.bind('get')
            var setToNative = window.WebViewInvoke.bind('set')
            var webReady = window.WebViewInvoke.bind('init')
            function nativeWannaGet() {
                return $input.value
            }
            function nativeWannaSet(data) {
                $status.innerText = '[Receive From RN] "' + data + '"'
            }
            window.WebViewInvoke.define('get', nativeWannaGet)
            window.WebViewInvoke.define('set', nativeWannaSet)
            webReady().then(function () {
                $status.innerText = '[Ready] Done!'
            })
            document.querySelector('.set').addEventListener('click', function () {
                $status.innerText = '[Set To RN] Sending'
                setToNative($input.value)
                    .then(function () {
                        $status.innerText = '[Set To RN] Success'
                    })
            })
            document.querySelector('.get').addEventListener('click', function () {
                getFromNative()
                    .then(function (data) {
                        $status.innerText = '[Get From RN] "' + data + '"'
                    })
            })
            window.WebViewInvoke.addEventListener('send', function (params) {
                console.log('send', params, window.WebViewInvoke.isConnect())
            })
            window.WebViewInvoke.addEventListener('receive', function (params) {
                console.log('receive', params, window.WebViewInvoke.isConnect())
            })
        })()
    </script>
</body>

</html>
`;
