function CheckboxesFieldConfigViewModel(field, params) {
    if (!(this instanceof CheckboxesFieldConfigViewModel)) return new CheckboxesFieldConfigViewModel(field, params);

    var self = this,
        settings = params.input.settings.peek() || {},
        isInitialized = ko.observable(false);

    // map values as CheckboxOptionViewModel?
    self.options = settings.options = ko.observableArray(ko.unwrap(settings.options) || []);
   
    self.optionToAdd = ko.observable();
    self.optionToAdd.subscribe(function (value) {
        if (value != undefined && value !== '') {
          const newOption = self.addOption(value);
          newOption.isSelected(true);
          self.optionToAdd(null);
        }
    });

    self.addNewOptionCommand = ko.command({
        execute: function () {
            var optText = 'Option ' + (settings.options.peek().length + 1);
            var option = self.addOption(optText, optText);
            option.isSelected(true);
        }
    });
    self.removeOptionCommand = ko.command({
        execute: function (opt) {
            ko.utils.arrayRemoveItem(settings.options.peek(), opt);
            settings.options.notifySubscribers(settings.options.peek());
        },
        canExecute: function () {
            return isInitialized() && settings.options().length > 1;
        }
    });

    params.input.settings(settings);
    
    isInitialized(true);
    if (!self.options().length) {
        self.addOption('Option 1', 'Option 1');
    }

    return self;
}

CheckboxesFieldConfigViewModel.prototype.addOption = function (label, value) {
    var opt = new CheckboxOptionViewModel(label || '', value);
    this.options.push(opt);
    return opt;
};

module.exports = CheckboxesFieldConfigViewModel;


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