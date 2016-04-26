var webpack = require('webpack'), path = require('path');

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
    files: ['App/tenant_customizations/**/Tests/*.js'],

    preprocessors: {
      'App/tenant_customizations/**/Tests/**/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      node: {
        fs: 'empty'
      },

      resolve: {
        alias: {
          moment: lib('moment/min/moment.min'),
        }
      },

      devtool: 'inline-source-map',

      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader'
          }
        ]
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
    singleRun: false,
  })
};

function localPath(loc) { return path.join(__dirname, loc || ''); }
function appDir(loc) { return path.join(localPath('App'), loc || ''); }
function lib(loc) { return path.join(localPath('wwwroot/lib'), loc || ''); }
