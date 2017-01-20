import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
    entry: 'src/messager/index.js',
    plugins: [
        babel(babelrc()),
    ],
    external: external,
    targets: [
        {
            dest: 'dist/factory.umd.js',
            format: 'umd',
            moduleName: 'WebViewCreateInvoke'
        },
        {
            dest: 'dist/factory.common.js',
            format: 'cjs',
        }
    ]
};
