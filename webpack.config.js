'use strict';
const path = require('path');
const webpack = require('webpack')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  // devtool: 'inline-source-map',
  mode: 'production',
	entry: './dist/browser.test/index.test.js',
	output: {
		filename: 'test.browser.js',
		path: path.resolve(__dirname, 'browser.test')
	},
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: [
    new NodePolyfillPlugin()
  ],
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.json' ],
    fallback: {
      // "crypto": require.resolve('crypto-browserify'),
      // "stream": require.resolve("stream-browserify"),
      'fs': require.resolve('memfs'),
      // 'path': require.resolve("path-browserify"),
      // "assert": require.resolve("assert/")
    }
  }
};
