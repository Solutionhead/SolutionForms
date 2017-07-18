import core from 'App/core';
ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));

function BootstrapGridLayout(params) {
  if (!(this instanceof BootstrapGridLayout)) {
    return new BootstrapGridLayout(params);
  }

  this.__subscriptions = [];

  var self = core.FieldBase.call(this, params);
  const input = (ko.isObservable() ? params.input.peek() : params.input) || {};
  const settings = $.extend({}, BootstrapGridLayout.prototype.DEFAULT_SETTINGS, ko.unwrap(input.settings));

  self.containerClass = settings.containerClass;
  self.contents = settings.contents;

  return self;
}

BootstrapGridLayout.prototype.DEFAULT_SETTINGS = {
  containerClass: 'container',
  contents: [],
}

module.exports = {
  viewModel: BootstrapGridLayout,
  name : "Bootstrap Grid",
  template: require('./bootstrap-grid-layout.html')
};