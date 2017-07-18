import _toArray from 'lodash/toArray';
import core from 'App/core';

function SelectFieldViewModel(params) {
    if (!(this instanceof SelectFieldViewModel)) { return new SelectFieldViewModel(params); }

    var self = core.FieldBase.call(this, params),
        input = ko.unwrap(params.input) || {},
        settings = ko.toJS(input.settings) || input;

    self.optionsCaption = ko.pureComputed(function () {
        return ko.unwrap(settings.displayDefaultSelection)
            ? ko.unwrap(settings.defaultSelectionText) || ' '
            : ko.unwrap(settings.optionsCaption) || null;
    });
    self.initOptions(settings);
  
    var baseSetValue = self.setValue.bind(self);
    self.setValue = function(value) {
        switch (settings.optionSource) {
            case SelectFieldViewModel.prototype.OPTION_SOURCES.dataSource.value:
                return baseSetValue(self.setSelectedOptionsForDataSource.call(self, value, settings, baseSetValue));
            default:
                return baseSetValue(value);
        }
    }

    if (ko.isObservable(input.valueContext)) {
      input.valueContext.subscribe(self.setValue);
    }

    return self;
}

SelectFieldViewModel.prototype.OPTION_SOURCES = {
    selfDefined: { display: 'Enter values here', value: 'selfDefined' },
    dataSource: { display: 'From another data source', value: 'dataSource' }
}

SelectFieldViewModel.prototype.setSelectedOptionsForDataSource = function (value, settings, valueObservable) {
    //#region private functions

    // Because all entities are created with the Id property, 
    // we can use the Id member when searching for matching options
    // from the local data source.
    function findOptionByKey(opts, key) {
      const match = ko.utils.arrayFirst(opts, function (o) {
        return (settings.optionDataSourceValueMember != undefined 
          ? o.optionValue : o.optionValue.Id) === key;
      });
      return match == null ? null : match.optionValue;
    }

    //#endregion

    var self = this;
    if (value == undefined) {
      valueObservable(undefined);
      return;
    }
    
    var key = settings.optionDataSourceValueMember != undefined 
      ? value : value.Id,
      options = self.options() || [];

    if (options.length) {
      valueObservable(findOptionByKey(options, key));
    } else {
        var optionsSubscription = self.options.subscribe(function (opts) {
          valueObservable(findOptionByKey(opts, key));
            optionsSubscription.dispose();
            optionsSubscription = null;
        });
    }
}
SelectFieldViewModel.prototype.initOptions = function(settings) {
    var optionSource = settings.optionSource || SelectFieldViewModel.prototype.OPTION_SOURCES.selfDefined.value,
        self = this;

    var options = [];
    switch (optionSource) {
        case SelectFieldViewModel.prototype.OPTION_SOURCES.dataSource.value:
            var labelProperty = settings.optionDataSourceLabelMember;
            var hasValueMember = settings.hasOwnProperty('optionDataSourceValueMember');

            $.ajax('/api/d/' + settings.optionDataSourceEntityName)
                .then(function(data) {
                    self.options(ko.utils.arrayMap(data || [], function(item) {
                        return {
                            optionLabel: item[labelProperty],
                            optionValue: hasValueMember ? item[settings['optionDataSourceValueMember']] : item
                        }
                    }));
                });
            break;
        case SelectFieldViewModel.prototype.OPTION_SOURCES.selfDefined.value:
        default:
            options = ko.unwrap(settings.options);
    }

    self.options = ko.observableArray(options || []);
}
SelectFieldViewModel.prototype.getSourceOptions = function () {
    return window['__option_sources__'] || (window['__option_sources__'] = ko.utils.arrayMap(_toArray(SelectFieldViewModel.prototype.OPTION_SOURCES), function(o) {
        return o;
    }));
}

module.exports = {
  name: 'Select from list',
  viewModel: SelectFieldViewModel,
  template: require('./select-field.html')
};