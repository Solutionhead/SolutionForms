ko.punches.enableAll();
require('ko.bs.collapse');
require('ko.sortable');
var base = require('viewModels/dataformFieldsDesigner');

function DataformFieldDesigner(params) {
  if (!(this instanceof DataformFieldDesigner)) { return new DataformFieldDesigner(params); }

  base.call(this, params);
  const self = this;

  self.__subscriptions = [];

  //if (params.input) {
  //  self.initFields(params.input);
  //}
  

  //setup
  //if (ko.isObservable(params.input)) {
  //  self.__subscriptions.push(params.input.subscribe(self.initFields));
  //} else {
  //  console.log('params.input is not an observable.');
  //}

  self.initFields(params.fieldsConfig);

  if (ko.isObservable(params.exports)) {
    params.exports({
      fieldsConfig: ko.pureComputed(() => {
        return self.buildFieldsConfigExport();
      }),
      fields: self.fields
    });
  }

  return self;
}

DataformFieldDesigner.prototype = base.prototype;
DataformFieldDesigner.prototype.initFields = function (input) {
  this.__subscriptions.push(ko.pureComputed(() => {
    var values = $.extend({}, DataformFieldDesigner.prototype.defaultValues, ko.unwrap(input));
    this.fields(ko.unwrap(values.fields));
  }));
}
DataformFieldDesigner.prototype.defaultValues = {
  fields: []
};
DataformFieldDesigner.prototype.dispose = function () {
  ko.utils.arrayForEach(this.__subscriptions, function (s) {
    s.dispose && s.dispose();
  });
  this.__subscriptions = [];
}

module.exports = {
  viewModel: DataformFieldDesigner,
  template: require('./dataform-fields-designer.html')
}