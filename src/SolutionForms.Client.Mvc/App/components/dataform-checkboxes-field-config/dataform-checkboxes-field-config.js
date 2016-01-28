var checkboxesComponentFactory = require('controls/dataform-checkboxes-field/dataform-checkboxes-field');

function CheckboxesFieldConfigViewModel(params) {
    if (!(this instanceof CheckboxesFieldConfigViewModel)) return new CheckboxesFieldConfigViewModel(params);

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

    self.addNewOptionCommand = ko.command({
        execute: function () {
            var optText = 'Option ' + (self.options.peek().length + 1);
            var option = self.addOption(optText, optText);
            option.isSelected(true);
        }
    });
    self.removeOptionCommand = ko.command({
        execute: function (opt) {
            ko.utils.arrayRemoveItem(self.options.peek(), opt);
            self.options.notifySubscribers(self.options.peek());
        },
        canExecute: function () {
            return isInitialized() && self.options().length > 1;
        }
    });

    var mappedOptions = ko.utils.arrayMap(settings.options || [], function(o) {
        return new CheckboxOptionViewModel(o.optionLabel, o.optionValue);
    });

    checkboxesComponentFactory.viewModel.call(self, {
        context: params.context,
        input: {
            settings: {
                options: mappedOptions
            }
        }
    });
    
    settings.options = self.options;
    params.input.settings(settings);
    
    isInitialized(true);
    if (!mappedOptions.length) {
        self.addOption('Option 1', 'Option 1');
    }

    return self;
}

CheckboxesFieldConfigViewModel.prototype = checkboxesComponentFactory.viewModel.prototype;

CheckboxesFieldConfigViewModel.prototype.addOption = function (label, value) {
    var opt = new CheckboxOptionViewModel(label || '', value);
    this.options.push(opt);
    return opt;
};

module.exports = {
    viewModel: CheckboxesFieldConfigViewModel,
    template: require('./dataform-checkboxes-field-config.html'),
    synchronous: true,
}


function CheckboxOptionViewModel(optionLabel, optionValue) {
    if (!(this instanceof CheckboxOptionViewModel)) return new CheckboxOptionViewModel();
    var self = this;
    self.optionLabel = ko.observable(optionLabel);
    self.optionValue = ko.observable(optionValue);
    self.isSelected = ko.observable(false);

    self.optionLabel.subscribe(function(label) {
        if (self.optionValue() != undefined) return;
        self.optionValue(label);
    });

    return self;
}