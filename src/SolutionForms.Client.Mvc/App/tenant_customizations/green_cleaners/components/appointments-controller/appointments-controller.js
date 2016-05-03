// 1. Get desired events [done]
// 2. Re-Map recurring events' dates
// 3. Exclude recurring events exceptions
// 4. Enable edit/delete of single occurrence of recurring event
// 5. Hide Start Time field when in recurrence mode

ko.components.register('appointments-day-view', require('../schedule-simple-view/schedule-simple-view'));
ko.components.register('appointment-editor', require('../appointment-editor/appointment-editor'));
require('bindings/ko.bindings.bs-modal');
var toastr = require('toastr');


function AppointmentsController() {
  if (!(this instanceof AppointmentsController)) { return new AppointmentsController(); }
  var self = this;

  self.selectedEvent = ko.observable();
  self.showModal = ko.observable();
  self.appointmentsByDayViewModel = ko.observable();
  self.appointmentEditorViewModel = ko.observable();

  self.isCurrentEventRecurring = ko.computed(function() {
    var editorVm = self.appointmentEditorViewModel();
    return editorVm && editorVm.isRecurringAppointment();
  });
  self.isCurrentEventNew = ko.pureComputed(function() {
    var editorVm = self.appointmentEditorViewModel();
    return editorVm && editorVm.isNewAppointment();
  });
  self.appointmentsDayViewOptions = {
    onEventSelected: function(eventData) {
      self.selectedEvent(eventData);
      self.showModal(eventData != undefined);
    }
  }

  ko.postbox.subscribe("appointment-saved", () => {
      var appointmentsVm = self.appointmentsByDayViewModel();
      appointmentsVm && appointmentsVm.fetchEvents();
  });

  ko.postbox.subscribe("appointment-deleted", () => {
      var appointmentsVm = self.appointmentsByDayViewModel();
      appointmentsVm && appointmentsVm.fetchEvents();
  });
  
  self.appointmentEditorConfig = {
    appointmentData: self.selectedEvent
  }

  self.newEvent = ko.command({
    execute: function () {
      //todo: set date from day view
      self.selectedEvent({});
      self.showModal(true);
    },
    canExecute: function () {
      return true;
    }
  });

  var ajaxOperationRunning = ko.observable(false);
  self.saveAsyncCommand = ko.asyncCommand({
    execute: function (done) {
      ajaxOperationRunning(true);
      self.appointmentEditorViewModel().saveAppointmentAsync()
        .done(function() {
          toastr.success("Appointment saved successfully");
          self.showModal(false);
        })
        .fail(function() {
          toastr.error("Failed to save appointment.");
        })
        .always(function () {
          done();
          ajaxOperationRunning(false);
        });
    },
    canExecute: function (isExecuting) {
      return !isExecuting && !ajaxOperationRunning() && self.appointmentEditorViewModel() != undefined;
    }
  });

  self.deleteSingleRecurrenceAsyncCommand = ko.asyncCommand({
    execute: function(done) {
      ajaxOperationRunning(true);
      self.appointmentEditorViewModel().deleteSingleRecurrenceInstanceAsync()
        .done(function() {
          toastr.success("The appointment has been removed.");
          self.showModal(false);
        })
        .fail(function() {
          toastr.error("Failed to remove the appointment.");
        })
        .always(function () {
          done();
          ajaxOperationRunning(false);
        });
    },
    canExecute: function(isExecuting) {
      return !isExecuting && !ajaxOperationRunning() && self.isCurrentEventRecurring();
    }
  });

  self.deleteFutureRecurrencesAsyncCommand = ko.asyncCommand({
    execute: function(done) {
      ajaxOperationRunning(true);
      self.appointmentEditorViewModel().deleteAppointmentAndFutureRecurrencesAsync()
        .done(function() {
          toastr.success("Appointments have been successfully removed.");
          self.showModal(false);
        })
        .fail(function() {
          toastr.error("Failed to remove appointments.");
        })
        .always(function () {
          done();
          ajaxOperationRunning(false);
        });
    },
    canExecute: function(isExecuting) {
      return !isExecuting && !ajaxOperationRunning() && self.isCurrentEventRecurring();
    }
  });

  self.deleteEventAsyncCommand = ko.asyncCommand({
    execute: function (done) {
      ajaxOperationRunning(true);
      self.appointmentEditorViewModel().deleteEventAsync()
        .done(function() {
          toastr.success('Event deleted successfully.');
          self.showModal(false);
        })
        .fail(function() {
          toastr.error('Darn. Failed to delete event.');
        })
        .always(function () {
          done();
          ajaxOperationRunning(false);
        });
    },
    canExecute: function (isExecuting) {
      return !isExecuting && !ajaxOperationRunning() && self.appointmentEditorViewModel() != undefined;
    }
  });

  self.hideModal = function() {
    self.showModal(false);
  }

  return self;
}

module.exports = {
  viewModel: AppointmentsController,
  template: require('./appointments-controller.html'),
  name: 'Appointment Scheduler',
  componentName: 'appointments-controller'
}