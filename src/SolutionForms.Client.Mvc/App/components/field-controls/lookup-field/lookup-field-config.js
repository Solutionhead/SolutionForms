import { viewModel as LookupField } from 'controls/lookup-field/lookup-field';
const loadDataSourceOptions = $.ajax('/api/datasources');

function LookupFieldConfig(field, params) {
  if (!(this instanceof LookupFieldConfig)) { return new LookupFieldConfig(field, params); }

  const self = this;
  const config = $.extend({}, LookupField.prototype.defaultSettings, params.input.settings.peek() || {});
  const delayMS = ko.observable(config.delay);

  this.dataSourceOptions = ko.observableArray([]);
  this.dataSourceName = ko.observable(config.dataSourceName);
  this.labelProperty = ko.observable(config.labelProperty);
  this.valueProperty = ko.observable(config.valueProperty);
  this.transformWith = ko.observable(config.transformWith);

  //todo: replace with number field control
  this.delayInMS = ko.pureComputed({
    read: () => delayMS(),
    write: (val) => {
      var numVal = Number(val);
      delayMS(isNaN(numVal) ? 0 : numVal);
    }
  });

  loadDataSourceOptions.then(function(data) {
    self.dataSourceOptions(ko.utils.arrayMap(data, function(item) {
      return {
        displayName: item.name,
        value: item.documentName
      }
    }));
    self.dataSourceName(config.dataSourceName);
  });

  config.dataSourceName = self.dataSourceName;
  config.labelProperty = self.labelProperty;
  config.valueProperty = self.valueProperty;
  config.transformWith = self.transformWith;
  params.input.settings(config);

  return self;
}

module.exports = {
  viewModel: LookupFieldConfig,
  template: require('./lookup-field-config.html')
}