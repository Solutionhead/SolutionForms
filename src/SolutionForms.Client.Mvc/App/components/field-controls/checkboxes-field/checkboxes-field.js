function CheckboxesFieldViewModel(params) {
    if (!(this instanceof CheckboxesFieldViewModel)) { return new CheckboxesFieldViewModel(params); }

    var self = this,
        input = ko.unwrap(params.input) || {},
        settings = ko.unwrap(input.settings) || {};

    self.userResponse = ko.observableArray(CheckboxesFieldViewModel.prototype.defaultUserResponse);

    self.options = ko.observableArray(ko.unwrap(settings.options) || []);
  
    return self;
}

CheckboxesFieldViewModel.prototype.defaultUserResponse = [];

module.exports = {
  name: "Checkboxes",
  viewModel: CheckboxesFieldViewModel,
  template: require('./checkboxes-field.html')
};