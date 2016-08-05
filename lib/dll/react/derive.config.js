let path = require('path');
let webpack = require('webpack');

function ref(pkg) {
  return path.join(__dirname, '../../../node_modules', pkg);
}

module.exports = {
  entry: {
    __react: [
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
  resolve: {
    alias: {
      'react': ref('react'),
      'react-dom': ref('react-dom'),
      'webpack-dev-server/client': ref('webpack-dev-server/client'),
      'webpack/hot/dev-server': ref('webpack/hot/dev-server'),
    }
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '[name]-manifest.json'),
      name: '[name]_[hash]'
    })
  ]
};
