'use strict';

// isProd is true when we run this command - npm run build
const isProd = (process.env.npm_lifecycle_event === 'build');
console.log('\x1b[96m isProduction- %s\x1b[0m \n', isProd);

const webpack = require('webpack');
const path = require('path');

// Webpack plugins
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Add more from here
// https://webpack.github.io/docs/configuration.html
module.exports = {
  entry: {
    app: './src/index.js',
    vendor: ['vue']
  },
  output: {
    path: path.resolve(__dirname, "dist"),// where to store build files
    publicPath: isProd ? 'https://ankurk91.github.com/lunch-order-app' : '',// to be used in index.html
    filename: 'js/[name].[hash].js' // build file name
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  module: {
    preLoaders: [],
    postLoaders: [],
    loaders: [
      // Catch all css, extract and store them to a separate file
      {
        test: /\.css$/,
        //loaders: ['style', 'css'],
        loader: isProd ? ExtractTextPlugin.extract('css') : 'style-loader!css-loader'
      },
      // Catch image files and base64 if bigger than 8k
      {
        test: /\.jpe?g$|\.gif$|\.png$/i,
        loader: 'url-loader?limit=8192&name=/img/[name].[hash].[ext]'
      },
      // Catch all fonts and store them to a separate folder
      {
        test: /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        loader: 'file-loader?name=/fonts/[name].[ext]?[hash]'
      }

    ]
  },
  plugins: [
    // Minify HTML + Inject assets in html
    new HtmlWebpackPlugin({
      inject: 'head',
      hash: false,
      template: './src/index.html',
      favicon: './src/favicon.png',
      minify: {
        removeComments: isProd,
        collapseWhitespace: isProd,
        removeAttributeQuotes: isProd,
        minifyJS: isProd,
        minifyCSS: isProd,
        minifyURLs: isProd
      }
    }),
    new webpack.DefinePlugin({
      API_CONFIG: JSON.stringify(require('./config.js')),
      'process.env': {
        NODE_ENV: isProd ? '"production"' : '"development"'
      }
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'js/[name].[hash].js')
  ],
  // Dev server related configs
  devServer: {
    contentBase: path.resolve(__dirname, "src"),
    port: 9000,
    host: 'localhost',
    open: true,
    inline: true,
    hot: true,
    noInfo: false,
    quiet: false,
    stats: 'errors-only',
    historyApiFallback: true,
  },
  devtool: isProd ? false : 'source-map',
  debug: isProd,
  watch: false,
  target: 'web'
};


var plugins = [];
if (isProd) {
  // Production only plugins
  plugins.push(
    // Minify JS files
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true
      },
      output: {
        comments: false
      }
    }),
    // Extract css and store them into a separate file
    new ExtractTextPlugin('css/styles.[hash].css'),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.BannerPlugin('Lunch Order App (c) Ankur Kumar')
  )
} else {
  // Development only plugins
  plugins.push(
    // Required when hot = true in dev server configs
    new webpack.HotModuleReplacementPlugin()
  );
}

module.exports.plugins = (module.exports.plugins || []).concat(plugins);
