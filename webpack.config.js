'use strict';
const path = require('path');
const buffer = require("buffer")
const webpack = require('webpack')
module.exports = {
  // devtool: 'inline-source-map',
  mode: 'development',
	entry: './dist/index.browser.js',
	output: {
		filename: 'skyekiwi.browser.js',
		path: path.resolve(__dirname, 'dist')
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
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }) 
  ],
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.json' ],
    fallback: {
      "crypto": require.resolve('crypto-browserify'),
      "stream": require.resolve("stream-browserify")
    }
  }
};
