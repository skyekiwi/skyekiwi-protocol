'use strict';
const path = require('path');
const webpack = require('webpack')
module.exports = {
  // devtool: 'inline-source-map',
  mode: 'production',
	entry: './browser.test/index.test.ts',
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
