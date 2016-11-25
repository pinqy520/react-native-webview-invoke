import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
    entry: 'src/browser.js',
    plugins: [
        babel(babelrc()),
    ],
    external: external,
    targets: [
        {
            dest: 'dist/browser.js',
            format: 'umd',
            moduleName: 'WebViewMessager'
        },
        {
            dest: 'browser.js',
            format: 'cjs',
        }
    ]
};
