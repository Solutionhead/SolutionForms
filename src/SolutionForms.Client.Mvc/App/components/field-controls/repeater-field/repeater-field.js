import core from 'App/core';
import * as DataService from 'App/services/dataEntriesService';

function RepeaterFieldViewModel(params) {
  if (!(this instanceof RepeaterFieldViewModel)) {
    return new RepeaterFieldViewModel(params);
  }

  var self = core.FieldBase.call(this, params);
  self.settings = ko.unwrap(params.input.settings);

  self.source = ko.observableArray([]);

  self.userResponse = ko.pureComputed(function() {
    return ko.utils.arrayMap(self.source(), function(item) {
      return item;
    });
  });

  self.init();

  return self;
}

RepeaterFieldViewModel.prototype.init = function() {
  var self = this;
  DataService.getDataByDataSourceName(ko.unwrap(this.settings.dataSource))
    .done(d => self.source(d))
    .fail(() => {
      console.log('Failed to load repeater data source.');
      console.log(arguments);
    });
}
//RepeaterFieldViewModel.prototype.constructFields = function (fields, values) {
//    return ko.utils.arrayMap(fields || [], function (f) {
//        return new Field(f.config, values && values[f.config.exportName]);
//    });
//}

module.exports = {
  viewModel: RepeaterFieldViewModel,
  name : "Repeater",
  template: require('./repeater-field.html')
};