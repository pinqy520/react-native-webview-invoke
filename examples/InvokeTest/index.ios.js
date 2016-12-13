/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View, WebView
} from 'react-native';

import createInvoke from 'react-native-webview-invoke/native'

export default class InvokeTest extends Component {
  webview: WebView
  invoke = createInvoke(() => this.webview)
  webInitialize = () => {
    alert('[Ready] Done!')
  }
  webWannaGet = () => 'Hi, Web!'
  webWannaSet = (data) => {
    alert(`[Receive From Web] '${data}'`)
  }
  componentDidMount() {
    this.invoke
      .define('init', this.webInitialize)
      .define('get', this.webWannaGet)
      .define('set', this.webWannaSet)
  }
  render() {
    return (
      <WebView ref={w => this.webview = w}
        source={require('./index.html')}
        onMessage={this.invoke.listener}
        />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('InvokeTest', () => InvokeTest);
