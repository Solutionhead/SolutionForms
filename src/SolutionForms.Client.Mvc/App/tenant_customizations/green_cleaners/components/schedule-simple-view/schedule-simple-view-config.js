var ScheduleSimpleViewFactory = require('./schedule-simple-view');

function ScheduleSimpleViewConfig(params) {
  if (!(this instanceof ScheduleSimpleViewConfig)) return new ScheduleSimpleViewConfig(params);
}


ScheduleSimpleViewConfig.prototype = ScheduleSimpleViewFactory.viewModel.prototype;

ScheduleSimpleViewFactory.config = {
  viewModel: ScheduleSimpleViewConfig,
  template: require('./schedule-simple-view-config.html'),
}

module.exports = ScheduleSimpleViewFactory;