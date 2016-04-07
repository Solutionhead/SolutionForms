var path = require('path'),
    webpack = require('webpack'),
    WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  context: localPath('.'),
  progress: true,
  color: true,

  entry: {
    'dataform-designer': 'viewModels/dataformDesignerViewModel',
    'dataform-live': 'viewModels/dataformLiveViewModel',
    //'home': 'viewModels/homeViewModel',
    'core': ['ko',
      lib('knockout-postbox/build/knockout-postbox'),
      lib('knockout.punches/knockout.punches'),
      lib('kolite-local/knockout.command'),
      lib('bootstrap/dist/js/bootstrap'),
      'toastr',
      lib('toastr/toastr.css'),
      //note: the page.js package depends on `path-to-regexp` which I couldn't find on bower, after much trying
      localPath('node_modules/page/page')
    ]
  },
  output: {
    path: localPath('wwwroot/js/build'),
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js'
  },
  resolve: {
    fallback: lib(),
    alias: {
      // application assets
      viewModels: appDir('viewModels'),
      models: appDir('models'),
      components: appDir('components'),
      services: appDir('services'),
      plugins: appDir('plugins'),
      customizations: appDir('tenant_customizations'),
      App: appDir('.'),
      app: appDir('.'),
      controls: appDir('components/entryFieldControls'),
      styles: localPath('css'),
      bindings: appDir('bindings'),
      koExtenders: js('ko-extenders'),

      // framework assets
      ko: 'knockout',
      jquery: lib('jquery/dist/jquery'),
      'jquery-ui': lib('jquery-ui/ui'),
      knockout: lib('knockout/dist/knockout.debug'),

      // other 3rd party utilities
      koValidation: lib('Knockout-Validation/Dist/knockout.validation'),
      'ko.bs.collapse': lib('knockout-bootstrap-collapse-local/knockout.bootstrap.collapse'),
      'ko.sortable': lib('knockout-sortable/build/knockout-sortable'),
      //'ko.kendo': lib('knockout-kendo/build/knockout-kendo.min'),
      'kendoui': lib('kendo-ui-core/js'),
      'kendoui-core': lib('kendo-ui-core/js/kendo.core.min'),
      'kendoui-styles': lib('kendo-ui-core/styles/'),
      'underscore': lib('underscore/underscore-min'),
      moment: lib('moment/min/moment.min'),
      toastr: lib('toastr/toastr'),
      lodash: nodeModules('lodash'),
      lib: lib(),
    }
  },
  plugins: [
      //https://github.com/webpack/docs/wiki/optimization
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.CommonsChunkPlugin('core', 'core.bundle.js'),
      new webpack.IgnorePlugin(/\.map$/),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        wptoast: new WebpackNotifierPlugin()
      })
  ],
  module: {
    loaders: [
        { test: /\.html$/, loader: 'raw' },
        { test: /\.css$/, loader: 'style!css?sourceMap' },

        { test: /knockout(\.debug)?\.js$/, loader: 'imports?exports=>false&define=>false!exports?ko' },
        { test: /knockout\.command\.js/, loader: 'imports?require=>false&define=>false' },
        { test: /knockout\.validation(\.min)?\.js/, loader: 'imports?require=>false&define=>false' },

        // although ko is globally exported, the following modules can handle resolving the ko reference via the require function.
        //{ test: /knockout-postbox(\.min)?\.js$/, loader: 'imports?module=>false&define=>false' },
        //{ test: /knockout\.punches\.js$/, loader: 'imports?module=>false&define=>false' },
        //{ test: /knockout\.bootstrap\.collapse\.js/, loader: 'imports?require=>false&define=>false' },
        //{ test: /knockout-sortable(\.min)?\.js/, loader: 'imports?require=>false&define=>false' },
        //{ test: /knockout-kendo(\.min)?\.js$/, loader: 'imports?require=>false' },
        
        { test: /kendo\-ui\-core[\///].*\.js$/, loader: 'imports?jQuery=jquery' },
        { test: /kendoui\.woff?(\?v=[0-9]\.[0-9](\.[0-9])?)?$/, loader: "file-loader" },
        { test: /KendoUIGlyphs\.(ttf|woff|eot|svg)(\?\w*)?$/, loader: "url" },

        { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff" },
        { test: /\.(ttf|eot|svg|png|gif|jpe?g)(\?v=[0-9]\.[0-9](\.[0-9])?)?$/, loader: "url" }
    ],
    noParse: []
  }
}

function localPath(loc) { return path.join(__dirname, loc || ''); }
function appDir(loc) { return path.join(localPath('App'), loc || ''); }
function lib(loc) { return path.join(localPath('wwwroot/lib'), loc || ''); }
function cssDir(loc) { return path.join(localPath('wwwroot/css'), loc || ''); }
function js(loc) { return path.join(localPath('wwwroot/js'), loc || ''); }
function nodeModules(loc) { return path.join(localPath('node_modules'), loc || ''); }