ko.punches.enableAll();
require('ko.bs.collapse');
require('ko.sortable');
var base = require('viewModels/dataformFieldsDesigner');

function DataformFieldDesigner(params) {
  if (!(this instanceof DataformFieldDesigner)) { return new DataformFieldDesigner(params); }

  base.call(this, params);
  const self = this;

  self.__subscriptions = [];

  self.init(params);

  return self;
}

DataformFieldDesigner.prototype = base.prototype;
DataformFieldDesigner.prototype.init = function (params) {
  this.__subscriptions.push(ko.computed(() => {
    var values = ko.unwrap(params.input) || [];
    this.fields(values);
  }, this));

  if (ko.isObservable(params.exports)) {
    params.exports({
      fieldsConfig: ko.pureComputed(() => {
        return this.buildFieldsConfigExport();
      }, this),
      fields: this.fields
    });
  }
}

DataformFieldDesigner.prototype.dispose = function () {
  ko.utils.arrayForEach(this.__subscriptions, function (s) {
    s.dispose && s.dispose();
  });
  this.__subscriptions = [];
}

module.exports = {
  viewModel: DataformFieldDesigner,
  template: require('./dataform-fields-designer.html'),
  synchronous: true
}