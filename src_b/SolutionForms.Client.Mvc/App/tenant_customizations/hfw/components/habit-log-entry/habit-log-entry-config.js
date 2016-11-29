var component = require('./habit-log-entry');

function HabitLogEntryConfig(field, options) {
  if (!(this instanceof HabitLogEntryConfig)) {
    return new HabitLogEntryConfig(field, options);
  }

  const self = this;

  field.clientId = ko.observable();

  return self;
}

component.config = {
  viewModel: HabitLogEntryConfig,
  template: '<div></div>'
}
module.exports = component;