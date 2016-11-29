var $ = require('jquery'),
    _ = require('underscore');

function GetDataFromLocalStorePlugin() {
    if (!(this instanceof GetDataFromLocalStorePlugin)) { return new GetDataFromLocalStorePlugin(); }

    var plugin = this;

    plugin.fetch = function(args) {
      var entityName = ko.unwrap(args.entityName);
      var id = args.id;
      return $.ajax({
        url: '/api/d/' + entityName + '/' + (id == undefined ? '' : id),
        cache: false
      });
    }

    return plugin;
}

module.exports = GetDataFromLocalStorePlugin;