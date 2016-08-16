var component = require('./client-habits');

function ClientHabitsConfig(field, options) {
  if (!(this instanceof ClientHabitsConfig)) {
    return new ClientHabitsConfig(field, options);
  }

  var self = this;

  field.clientId = ko.observable();

  return self;
}

component.config = {
  viewModel: ClientHabitsConfig,
  template: '<div></div>'
}
module.exports = component;