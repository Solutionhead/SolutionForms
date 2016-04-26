var base = require('controls/basicEntryField'),
  componentName = 'hidden-field';

function HiddenField(params) {
  if (!(this instanceof HiddenField)) { return new HiddenField(params); }

  var self = base.call(this, params, true);
  self.FieldType = "container";
  return self;
}

var config = {
  viewModel: HiddenField,
  template: '<span>Hidden Field</span>'
}


module.exports = {
  viewModel: HiddenField,
  template: '<input type="hidden" data-bind="value: userResponse"/>',
  name: 'Hidden Field',
  componentName: 'hidden-field'
};

ko.components.register(componentName, module.exports);
ko.components.register(componentName + '-config', config);