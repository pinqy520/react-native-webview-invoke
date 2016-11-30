// @flow
import * as React from 'react'
import { View, Text, TextInput, TouchableOpacity, WebView, AppRegistry } from 'react-native'
import createInvoke from './native.js'

class Test extends React.Component {
    state = {
        status: '[Ready] Waiting For WebView Ready',
        value: ''
    }
    webview: WebView
    invoke = createInvoke(() => this.webview)
    webInitialize = () => {
        this.setState({
            status: '[Ready] Done!'
        })
    }
    webWannaGet = () => this.state.value
    webWannaSet = (data) => {
        this.setState({
            status: `[Receive From Web] '${data}'`
        })
    }
    handleChange = (value: string) => {
        this.setState({ value })
    }
    handleGet = async () => {
        const info = await this.invoke.fn.get()
        this.setState({
            status: `[Get From Web] '${info}'`
        })
    }
    handleSet = async () => {
        this.setState({ status: '[Set To Web] Sending' })
        await this.invoke.fn.set(this.state.value)
        this.setState({ status: '[Set To Web] Success' })
    }
    componentDidMount() {
        this.invoke
            .define('init', this.webInitialize)
            .define('get', this.webWannaGet)
            .define('set', this.webWannaSet)
    }
    renderWebSide() {
        return (
            <View style={styles.webviewArea}>
                <WebView
                    ref={webview => this.webview = webview}
                    onMessage={this.invoke.listener}
                    source={require('./index.html')}
                    />
            </View>
        )
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
                    onChangeText={this.handleChange} />
                <View>
                    <TouchableOpacity style={styles.button} onPress={this.handleSet}><Text>Send To Web</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={this.handleGet}><Text>Get From Web</Text></TouchableOpacity>
                </View>
            </View>
        )
    }
    render() {
        return (
            <View style={styles.container}>
                {this.renderRNSide()}
                {this.renderWebSide()}
            </View >
        )
    }
}

const styles = {
    container: {
        paddingTop: 20,
        flex: 1
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    statusText: {
        fontSize: 12,
        marginBottom: 5,
        textAlign: 'center'
    },
    input: {
        height: 30,
        lineHeight: 30,
        margin: 5,
        padding: 5,
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 5
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
        borderStyle: 'solid'
    }
}


AppRegistry.registerComponent('RNWebViewMessager', () => Test);