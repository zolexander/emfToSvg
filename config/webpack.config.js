const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist/umd'),
    filename: 'index.js',
    library: 'exampleTypescriptPackage',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts(x*)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'config/tsconfig.umd.json',
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
    fallback: {
      "os": require.resolve("os-browserify/browser"),
      "fs": require.resolve('browserify-fs'),
      "tls": false,
      "net": false,
      "path": require.resolve("path-browserify"),
      "zlib": require.resolve('browserify-zlib'),
      "http": false,
      "https": false,
      "stream": require.resolve('stream-browserify'),
      "crypto": false,
      "events": require.resolve("events/"),
      "util": require.resolve("util/"),
      "sys": require.resolve('util/'),
      "assert": require.resolve('assert/'),
      "buffer": require.resolve("buffer/")
       //if you want to use this module also don't forget npm i crypto-browserify
    }
  },
}
