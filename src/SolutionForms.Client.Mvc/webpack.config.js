var path = require('path'),
    webpack = require('webpack'),
    WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  context: localPath('.'),
  
  entry: {
    'dataform-designer': 'viewModels/dataformDesignerViewModel',
    'dataform-live': 'viewModels/dataformLiveViewModel',
    'admin-payment': 'viewModels/managePaymentsViewModel',
    'core': ['ko',
      bower('knockout-postbox/build/knockout-postbox'),
      bower('knockout.punches/knockout.punches'),
      localScripts('knockout-projections'),
      localScripts('kolite-local/knockout.command'),
      bower('bootstrap/dist/js/bootstrap'),
      'toastr',
      bower('toastr/toastr.css'),
      //note: the page.js package depends on `path-to-regexp` which I couldn't find on bower, after much trying
      localPath('node_modules/page/page'),
      'koValidation'
    ]
  },
  output: {
    path: localPath('wwwroot/js/build'),
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js'
  },
  resolve: {
    modules: [
        bower(),
        nodeModules()
    ],
    alias: {
      // application assets
      viewModels: appDir('viewModels'),
      models: appDir('models'),
      components: appDir('components'),
      containers: appDir('components/form-containers'),
      services: appDir('services'),
      plugins: appDir('plugins'),
      customizations: appDir('tenant_customizations'),
      App: appDir('.'),
      app: appDir('.'),
      controls: appDir('components/field-controls'),
      styles: localPath('css'),
      bindings: appDir('bindings'),
      koExtenders: js('ko-extenders'),

      // framework assets
      ko: 'knockout',
      jquery: bower('jquery/dist/jquery'),
      'jquery-ui': bower('jquery-ui/ui'),
      knockout: bower('knockout/dist/knockout.debug'),

      // other 3rd party utilities
      koValidation: bower('Knockout-Validation/Dist/knockout.validation'),
      'ko.bs.collapse': localScripts('knockout-bootstrap-collapse-local/knockout.bootstrap.collapse'),
      'ko.sortable': bower('knockout-sortable/build/knockout-sortable'),
      'kendoui': bower('kendo-ui-core/js'),
      'kendoui-core': bower('kendo-ui-core/js/kendo.core.min'),
      'kendoui-styles': bower('kendo-ui-core/styles/'),
      moment: bower('moment/min/moment.min'),
      toastr: bower('toastr/toastr'),
      lodash: nodeModules('lodash'),
      lib: bower(),
      'local': localScripts(),
    }
  },
  plugins: [
      new webpack.optimize.CommonsChunkPlugin({ name: 'core', filename: 'core.bundle.js' }),
      new webpack.IgnorePlugin(/\.map$/),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jquery': 'jquery',
        'window.jQuery': 'jquery',
        wptoast: new WebpackNotifierPlugin()
      }),
      new webpack.LoaderOptionsPlugin({
          options: {
              color: true,
              progress: true
          }
      })
  ],
  module: {
    rules: [
        { test: /\.html$/, loader: 'raw-loader' },
        { test: /\.css$/, use: ['style-loader', { loader: 'css-loader', options: { sourceMap: true } }] },
        {
            test: /\.js?$/, exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader'
            }
        },
        {
            test: /knockout(\.debug)?\.js$/,
            use: [ 'imports-loader?exports=>false&define=>false', 'exports-loader?ko' ]
        },
        { test: /knockout\.command\.js/, use: 'imports-loader?define=>false,require=>false' },
        { test: /knockout\.validation(\.min)?\.js/, use: 'imports-loader?define=>false,require=>false' },

        // although ko is globally exported, the following modules can handle resolving the ko reference via the require function.
        //{ test: /knockout-postbox(\.min)?\.js$/, loader: 'imports?module=>false&define=>false' },
        //{ test: /knockout\.punches\.js$/, loader: 'imports?module=>false&define=>false' },
        //{ test: /knockout\.bootstrap\.collapse\.js/, loader: 'imports?require=>false&define=>false' },
        //{ test: /knockout-sortable(\.min)?\.js/, loader: 'imports?require=>false&define=>false' },
        //{ test: /knockout-kendo(\.min)?\.js$/, loader: 'imports?require=>false' },
        
        { test: /kendo\-ui\-core[\///].*\.js$/, loader: 'imports-loader?jQuery=>jquery' },
        { test: /kendoui\.woff?(\?v=[0-9]\.[0-9](\.[0-9])?)?$/, loader: "file-loader" },
        { test: /KendoUIGlyphs\.(ttf|woff|eot|svg)(\?\w*)?$/, loader: "url-loader" },

        { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader", options: { limit: 10000, mimetype: 'application/font-woff' } },
        { test: /\.(ttf|eot|svg|png|gif|jpe?g)(\?v=[0-9]\.[0-9](\.[0-9])?)?$/, loader: "url-loader" }
    ]
  },

  node: {
    fs: 'empty'
  }
}

function localPath(loc) { return path.join(__dirname, loc || ''); }
function appDir(loc) { return path.join(localPath('App'), loc || ''); }
function bower(loc) { return path.join(localPath('bower_modules'), loc || ''); }
function localScripts(loc) { return path.join(appDir('lib'), loc || ''); }
function cssDir(loc) { return path.join(localPath('wwwroot/css'), loc || ''); }
function js(loc) { return path.join(localPath('wwwroot/js'), loc || ''); }
function nodeModules(loc) { return path.join(localPath('node_modules'), loc || ''); }