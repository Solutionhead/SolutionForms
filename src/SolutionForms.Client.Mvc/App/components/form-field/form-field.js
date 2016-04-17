var Field = require('models/formFieldLive');

function FormField(params) {
  if (!(this instanceof FormField)) { return new FormField(params); }

  var self = this;

  self.labelText = params.label;
  self.inputType = ko.unwrap(params.inputType);
  self.fieldConfig = new Field({
    valueContext: params.context,
    settings: params.config
  });

  return self;
}

module.exports = {
  viewModel: FormField,
  template: require('./form-field.html')
}