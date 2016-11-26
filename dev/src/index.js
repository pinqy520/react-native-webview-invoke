// @flow
import * as React from 'react'
import { View, Text, TextInput, TouchableOpacity, WebView, AppRegistry } from 'react-native'
import createMessager from './native.js'

class Test extends React.Component {
    state = {
        status: '[Ready] Waiting For WebView Ready',
        value: ''
    }
    webview: WebView
    messager = createMessager(() => this.webview)
    handleChange = (value: string) => {
        this.setState({ value })
    }
    handleGet = async () => {
        const info = await this.messager.send('get')
        this.setState({
            status: `[Get From Web] '${info}'`
        })
    }
    handleSet = async () => {
        this.setState({ status: '[Set To Web] Sending' })
        await this.messager.send('set', this.state.value)
        this.setState({ status: '[Set To Web] Success' })
    }
    componentDidMount() {
        this.messager.on('init', data => {
            this.setState({
                status: '[Ready] Done!'
            })
        })
        this.messager.on('get', data => {
            return this.state.value
        })
        this.messager.on('set', data => {
            this.setState({
                status: `[Receive From Web] '${data}'`
            })
        })
    }
    renderWebView() {
        return (
            <View style={styles.webviewArea}>
                <WebView
                    ref={webview => this.webview = webview}
                    onMessage={this.messager.listener}
                    source={require('./index.html')}
                    />
            </View>
        )
    }
    render() {
        return (
            <View style={styles.container}>
                <View>
                    <Text>React Naitve Side: </Text>
                    <Text>{this.state.status}</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Some..."
                    value={this.state.value}
                    onChangeText={this.handleChange} />
                <View>
                    <TouchableOpacity onPress={this.handleSet}><Text>Send To Web</Text></TouchableOpacity>
                    <TouchableOpacity onPress={this.handleGet}><Text>Get From Web</Text></TouchableOpacity>
                </View >
                {this.renderWebView()}
            </View >
        )
    }
}

const styles = {
    container: {
        paddingTop: 20,
        flex: 1
    },
    input: {
        height: 20,
    },
    webviewArea: {
        flex: 1,
        borderWidth: 4,
        borderColor: '#000',
        borderStyle: 'solid'
    }
}


AppRegistry.registerComponent('RNWebViewMessager', () => Test);