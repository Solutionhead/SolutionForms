import 'bindings/ko.bindings.jq-autocomplete';
import core from 'App/core';

function LookupField(params) {
  if (!(this instanceof LookupField)) { return new LookupField(params); }

  const self = this;
  const config = $.extend({}, LookupField.prototype.defaultSettings, params.input.settings);
  const lookupSource = ko.observableArray([]);
  const value = ko.observable();

  this.lookupValues = ko.pureComputed(() => lookupSource());
  const init = self.buildLookupOptionsAsync(config, lookupSource);

  this.value = self.userResponse;
  this.delay = config.delay;
  this.autoFocus = config.autoFocus;

  this.userResponse = ko.computed({
    read: () => value(),
    write: (val) => {
      init.done(() => {
        if (val == null) {
          val = null;
        } else if (config.valueProperty == null) {
          val = self.findOptionById(val.Id) || { optionValue: null };
          val = val.optionValue;
        }
        value(val);
      });
    }
  });
}

module.exports = {
  viewModel: LookupField,
  name: 'AutoComplete Lookup'
}

LookupField.prototype.defaultSettings = {
  delay: 500,
  autoFocus: true,
  valueProperty: null,
  pageSize: 300
}

LookupField.prototype.findOptionById = function (id){
  const options = this.lookupValues() || [];
  return ko.utils.arrayFirst(options, (o) => o.optionValue && o.optionValue.Id === id);
}

LookupField.prototype.buildLookupOptionsAsync = function(options, recipientObservable, skipCount) {
  const dataSourceName = options.dataSourceName;
  if (!dataSourceName) {
    return $.Deferred().reject();
  }
  
  const labelProperty = options.labelProperty;
  const labelTransformer = options.transformWith;
  const valueProperty = options.valueProperty;
  const queryPageSize = options.pageSize;
  const $dfd = $.Deferred();

  recipientObservable([]);
  fetchPage(0);

  return $dfd;

  function fetchPage(skipCount) {
    $.ajax(`/api/d/${dataSourceName}?$skip=${skipCount}&$top=${queryPageSize}&$transformWith=${labelTransformer}`)
      .done(function(data) {
        const mapped = ko.utils.arrayMap(data || [], function(item) {
          return {
            optionLabel: item[labelProperty],
            optionValue: valueProperty ? item[valueProperty] : item
          }
        });
        ko.utils.arrayPushAll(recipientObservable(), mapped);

        if (data.length < queryPageSize) {
          recipientObservable.notifySubscribers(recipientObservable());
          $dfd.resolve();
        } else {
          fetchPage(skipCount + data.length);
        }
      });
  }
}