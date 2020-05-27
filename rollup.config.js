import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const plugins = [
  resolve(), // so Rollup can find `ms`
  commonjs(), // so Rollup can convert `ms` to an ES module
  babel({
    babelrc: false,
    presets: ['@babel/preset-env'],
  }),
];

const createConfig = (umd, name, input = name) => ({
  input: `src/${input}.js`,
  output: [
    {
      name: umd,
      file: `dist/${name}.umd.js`,
      format: 'umd',
    },
    {
      file: `dist/${name}.common.js`,
      format: 'cjs',
    },
  ],
  plugins,
});

export default [
  createConfig('WebViewInvoke', 'browser'),
  createConfig('WebViewCreateInvoke', 'factory', 'messager/index'),
  {
    input: 'src/native.js',
    output: {
      file: 'dev/src/native.js',
      format: 'es',
    },
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
    ],
  },
];
