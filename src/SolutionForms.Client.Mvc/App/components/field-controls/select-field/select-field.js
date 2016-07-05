import _toArray from 'lodash/toArray';

function SelectFieldViewModel(params) {
    if (!(this instanceof SelectFieldViewModel)) { return new SelectFieldViewModel(params); }

    var self = this,
        input = ko.unwrap(params.input) || {},
        settings = ko.unwrap(input.settings) || input;

    self.optionsCaption = ko.pureComputed(function () {
        return ko.unwrap(settings.displayDefaultSelection)
            ? ko.unwrap(settings.defaultSelectionText) || ' '
            : ko.unwrap(settings.optionsCaption) || null;
    });
    self.initOptions(settings);
  
    var baseSetValue = self.setValue.bind(self);
    self.setValue = function(value) {
        switch (self.settings.optionSource) {
            case SelectFieldViewModel.prototype.OPTION_SOURCES.dataSource.value:
                return self.setSelectedOptionsForDataSource.call(self, value);
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

SelectFieldViewModel.prototype.setSelectedOptionsForDataSource = function (value) {
    //#region private functions

    // Because all entities are created with the Id property, 
    // we can use the Id member when searching for matching options
    // from the local data source.
    function findOptionByKey(opts, key) {
        var match = ko.utils.arrayFirst(opts, function (o) {
          return (self.settings.optionDataSourceValueMember != undefined 
            ? o.optionValue : o.optionValue.Id) === key;
        });
        return match == undefined ? null : match.optionValue;
    }

    //#endregion

    var self = this;
    if (value == undefined) {
      base.prototype.setValue.call(self, undefined);
      return;
    }
    
    var key = self.settings.optionDataSourceValueMember != undefined 
      ? value : value.Id,
      options = self.options() || [];

    if (options.length) {
        base.prototype.setValue.call(self, findOptionByKey(options, key));
    } else {
        var optionsSubscription = self.options.subscribe(function (opts) {
            base.prototype.setValue.call(self, findOptionByKey(opts, key));
            optionsSubscription.dispose();
            optionsSubscription = null;
        });
    }
}
SelectFieldViewModel.prototype.initOptions = function(settings) {
    var optionSource = settings.optionSource || SelectFieldViewModel.prototype.OPTION_SOURCES.selfDefined.value,
        self = this;

    switch (optionSource) {
        case SelectFieldViewModel.prototype.OPTION_SOURCES.dataSource.value:
            self.options = ko.observableArray([]);
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
            return;
        case SelectFieldViewModel.prototype.OPTION_SOURCES.selfDefined.value:
        default:
            self.options = ko.observableArray(ko.unwrap(settings.options) || []);
    }
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