'use strict';
const path = require('path');
const webpack = require('webpack')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

var config = {
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
    extensions: ['.ts', '.tsx', '.js', '.json'],
    fallback: {
      'fs': require.resolve('memfs'),
    }
  }
};

// const mainLib = Object.assign({}, config, {
//   mode: 'production',
// 	entry: './dist/src/index.js',
// 	output: {
// 		filename: 'skyekiwi-protocol.js',
// 		path: path.resolve(__dirname, 'dist')
// 	},
// });

const browserTest = Object.assign({}, config, {
  mode: 'production',
  entry: './dist/test/index.js',
  output: {
    filename: 'browser.test.js',
    path: path.resolve(__dirname, 'browser.test')
  },
});

module.exports = [
  // mainLib, 
  browserTest,
];
