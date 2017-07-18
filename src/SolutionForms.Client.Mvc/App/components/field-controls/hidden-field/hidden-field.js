import core from 'App/core';

function HiddenField(params) {
  if (!(this instanceof HiddenField)) { return new HiddenField(params); }

  var self = core.FieldBase.call(this, params);
  self.FieldType = "container";
  return self;
}


module.exports = {
  viewModel: HiddenField,
  template: '<input type="hidden" data-bind="value: userResponse"/>',
  name: 'Hidden Field'
};