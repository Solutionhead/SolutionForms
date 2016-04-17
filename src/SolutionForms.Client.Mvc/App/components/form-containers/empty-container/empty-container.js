if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

function EmptyContainer(params) {
  if (!(this instanceof EmptyContainer)) { return new EmptyContainer(params); }

  var self = this;

  self.config = params.config;

  return self;
}

module.exports = {
  viewModel: EmptyContainer,
  template: '<dynamic-form params="config: config"></dynamic-form>'
}