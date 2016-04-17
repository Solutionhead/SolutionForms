var dataProvider = require('plugins/getDataFromLocalStorePlugin')();

function InitializeFormValuesPlugin() {
  if (!(this instanceof InitializeFormValuesPlugin)) { return new InitializeFormValuesPlugin(); }

  var plugin = this;

  plugin.fetch = function (args) {
    var sender = args.form;
    return dataProvider.fetch(args)
        .done(function (data) {
          var vals = data || {};
          if (typeof vals === "string") { vals = ko.utils.parseJson(vals) || {}; }
          ko.utils.arrayForEach(sender.fields(), function (f) {
            f.context().setValue(vals[f.exportName]);
          });
        });
  }
}

module.exports = InitializeFormValuesPlugin;