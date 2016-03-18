var recurrenceSchedulerComponentFactory = require('./recurrence-scheduler');

function RecurrenceSchedulerConfigViewModel(params) {
    if (!(this instanceof RecurrenceSchedulerConfigViewModel)) return new RecurrenceSchedulerConfigViewModel(params);

    var self = this,
        settings = params.input.settings.peek() || {},
        isInitialized = ko.observable(false);
}

RecurrenceSchedulerConfigViewModel.prototype = recurrenceSchedulerComponentFactory.viewModel.prototype;

recurrenceSchedulerComponentFactory.config = {
  viewModel: RecurrenceSchedulerConfigViewModel,
  template: require('./recurrence-scheduler-config.html'),
}

module.exports = recurrenceSchedulerComponentFactory;