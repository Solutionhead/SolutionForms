// TODO: Introduce template configuration
// POSSIBLE Functionality Options:
// - Repeat field values (rather than from separate database call)

//import fieldsHelper from 'viewModels/dataformFieldsDesigner';
var loadDataSourceOptions = $.ajax('/api/datasources');

function RepeaterFieldConfigViewModel(field, params) {
  if (!(this instanceof RepeaterFieldConfigViewModel)) { return new RepeaterFieldConfigViewModel(field, params); }

  var self = this,
      settings = params.input.settings.peek() || {};

  self.dataSource = ko.observable(settings.dataSource);
  self.dataSourceOptions = ko.observableArray([]);
  self.groupOptions = ko.observableArray([]);

  self.addGroupOption = ko.command({
    execute: function() {
      self.groupOptions.push({
        value: ko.observable()
      });
    }
  });
  self.removeGroupOption = ko.command({
    execute: function(opt) {
      self.groupOptions.remove(opt);
    }
  });

  //self.constructFieldsForConfig(params);

  settings.dataSource = self.dataSource;
  settings.groupBy = ko.pureComputed(function() {
    ko.utils.arrayMap(self.groupOptions(), function(o) {
      return o.value;
    });
  });


  loadDataSourceOptions.then(function (data) {
    self.dataSourceOptions(ko.utils.arrayMap(data, function (item) {
      return {
        displayName: item.name,
        value: item.documentName
      }
    }));
  });

  params.input.settings(settings);
}


//RepeaterFieldConfigViewModel.prototype.constructFieldsForConfig = function (params) {
//    var settings = ko.unwrap(params.input.settings);
//    var mappedFields = ko.utils.arrayMap(settings.fields || [], function (f) {
//        return f.config || {};
//    });

//    params.input.fields = mappedFields;

//    fieldsHelper.call(this, params);
//}

module.exports = RepeaterFieldConfigViewModel;