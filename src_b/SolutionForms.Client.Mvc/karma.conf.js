var webpack = require('./webpack.config'), path = require('path');

module.exports = function(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-tap'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-babel-preprocessor')
    ],

    basePath: '',
    frameworks: ['tap'],
    files: ['Tests/*.js'],
    //files: ['Tests/*.js', 'App/tenant_customizations/**/Tests/*.js'],

    preprocessors: {
      'Tests/**/*.js': ['webpack', 'sourcemap'],
      'App/tenant_customizations/**/Tests/**/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      node: {
        fs: 'empty'
      },

      resolve: webpack.resolve,

      devtool: 'inline-source-map',

      module: {
        loaders: webpack.module.loaders.concat([
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader'
          }
        ])
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    webpackServer: {
      noInfo: true
    },

    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};