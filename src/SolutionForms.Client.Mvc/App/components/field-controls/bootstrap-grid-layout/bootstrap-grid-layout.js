function BootstrapGridLayout(params) {
  if (!(this instanceof BootstrapGridLayout)) {
    return new BootstrapGridLayout(params);
  }

  var self = this;
  self.settings = $.extend({}, BootstrapGridLayout.prototype.DEFAULT_SETTINGS, ko.unwrap(params.input.settings) || {});

  return self;
}

BootstrapGridLayout.prototype.DEFAULT_SETTINGS = {
  containerClass: 'container',
  rows: [],
}

module.exports = {
  viewModel: BootstrapGridLayout,
  name : "Bootstrap Grid",
  template: require('./bootstrap-grid-layout.html')
};