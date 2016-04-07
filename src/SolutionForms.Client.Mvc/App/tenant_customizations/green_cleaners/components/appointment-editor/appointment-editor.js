if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

if (!ko.components.isRegistered('recurrence-scheduler')) {
  ko.components.register('recurrence-scheduler', require('../recurrence-scheduler/recurrence-scheduler'));
}

var moment = require('moment');

function AppointmentEditor(params) {
  if (!(this instanceof AppointmentEditor)) {
    return new AppointmentEditor(params);
  }

  var self = this;
  self.eventEditorVm = ko.observable();
  self.recurrenceInput = ko.observable();
  self.recurrenceEditorExport = ko.observable();
  self.showRecurrence = ko.observable(false);

  var currentEventId = ko.observable();

  self.isNewAppointment = ko.pureComputed(function() {
    return currentEventId() == undefined;
  });
  self.isRecurringAppointment = ko.pureComputed(function() {
    return self.recurrenceInput() != undefined;
  });

  self.editSeriesCommand = ko.command({
    execute: function () {
      self.showRecurrence(true);
    },
    canExecute: function() {
      return !self.isNewAppointment()
        && self.isRecurringAppointment()
        && !self.showRecurrence();
    }
  });

  self.saveAsyncCommand = ko.asyncCommand({
    execute: function(done) {
      self.saveAppointment(currentEventId());
      done();
    },
    canExecute: function(isExecuting) {
      return !isExecuting;
    }
  });

  params.input.appointmentData.subscribe(function(values) {
    currentEventId(values && values.Id);
    if (values != undefined) {
      var recurrence = null;
      if (values.Recurrence) {
        recurrence = values.Recurrence;
        values.Id = null;
        values.Recurrence = null;
      }

      self.showRecurrence(false);
      self.eventEditorVm().setFormContext(values);
      self.recurrenceInput(recurrence);
    }
  });

  return self;
}

AppointmentEditor.prototype.saveAppointment = function(id) {
  var self = this;
  var event = self.eventEditorVm().buildDto();
  
  event.Recurrence = self.showRecurrence() ?
    self.recurrenceEditorExport().model() :
    null;

  var dfd = $.Deferred();

  if (isRecurrenceException()) {
    var exDate = moment(event.Date).format(ko.extenders.moment.ISO_DATE_Format);
    if (ko.utils.arrayIndexOf(exDate) === -1) {
      var recurrenceMaster = self.recurrenceInput();
      recurrenceMaster.Exceptions = recurrenceMaster.Exceptions || [];
      recurrenceMaster.Exceptions.push(exDate);

      console.log("Patch master event with exception for event: " + id);
      console.log(recurrenceMaster.Exceptions);
    }

    //todo: call PATCH command
    dfd = dfd.resolve();

    id = null;
    console.log("Create recurrence exception event");
  } else {
    dfd.resolve();
  }

  return dfd.then(postOrPutEvent);
  
  function isRecurrenceException() {
    return id && self.recurrenceInput() != undefined && event.Recurrence == undefined;
  }
  function postOrPutEvent() {
    var isNew = id == undefined;
    $.ajax("/api/d/events/" + (isNew ? '' : id), {
      data: ko.toJSON(event),
      dataType: 'json',
      contentType: 'application/json',
      method: isNew ? 'POST' : 'PUT'
    });
  }
}

module.exports = {
  viewModel: AppointmentEditor,
  template: require('./appointment-editor.html')
}