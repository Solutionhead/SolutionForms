//import Field from 'models/formFieldLive';
import * as DataService from 'App/services/dataEntriesService';

function RepeaterFieldViewModel(params) {
  if (!(this instanceof RepeaterFieldViewModel)) {
    return new RepeaterFieldViewModel(params);
  }

  var self = this;
  self.settings = ko.unwrap(params.input.settings);

  self.source = ko.observableArray([]);

  self.userResponse = ko.pureComputed(function() {
    return ko.utils.arrayMap(self.source(), function(item) {
      return item;
      //var responseObj = {};
      //ko.utils.arrayMap(item.members, function(m) {
      //    var context = m.context();
      //    responseObj[m.exportName] = context && context.userResponse();
      //});
      //return responseObj;
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