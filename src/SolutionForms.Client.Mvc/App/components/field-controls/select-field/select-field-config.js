var selectFieldComponentFactory = require('controls/select-field/select-field');
var loadDataSourceOptions = $.ajax('/api/datasources');

function SelectFieldConfigViewModel(params) {
    if (!(this instanceof SelectFieldConfigViewModel)) return new SelectFieldConfigViewModel(params);

    var self = this,
        settings = params.input.settings.peek() || {},
        isInitialized = ko.observable(false);

    self.optionToAdd = ko.observable();
    self.optionToAdd.subscribe(function (value) {
        if (value != undefined && value != '') {
            var newOption = self.addOption(value);
            newOption.isSelected(true);
            self.optionToAdd(null);
        }
    });
    self.optionsSource = ko.observable(settings.optionSource);
    self.optionDataSourceEntityName = ko.observable(settings.optionDataSourceEntityName);
    self.optionDataSourceLabelMember = ko.observable(settings.optionDataSourceLabelMember);
    self.sourceOptions = selectFieldComponentFactory.viewModel.prototype.getSourceOptions();
    self.displaySelfOptions = ko.pureComputed(function () {
        var val = self.optionsSource();
        return val === selectFieldComponentFactory.viewModel.prototype.OPTION_SOURCES.selfDefined.value
            || val === ''
            || val == undefined;
    });
    self.displayDataSourcesOptions = ko.pureComputed(function () {
        return self.optionsSource() === selectFieldComponentFactory.viewModel.prototype.OPTION_SOURCES.dataSource.value;
    });
    self.dataSourceOptions = ko.observableArray(window['__dataSources__'] || []);
    self.displayDefaultSelection = ko.observable(settings.displayDefaultSelection || false);
    self.defaultSelectionText = ko.observable(settings.defaultSelectionText);
    

    var selectedDataSourceOption = settings.optionDataSourceEntityName;
    loadDataSourceOptions.then(function(data) {
      self.dataSourceOptions(ko.utils.arrayMap(data, function (item) {
        return {
          displayName: item.name,
          value: item.documentName
        }
      }));
      self.optionDataSourceEntityName(selectedDataSourceOption);
    });

    self.addNewOptionCommand = ko.command({
        execute: function () {
            var optText = 'Option ' + (self.options.peek().length + 1);
            var option = self.addOption(optText, optText);
            option.isSelected(true);
        }
    });
    self.removeOptionCommand = ko.command({
        execute: function (opt) {
            if (opt instanceof SelectOptionViewModel) {
                ko.utils.arrayRemoveItem(self.options.peek(), opt);
                self.options.notifySubscribers(self.options.peek());
            }
        },
        canExecute: function () {
            return isInitialized() && self.options().length > 1;
        }
    });

    var mappedOptions = ko.utils.arrayMap(settings.options || [], function (o) {
        return new SelectOptionViewModel(o.optionLabel, o.optionValue);
    });
    

    selectFieldComponentFactory.viewModel.call(self, {
        context: params.context,
        input: {
            settings: {
                options: mappedOptions,
                optionSource: self.optionsSource,
                optionDataSourceEntityName: self.optionDataSourceEntityName,
                optionDataSourceLabelMember: self.optionDataSourceLabelMember
            }
        }
    });

    settings.optionSource = self.optionsSource;
    settings.optionDataSourceEntityName = self.optionDataSourceEntityName;
    settings.optionDataSourceLabelMember = self.optionDataSourceLabelMember;
    settings.options = self.options;
    settings.displayDefaultSelection = self.displayDefaultSelection;
    settings.defaultSelectionText = self.defaultSelectionText;
    params.input.settings(settings);

    isInitialized(true);
    if (!mappedOptions.length) {
        self.addOption('Option 1', 'Option 1');
    }

    return self;
}

SelectFieldConfigViewModel.prototype.addOption = function (label, value) {
    var opt = new SelectOptionViewModel(label || '', value);
    this.options.push(opt);
    return opt;
};

module.exports = {
    viewModel: SelectFieldConfigViewModel,
    template: require('./select-field-config.html'),
    synchronous: true,
}


function SelectOptionViewModel(optionLabel, optionValue) {
    if (!(this instanceof SelectOptionViewModel)) return new SelectOptionViewModel();
    var self = this;
    self.optionLabel = ko.observable(optionLabel);
    self.optionValue = ko.observable(optionValue);
    self.isSelected = ko.observable(false);

    self.optionLabel.subscribe(function (label) {
        if (self.optionValue() != undefined) return;
        self.optionValue(label);
    });

    return self;
}