import core from 'App/core';

function CheckboxesFieldViewModel(params) {
    if (!(this instanceof CheckboxesFieldViewModel)) { return new CheckboxesFieldViewModel(params); }

    var self = core.FieldBase.call(this, params),
        input = ko.unwrap(params.input) || {},
        settings = ko.unwrap(input.settings) || {};

    self.userResponse = ko.observableArray(CheckboxesFieldViewModel.prototype.defaultUserResponse);

    self.options = ko.observableArray(ko.unwrap(settings.options) || []);
  
    return self;
}

CheckboxesFieldViewModel.prototype.defaultUserResponse = [];

CheckboxesFieldViewModel.prototype.setValue = function(val) {
  this.userResponse(val || []);
}

module.exports = {
  name: "Checkboxes",
  viewModel: CheckboxesFieldViewModel,
  template: require('./checkboxes-field.html')
};