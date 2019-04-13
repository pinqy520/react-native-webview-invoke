import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    {
        input: 'src/browser.js',
        output: [{
            name: 'WebViewInvoke',
            file: 'dist/browser.umd.js',
            format: 'umd'
        }, {
            file: 'dist/browser.common.js',
            format: 'cjs'
        }],
        plugins: [
            resolve(), // so Rollup can find `ms`
            commonjs() // so Rollup can convert `ms` to an ES module
        ]
    },

    {
        input: 'src/messager/index.js',
        output: [{
            name: 'WebViewCreateInvoke',
            file: 'dist/factory.umd.js',
            format: 'umd'
        }, {
            file: 'dist/factory.common.js',
            format: 'cjs'
        }],
        plugins: [
            resolve(), // so Rollup can find `ms`
            commonjs() // so Rollup can convert `ms` to an ES module
        ]
    },

    {
        input: 'src/native.js',
        output: {
            file: 'dev/src/native.js',
            format: 'es'
        },
        plugins: [
            resolve(), // so Rollup can find `ms`
            commonjs() // so Rollup can convert `ms` to an ES module
        ]
    }
];
