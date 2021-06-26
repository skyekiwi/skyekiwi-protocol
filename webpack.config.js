'use strict';
const path = require('path');

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
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.json' ],
    fallback: {
      "crypto": require.resolve('crypto-browserify'),
      "stream": require.resolve("stream-browserify")
    }
  }
};
