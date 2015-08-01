var webpack = require('webpack');
var prod = process.env.PRODUCTION || false;

// The uglify plugin runs even if it's not in the plugin list.
// Only call 'new' in the prod branch by creating it lazily.
var prodPlugins = function() { return [
  new webpack.optimize.UglifyJsPlugin({minimize: true})
]};

var plugins = prod ? prodPlugins() : [];
var entry = prod ? ['./js/App.js'] : ['webpack/hot/dev-server', './js/App.js'];

module.exports = {
  entry: entry,

  output: {
    path: './public/build',
    publicPath: '/build',
    filename: 'bundle.js'
  },

  plugins: plugins,

  module: {
    loaders: [
      // ES6 + JSX
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },

      // Bootstrap (https://github.com/bline/bootstrap-webpack)
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
      { test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/octet-stream" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=image/svg+xml" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },

      // Stylesheets
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.sass$/, loader: 'style!css!sass' },
      { test: /\.scss$/, loader: 'style!css!scss' },

    ]
  }
};
