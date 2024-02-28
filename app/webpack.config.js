//@ts-check

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const appConfig = {
  target: 'web',
  mode: 'none',
  entry: './app/src/index.ts',
  output: {
    path: path.resolve(__dirname, '..', 'dist', 'app'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    alias: {
      process: "process/browser"
    } ,
    fallback:  { 
      "zlib": require.resolve("browserify-zlib"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "url": require.resolve("url/"),
      "assert": require.resolve("assert/"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify")    
   }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log', // enables logging required for problem matchers
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'css'), to: path.resolve(__dirname, '..', 'dist', 'app', 'css') },
        { from: path.resolve(__dirname, 'img'), to: path.resolve(__dirname, '..', 'dist', 'app', 'img') },
        { from: path.resolve(__dirname, '..', 'data'), to: path.resolve(__dirname, '..', 'dist', 'data') },
      ],
    }),
    new HtmlWebpackPlugin({
      title: 'GrML',
      filename: 'index.html',
      template: path.resolve(__dirname, 'index.html'),
    }),
  ],
};

module.exports = [ appConfig ];