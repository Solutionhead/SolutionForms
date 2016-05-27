var moment = require('moment');

require('koExtenders/knockout.extenders.moment');

ko.filters.moment = function(value, format) {
  return moment(value, "MM/DD/YYYY").format(format);
}
ko.punches.textFilter.enableForBinding('text');
ko.punches.interpolationMarkup.enable();

function ScheduleSimpleView(params) {
  if (!(this instanceof ScheduleSimpleView)) {
    return new ScheduleSimpleView(params);
  }

  var self = this, level1BreakHold;

  self.options = $.extend({}, ScheduleSimpleView.prototype.DEFAULT_OPTIONS, params.options || {});

  self.appointmentsByDate = params.options.appointments;
  self.appointmentsByDate.subscribe(() => {
    self.resetControlBreaks();
  });

  self.renderTeamHeader = function(appointment) {
    if (level1BreakHold !== appointment.teamName) {
      level1BreakHold = appointment.teamName;
      return true;
    }
    return false;
  }

  self.resetControlBreaks = function() {
    level1BreakHold = undefined;
  }
  self.selectAppointmentCommand = ko.command({
    execute: function(apt) {
      self.options.onEventSelected(apt);
    }
  });

return self;
}

ScheduleSimpleView.prototype.DEFAULT_OPTIONS = {
  onEventSelected: function() {}
}

module.exports = {
  name: 'Schedule Simple View',
  componentName: 'schedule-simple-view',
  viewModel: ScheduleSimpleView,
  template: require('./schedule-simple-view.html')
}