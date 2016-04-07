// 1. Get desired events [done]
// 2. Re-Map recurring events' dates
// 3. Exclude recurring events exceptions
// 4. Enable edit/delete of single occurrence of recurring event
// 5. Hide Start Time field when in recurrence mode

ko.components.register('appointments-day-view', require('../schedule-simple-view/schedule-simple-view'));
ko.components.register('appointment-editor', require('../appointment-editor/appointment-editor'));
require('bindings/ko.bindings.bs-modal');


function AppointmentsController() {
  self.selectedEvent = ko.observable();
  self.showModal = ko.observable();

  self.appointmentsDayViewOptions = {
    onEventSelected: function(eventData) {
      self.selectedEvent(eventData);
      self.showModal(eventData != undefined);
    }
  }

  self.appointmentEditorConfig = {
    appointmentData: self.selectedEvent
  }


  self.newEvent = ko.command({
    execute: function () {
      //todo: set date from day view
      self.selectedEvent({});
    },
    canExecute: function () {
      return true;
    }
  });
  self.hideModal = function() {
    self.showModal(false);
  }
}

module.exports = {
  viewModel: AppointmentsController,
  template: require('./appointments-controller.html'),
  name: 'Appointment Scheduler',
  componentName: 'appointments-controller'
}