import core from 'App/core';

function DataformFieldViewModel(input) {
    if (!(this instanceof DataformFieldViewModel)) return new DataformFieldViewModel(input);
    var values = ko.toJS(input) || {};

    var self = this;
    self.displayName = ko.observable(values.displayName).extend({ required: true });
    self.inputType = ko.observable(values.inputType || core.defaultFieldName).extend({ required: true });
    self.configTemplateName = ko.pureComputed(function() {
        var inputType = this.inputType();
        return inputType
            ? inputType + '-config'
            : null;
    }, self);
    self.helpText = ko.observable(values.helpText);
    self.exportName = ko.observable(values.exportName).extend({ required: true });

    var settings = ko.unwrap(values.settings) || {};
    var validation = ko.unwrap(settings.validation) || {};
    self.isRequired = ko.observable(validation.isRequired);
    validation.isRequired = self.isRequired;
    settings.validation = validation;
    self.settings = ko.observable(settings);
    self.fieldType = ko.observable(values.fieldType);

    self.displayName.subscribe(function(name) {
        if (self.exportName() == undefined) {
            self.exportName(name);
        } else if (name == undefined || name === '') {
            self.exportName(undefined);
        }
    });

    return self;
}

DataformFieldViewModel.prototype.exportConfig = function () {
    return ko.toJS({
            displayName: this.displayName,
            inputType: this.inputType,
            helpText: this.helpText,
            exportName: this.exportName,
            settings: this.settings,
            fieldType: this.fieldType
        });
}

module.exports = DataformFieldViewModel;