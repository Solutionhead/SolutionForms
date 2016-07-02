import core from 'App/core';
const componentName = 'hidden-field';

function HiddenField(params) {
  if (!(this instanceof HiddenField)) { return new HiddenField(params); }

  var self = this;
  self.FieldType = "container";
  return self;
}

//var config = {
//  viewModel: HiddenField,
//  template: '<span>Hidden Field</span>'
//}


module.exports = {
  viewModel: HiddenField,
  template: '<input type="hidden" data-bind="value: userResponse"/>',
  name: 'Hidden Field'
};