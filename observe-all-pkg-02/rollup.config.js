const pluginTerser = require('@rollup/plugin-terser');
const terserFn = pluginTerser.default || pluginTerser.terser || pluginTerser;

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/observe-all.js',
    format: 'umd',
    name: 'ObserveAll',
  },
  plugins: [terserFn()],
};
