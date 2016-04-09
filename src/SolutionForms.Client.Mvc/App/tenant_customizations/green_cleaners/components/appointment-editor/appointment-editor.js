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

  var self = this, originalValues;
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
      var editorVm = self.eventEditorVm();
      editorVm.currentInstanceDate = editorVm.getFieldValue("Date");
      editorVm.setFieldValue("Date", originalValues.Recurrence.startDate);
      editorVm.hideField("Date");
    },
    canExecute: function() {
      return !self.isNewAppointment()
        && self.isRecurringAppointment()
        && !self.showRecurrence();
    }
  });

  params.input.appointmentData.subscribe(function (values) {
    originalValues = ko.utils.parseJson(ko.toJSON(values));
    currentEventId(values && values.Id);

    self.eventEditorVm().showField("Date");
    
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

  // exports
  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      isNewAppointment: self.isNewAppointment,
      isRecurringAppointment: self.showRecurrence,
      saveAppointmentAsync: function() {
        return self.saveAppointmentAsync(currentEventId(), originalValues);
      },
      deleteSingleRecurrenceInstanceAsync: function() {
        return self.submitRecurrenceExceptionForDateAsync(currentEventId(), originalValues.Date);
      },
      deleteAppointmentAndFutureRecurrencesAsync: function () {
        return self.endRecurringEventAsOfDateAsync(currentEventId(), self.eventEditorVm().currentInstanceDate);
      },
      deleteEventAsync: function() {
        return self.deleteEventAsync(currentEventId());
      }
    });
  }

  return self;
}

AppointmentEditor.prototype.saveAppointmentAsync = function(id, initialValues) {
  var self = this;
  var event = self.eventEditorVm().buildDto();
  
  event.Recurrence = self.showRecurrence() ?
    self.recurrenceEditorExport().model() :
    null;

  if (isRecurrenceException()) {
    // TEST: ensure that the event's original date value is used for setting the excpetion.
    //   --> If the occurrence's date was modified we still want the recurrence exception to
    //       override the recurring event for the day the recurrence was modified.

    return self.submitRecurrenceExceptionForDateAsync(initialValues.Date).done(function() {
      id = null;
      postOrPutEvent();
    });
  } 

  return postOrPutEvent();
  
  function isRecurrenceException() {
    return id && self.recurrenceInput() != undefined && event.Recurrence == undefined;
  }
  function postOrPutEvent() {
    var isNew = id == undefined;
    return $.ajax("/api/d/events/" + (isNew ? '' : id), {
      data: ko.toJSON(event),
      dataType: 'json',
      contentType: 'application/json',
      method: isNew ? 'POST' : 'PUT'
    });
  }
}

AppointmentEditor.prototype.deleteEventAsync = function (id) {
  return $.ajax("/api/d/events/" + id, {
    dataType: 'json',
    contentType: 'application/json',
    method: 'DELETE'
  });
}

AppointmentEditor.prototype.submitRecurrenceExceptionForDateAsync = function(eventId, date) {
  //NOTE: the `exDate` property name must match the argument name in `createRecurrenceException`
  return issuePatch("/api/d/events/" + eventId,
    getMethodBodyAsString(createRecurrenceException),
    { "exDate": getRavenISOFormattedDate(date) }
  );

  function createRecurrenceException(exDate) {
    this.Recurrence.Exceptions = this.Recurrence.Exceptions || [];
    if (_.indexOf(this.Recurrence.Exceptions, exDate) === -1) {
      this.Recurrence.Exceptions.push(exDate);
    }
  }
}

AppointmentEditor.prototype.endRecurringEventAsOfDateAsync = function(eventId, date) {
  return issuePatch("/api/d/events/" + eventId,
    "this.Recurrence.endDate = \"" + getRavenISOFormattedDate(date) + "\";",
    {});
}

function issuePatch(url, patchScript, patchValues) {
  console.log('Patch:');
  console.log(patchScript);
  console.log(patchValues);
  return $.ajax(url, {
    data: ko.toJSON({
      script: patchScript,
      values: patchValues
    }),
    dataType: 'json',
    contentType: 'application/json',
    method: 'PATCH'
  });
}

function getMethodBodyAsString(fn) {
  return fn.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
}

function getRavenISOFormattedDate(val) {
  return ko.observable(val).extend({ moment: true }).toAbsoluteDateISOString();
}

module.exports = {
  viewModel: AppointmentEditor,
  template: require('./appointment-editor.html')
}