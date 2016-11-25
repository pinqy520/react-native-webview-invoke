// @flow
import * as React from 'react'
import { View, WebView, AppRegistry } from 'react-native'
import createMessager from './native.js'

class Test extends React.Component {
    webview: WebView
    messager = createMessager(() => this.webview)
    render() {
        return (
            <View style={styles.container}>
                <WebView
                    ref={webview => this.webview = webview}
                    onMessage={this.messager.listener}
                    source={require('./index.html')}
                    />
            </View>
        )
    }
}

const styles = {
    container: {
        flex: 1
    }
}


AppRegistry.registerComponent('RNWebViewMessager', () => Test);