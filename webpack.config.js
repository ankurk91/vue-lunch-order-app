'use strict';

// isProd is true when we run this command - npm run prod
const isProd = (process.env.NODE_ENV === 'production');
console.log('\x1b[96m isProduction- %s\x1b[0m \n', isProd);

const webpack = require('webpack');
const path = require('path');

// Webpack plugins
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Add more from here
// https://webpack.github.io/docs/configuration.html
module.exports = {
  context: __dirname, //home directory for webpack
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  entry: {
    app: './src/index.js',
    vendor: ['vue', 'jquery', 'tether', 'bootstrap']
  },
  output: {
    path: path.resolve(__dirname, "dist"),// where to store build files
    publicPath: isProd ? 'https://ankurk91.github.io/lunch-order-app' : '',// to be used in index.html
    filename: "js/[name].[" + (isProd ? 'chunkhash' : 'hash') + "].js" // build file name
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {}
          // other vue-loader options go here
        }
      },
      // Catch js files and compile them to es5
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {
              'modules': false,
              'targets': {
                'browsers': ['> 2%'],
                uglify: true
              }
            }]
          ]
        },
        include: path.resolve(__dirname, 'src'),
        exclude: path.resolve(__dirname, 'node_modules'),
      },
      {
        test: /\.css$/,
        loader: isProd ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          loader: 'css-loader',
        }) : 'style-loader!css-loader',
      },
      // Catch image files and store them in separate folder
      // todo use url-loader to base64 small files
      {
        test: /\.jpe?g$|\.gif$|\.png$/i,
        loader: 'file-loader?name=[name].[hash].[ext]' + (isProd ? '&publicPath=/&outputPath=img/' : ''),
      },
      // Catch all fonts and store them to a separate folder
      {
        test: /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        loader: 'file-loader?name=[name].[ext]?[hash]' + (isProd ? '&publicPath=/&outputPath=fonts/' : ''),
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
        minifyURLs: isProd,
        // More options here
        // https://github.com/kangax/html-minifier#options-quick-reference
      }
    }),
    new webpack.DefinePlugin({
      API_CONFIG: JSON.stringify(require('./config.js')),
      'process.env': {
        NODE_ENV: isProd ? '"production"' : '"development"'
      }
    }),

    new webpack.ProvidePlugin({
      Vue: 'vue',
      'window.Vue': 'vue',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      "window.Tether": 'tether',
      "Tether": 'tether'
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor')
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
  performance: {
    hints: false
  },
  devtool: isProd ? false : '#cheap-eval-source-map',
  watch: false,
  target: 'web'
};


let plugins = [];
if (isProd) {
  // Production only plugins
  plugins.push(
    // Minify JS files
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        drop_debugger: true,
      },
      output: {
        comments: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    // Extract css and store them into a separate file
    new ExtractTextPlugin('css/styles.[hash].css'),
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
