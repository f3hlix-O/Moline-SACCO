const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
    vm: require.resolve('vm-browserify'),
    http: require.resolve('stream-http'),
    querystring: require.resolve('querystring-es3'),
    fs: false,  // fs is not typically polyfilled for the browser
    zlib: false, // Set to false if not needed in the browser
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  return config;
};
