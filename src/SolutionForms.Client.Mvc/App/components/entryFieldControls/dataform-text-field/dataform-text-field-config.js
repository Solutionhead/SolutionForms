var base = require('controls/basicEntryField');

function TextFieldConfig(params) {
    if (!(this instanceof TextFieldConfig)) return new TextFieldConfig();
    var settings = ko.unwrap(params.input.settings) || {};
    var validation = ko.unwrap(settings.validation) || {};

    var self = this;

    //todo: add additional validators here
    //validation.newValidator = ...

    settings.validation = validation;
    params.input.settings(settings);

    base.call(this, params);
}

TextFieldConfig.prototype = base.prototype;

module.exports = {
    viewModel: TextFieldConfig,
    template: require('controls/dataform-text-field/dataform-text-field-config.html')
}