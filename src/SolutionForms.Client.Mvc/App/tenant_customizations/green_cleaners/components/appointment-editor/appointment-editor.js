import 'bindings/ko.bindings.jq-autocomplete';
import toastr from 'toastr';
import {prepareFilterString} from 'App/utils/luceneUtils';

if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

if (!ko.components.isRegistered('recurrence-scheduler')) {
  ko.components.register('recurrence-scheduler', require('../recurrence-scheduler/recurrence-scheduler'));
}
if (!ko.components.isRegistered('form-field')) {
  ko.components.register('form-field', require('components/form-field/form-field'));
}

var moment = require('moment');
var locationTopic = "new-client_location_changed";
var newClientHasKeyTopic = "new-client_has-key_changed";

function AppointmentEditor(params) {
  if (!(this instanceof AppointmentEditor)) {
    return new AppointmentEditor(params);
  }

  var self = this, originalValues, editClient = ko.observable(false);
  
  self.clientType = ko.observable('existing');
  self.selectedCustomer = ko.observable();
  self.eventEditorVm = ko.observable();
  self.recurrenceInput = ko.observable();
  self.recurrenceEditorExport = ko.observable();
  self.showRecurrence = ko.observable(false);

  self.newClientVm = ko.observable();

  var currentEventId = ko.observable();

  self.isNewAppointment = ko.pureComputed(function() {
    return currentEventId() == undefined;
  });
  self.isRecurringAppointment = ko.pureComputed(function() {
    return self.recurrenceInput() != undefined;
  });
  self.showRepeatButton = ko.pureComputed(function() {
    return !self.isRecurringAppointment() && !self.showRecurrence();
  });
  self.enterNewCustomer = ko.pureComputed(function() {
    return self.clientType() === 'new';
  });
  self.enableClientEditor = ko.pureComputed(function() {
    return self.selectedCustomer() == undefined || editClient();
  });
  self.clientName = ko.pureComputed(function() {
    var c = self.selectedCustomer();
    return c && c.Name;
  });

  self.editSeriesCommand = ko.command({
    execute: function () {
      const editorVm = self.eventEditorVm();
      if (self.isNewAppointment() || originalValues.Recurrence == undefined) {
        const date = moment(editorVm.getFieldValue("Date", "YYYY-MM-DD"));
        if (date.isValid())  { self.recurrenceInput({ startDate: date.format("M/D/YYYY") }); }
      } else if (originalValues.Recurrence) {
          editorVm.currentInstanceDate = editorVm.getFieldValue("Date");
          editorVm.setFieldValue("Date", originalValues.Recurrence.startDate);
      }
      self.showRecurrence(true);
      
      editorVm.hideField("Date");
    },
    canExecute: function() {
      return (self.isRecurringAppointment() && !self.showRecurrence())
        || !self.isRecurringAppointment();
    }
  });

  // functions
  self.toggleClientEditor = function() {
    editClient(!editClient());
  }

  var __disposables = [];

  // subscriptions
  var oneTime = self.eventEditorVm.subscribe(function(eventEditor) {
    if (eventEditor == undefined) return;

    // NOTE: This is a crummy hack because of the fact that the isReady value isn't working as expected.
    // If the isReady were working, this computed could be replace by the following:
    //   if (eventEditor && eventEditor.isReady()) {
    //     eventEditor.hideField('ClientName');
    //   }
    var remainingHacks = [];
    var hack1 = ko.computed(function() {
      var f = eventEditor.getFieldContextByName('HaveKey');
      if (!f) { return; }
      __disposables.push(f.subscribeTo(newClientHasKeyTopic));
      cleanupHacks(hack1);
    });
    remainingHacks.push(hack1);

    var hack2 = ko.computed(function () {
      var f = eventEditor.getFieldContextByName('Location');
      if (!f) { return; }
      __disposables.push(f.subscribeTo(locationTopic));
      cleanupHacks(hack2);
    });
    remainingHacks.push(hack2);

    function cleanupHacks(hack) {
      ko.utils.arrayRemoveItem(remainingHacks, hack);
      hack.dispose();

      if (!remainingHacks.length) {
        oneTime.dispose();
        oneTime = null;
      }
    }
  });
  self.clientType.subscribe(function (val) {
    var editor = self.eventEditorVm(),
      newClientEditor = self.newClientVm();

    if (!editor) return;
    if (val === 'new') {
      editor.hideField('ClientNotes');
      // set values from new client
      if (newClientEditor) {
        editor.setFieldValue('Location',  newClientEditor.getFieldValue('Address'));
        editor.setFieldValue('HaveKey',  newClientEditor.getFieldValue('HaveKey'));
        editor.setFieldValue('ClientNotes',  newClientEditor.getFieldValue('Notes'));
      }
    } else {
      // set values from selected existing client
      editor.showField("ClientName");
      editor.showField("ClientNotes");
    }
  });
  self.newClientVm.subscribe(function(vm) {
    if (!vm) { return; }
    
    var isReadyWatcher = ko.computed(function() {
      if (!vm.isReady()) { return; }

      vm.getFieldContextByName('Address')
        .publishOn(locationTopic);

      vm.getFieldContextByName('HaveKey')
        .publishOn(newClientHasKeyTopic);

      vm.setFieldValues({
        City: "Las Cruces",
        State: "NM"
      });

      isReadyWatcher.dispose();
      isReadyWatcher = null;
    });
  });
  self.selectedCustomer.subscribe(function(val) {
    var eventEditor = self.eventEditorVm();
    if (eventEditor == undefined) { return; }
    val = val || {};

    eventEditor.setFieldValue('ClientName', val.Name);
    eventEditor.setFieldValue('Location', val.Address);
    eventEditor.setFieldValue('Notes', val.Notes);
    eventEditor.setFieldValue('HaveKey', val.HaveKey);
  });
  params.input.appointmentData.subscribe(function (values) {
    originalValues = ko.utils.parseJson(ko.toJSON(values));
    currentEventId(values && values.Id);
    self.selectedCustomer(values ? values.Client : null);
    editClient(false);

    var eventEditor = self.eventEditorVm();
    eventEditor.showField("Date");
    eventEditor.showField("ClientNotes");

    if (originalValues && originalValues.Id) {
      //self.selectedCustomer(values.ClientId);
    }

    
    if (values != undefined) {
      var recurrence = null;
      if (values.Recurrence) {
        recurrence = values.Recurrence;
        //recurrence.startDate = values.Date;
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
      isRecurringAppointment: self.isRecurringAppointment,
      saveAppointmentAsync: function() {
        return self.saveAppointmentAsync(currentEventId(), originalValues);
      },
      deleteSingleRecurrenceInstanceAsync: function () {
        var id = currentEventId();
        return self.submitRecurrenceExceptionForDateAsync(id, originalValues.Date)
          .done(() => {
            ko.postbox.publish('appointment-saved', id);
          });
      },
      deleteAppointmentAndFutureRecurrencesAsync: function () {
        return self.endRecurringEventAsOfDateAsync(currentEventId(), self.eventEditorVm().currentInstanceDate);
      },
      deleteEventAsync: function() {
        return self.deleteEventAsync(currentEventId());
      }
    });
  }

  self.dispose = function() {
    ko.utils.arrayForEach(__disposables, function(d) {
      d && d.dispose && d.dispose();
    });
  }

  return self;
}

AppointmentEditor.prototype.lookupClients = function(searchTerm, callback) {
  searchTerm = prepareFilterString(searchTerm);
  $.ajax({
    dataType: "json",
    url: `/api/d/index?id=${encodeURI("clients/byName")}&$filter=Name:*${encodeURI(searchTerm)}*`
  }).done(callback)
  .fail(() => { toastr.error("Failed to return clients")});
}
AppointmentEditor.prototype.saveAppointmentAsync = function(id, initialValues) {
  var self = this;
  var event = self.eventEditorVm().buildDto();
  
  event.Recurrence = self.showRecurrence() ?
    self.recurrenceEditorExport().buildDto() :
    null;

  var $dfd = $.Deferred();

  if (self.enterNewCustomer()) {
    //todo check validation on customer object
    var customerData = self.newClientVm().buildDto();
    $dfd = $.ajax("/api/d/clients", {
      data: ko.toJSON(customerData),
      dataType: 'json',
      contentType: 'application/json',
      method: 'POST'
    }).done((response) => {
      //todo: write test for this assignment after creation of new client
      event.ClientId = response.Id;
      toastr.success(`New Customer Added: ${customerData.Name}`);
      $dfd.done(() => self.postOrPutEvent(id, event));
      self.newClientVm().setFieldValues({});
    }).fail(() => { toastr.error("We were unable to create new the client. The appointment could not be added.", "Appointment Not Added") });
    
    return $dfd;
  }
  const client = self.selectedCustomer() || {};
  event.ClientId = client.Id;
  if (event.ClientId == undefined) {
    toastr.fail("The client is missing.", "Unable to save appointment");
    throw new Error("Unable to determine client.");
  }

  if (isRecurrenceException()) {
    // TEST: ensure that the event's original date value is used for setting the excpetion.
    //   --> If the occurrence's date was modified we still want the recurrence exception to
    //       override the recurring event for the day the recurrence was modified.

    return self.submitRecurrenceExceptionForDateAsync(id, initialValues.Date)
      .done(function() {
        self.postOrPutEvent(null, event);
      });
  }

  return self.postOrPutEvent(id, event);


  function isRecurrenceException() {
    return id && self.recurrenceInput() != undefined && event.Recurrence == undefined;
  }
}

AppointmentEditor.prototype.postOrPutEvent = function(id, values) {
  const isNew = id == undefined;
  return $.ajax(`/api/d/appointments/${isNew ? '' : id}?awaitIndexing=true`, {
    data: ko.toJSON(values),
    dataType: 'json',
    contentType: 'application/json',
    method: isNew ? 'POST' : 'PUT'
  }).done((response) => {
    ko.postbox.publish('appointment-saved', response);
  });
}

AppointmentEditor.prototype.deleteEventAsync = function (id) {
  return $.ajax("/api/d/appointments/" + id, {
    dataType: 'json',
    contentType: 'application/json',
    method: 'DELETE'
  }).done(() => {
    ko.postbox.publish('appointment-deleted', id);
  });
}

AppointmentEditor.prototype.submitRecurrenceExceptionForDateAsync = function(eventId, date) {
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var ARGUMENT_NAMES = /([^\s,]+)/g;
  function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
      result = [];
    return result;
  }

  var args = {};
  args[getParamNames(createRecurrenceException)[0]] = getFormattedDateString(date);

  //NOTE: the `exDate` property name must match the argument name in `createRecurrenceException`
  return issuePatch("/api/d/appointments/" + eventId,
    getMethodBodyAsString(createRecurrenceException),
    args
  );

  function createRecurrenceException(exDate) {
    this.Recurrence.Exceptions = this.Recurrence.Exceptions || [];
    // NOTE: this must be vanilla JS because it will be run inside Raven. The indexOf method,
    // however, is a wrapper function around Lo-Dash's _.indexOf provided my Raven. 
    // See https://ravendb.net/docs/article-page/3.0/csharp/client-api/commands/patches/how-to-use-javascript-to-patch-your-documents
    (-1===this.Recurrence.Exceptions.indexOf(exDate)) && this.Recurrence.Exceptions.push(exDate);
  }
}

AppointmentEditor.prototype.endRecurringEventAsOfDateAsync = function(eventId, date) {
  return issuePatch("/api/d/appointments/" + eventId,
    "this.Recurrence.endDate = \"" + getFormattedDateString(date) + "\";",
    {}).done((response) => {
      ko.postbox.publish('appointment-saved', eventId);
    });
}

function issuePatch(url, patchScript, patchValues) {
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

function getFormattedDateString(val) {
  return ko.observable(val).extend({ moment: true }).toFloatingDateString();
}

module.exports = {
  viewModel: AppointmentEditor,
  template: require('./appointment-editor.html')
}