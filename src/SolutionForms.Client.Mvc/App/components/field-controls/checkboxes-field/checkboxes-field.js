function CheckboxesFieldViewModel(params) {
    if (!(this instanceof CheckboxesFieldViewModel)) { return new CheckboxesFieldViewModel(params); }

    var self = this,
        input = ko.unwrap(params.input) || {},
        settings = ko.unwrap(input.settings) || {};

    self.userResponse = ko.observableArray([]);

    self.options = ko.observableArray(ko.unwrap(settings.options) || []);

    self.setValue = function (val) {
        self.userResponse(val || []);
    }

    return self;
}

module.exports = {
  name: "Checkboxes",
  viewModel: CheckboxesFieldViewModel,
  template: require('./checkboxes-field.html')
};