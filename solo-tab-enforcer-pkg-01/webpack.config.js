const path = require('path');

module.exports = {
  entry: {
    'solo-tab-enforcer': './src/index.js',
    'solo-tab-enforcer.min': './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'SoloTabEnforcer',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};
