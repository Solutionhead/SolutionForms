var component = require('./all-client-activity-overview');

function AllClientActivityOverviewConfig(field, config) {
  if (!(this instanceof AllClientActivityOverviewConfig)) {
    return new AllClientActivityOverviewConfig(field, config);
  }

  const self = this;

  return self;
}

component.config = {
  viewModel: AllClientActivityOverviewConfig,
  template: '<div></div>'
};
module.exports = component;