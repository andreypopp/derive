let path = require('path');
let webpack = require('webpack');

module.exports = {
  entry: {
    react_dev: [
      'webpack-dev-server/client',
      'webpack/hot/dev-server',
      'react',
      'react-dom'
    ]
  },
  output: {
    path: __dirname,
    filename: '[name].js',
    library: '[name]_[hash]',
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '[name]-manifest.json'),
      name: '[name]_[hash]'
    })
  ]
};
