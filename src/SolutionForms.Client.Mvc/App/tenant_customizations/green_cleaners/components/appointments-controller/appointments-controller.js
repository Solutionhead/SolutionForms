import {prepareFilterString} from 'App/utils/luceneUtils';
import * as recurrenceUtils from '../../utils/appointment-recurrence-utils';
import 'bindings/datepicker';
import _sortBy from 'lodash/sortBy';
import reportView from '../daily-appointment-report/daily-appointment-report';
import 'local/printThis/printThis';

ko.components.register('report-view', reportView);
ko.components.register('appointments-day-view', require('../schedule-simple-view/schedule-simple-view'));
ko.components.register('appointment-editor', require('../appointment-editor/appointment-editor'));
require('bindings/ko.bindings.bs-modal');
import EventInstance from '../../models/EventInstance';
var toastr = require('toastr'),
  moment = require('moment'), 
  datesCache = {},
  _each = require('lodash/map'),
  toastr = require('toastr');


function AppointmentsController() {
  if (!(this instanceof AppointmentsController)) { return new AppointmentsController(); }
  var self = this;

  self.selectedEvent = ko.observable();
  self.showModal = ko.observable();
  self.showReport = ko.observable(false);
  self.appointmentsByDayViewModel = ko.observable();
  self.appointmentEditorViewModel = ko.observable();
  self.startDateFilter = ko.observable(moment()).extend({ moment: 'M/D/YYYY' });
  self.endDateFilter = ko.observable().extend({ moment: 'M/D/YYYY' });
  self.customerFilter = ko.observable();
  self.appointmentsByDate = ko.observableArray([]);

  self.isCurrentEventRecurring = ko.computed(function() {
    var editorVm = self.appointmentEditorViewModel();
    return editorVm && editorVm.isRecurringAppointment();
  });
  self.isCurrentEventNew = ko.pureComputed(function() {
    var editorVm = self.appointmentEditorViewModel();
    return editorVm && editorVm.isNewAppointment();
  });
  self.appointmentsDayViewOptions = {
    appointments: self.appointmentsByDate,
    onEventSelected: function(apt) {
      self.selectedEvent(apt.rawData);
      self.showModal(apt != undefined);
    }
  }

  self.appointmentEditorConfig = {
    appointmentData: self.selectedEvent
  }

  self.searchAppointmentsCommand = ko.command({
    execute: fetchEvents
  }); 
  var startDate = ko.pureComputed(() => {
    var date = self.startDateFilter();
    if (date == undefined) self.selectedEvent(null);
    var d = moment(date, 'MM/DD/YYYY');
    return d.isValid() ? d : moment();
  });
  var endDate = ko.pureComputed(() => {
    var customerId = self.customerFilter();
    if (customerId != undefined && customerId !== '') {
      return moment(startDate()).add(6, "months");
    }

    var date = self.endDateFilter();
    return date == undefined ?
      moment(startDate()).add(1, 'd') : 
      moment(date, 'MM/DD/YYYYH');
  });


  //todo: consider returning all events in range
  self.appointmentsForCurrentDate = ko.pureComputed(() => {
    var mDate = startDate();
    if (!mDate.isValid()) {
      return [];
    }

    return (ko.utils.arrayFirst(self.appointmentsByDate(), (d) => { return mDate.isSame(moment(d.date, 'MM/DD/YYYY')); }) || { appointments: [] }).appointments;
  });

  ko.postbox.subscribe("appointment-saved", () => {
      fetchEvents();
  });

  ko.postbox.subscribe("appointment-deleted", () => {
      fetchEvents();
  });
  
  self.newEvent = ko.command({
    execute: function () {
      //todo: set date from day view
      self.selectedEvent({
        Date: startDate().toDate()
      });
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
  self.printReport = function() {
    $('#report').printThis();
  }


  self.setEvents = function (data) {
    datesCache = {};
    var viewDate = startDate().toDate();
    ko.utils.arrayForEach(data, eventData => {
      if (eventData.Recurrence) {
        eventData.Date = moment(eventData.Date, 'YYYY-MM-DD').toDate(); // must be a Date instance!
        eventData.Recurrence.startDate = eventData.Date;
        var instances = recurrenceUtils.createRecurrenceInstances(viewDate, endDate().toDate(), eventData);
        ko.utils.arrayForEach(instances, apt => {
          // Convert dates to floating date string.
          eventData.Date = ko.observable(apt.date).extend({ moment: true }).toFloatingDateString();
          eventData.Recurrence.startDate = ko.observable(eventData.Recurrence.startDate).extend({ moment: true }).toFloatingDateString();
          delete eventData.date;
          self.addAppointment(eventData);
        });
      } else {
        self.addAppointment(eventData);
      }
    });

    self.appointmentsByDate(_each(datesCache, function (value, key) {
      return {
        date: key,
        appointments: _sortBy(value, 'teamName', 'start')
      }
    }));
  }

  startDate.subscribe(function (val) {
    if (val) { fetchEvents(); }
  });

  function fetchEvents() {
    return self.fetchEvents(startDate(), endDate(), self.customerFilter());
  }

  fetchEvents();
  return self;
}

AppointmentsController.prototype.fetchEvents = function (startDate, endDate, clientId) {
  //startDate and endDate are expected to be moment instances. 
  if (!startDate) {
    return;
  }

  if (!startDate.isValid()) {
    toastr.error("The date is an invalid or unsupported format. Please use the format MM/DD/YYYY.", "Invalid date");
    return;
  }

  var self = this,
    beginningDateRange = startDate.format("YYYY-MM-DD"),
    endingDateRange = endDate.format("YYYY-MM-DD"),
    lastRequest = self.__lastFetchEventsXhr;

  var q =
    // scheduled for a specific date YAY!
    "(RecurrenceType:[[NULL_VALUE]] AND StartDate:[" + beginningDateRange + " TO " + endingDateRange + "]) "

    // or scheduled recurrence is on this date 
    + "OR (!RecurrenceType:[[NULL_VALUE]] AND "
      + "(StartDate: [* TO " + endingDateRange + "] AND (EndDate: [[NULL_VALUE]] OR EndDate: [" + beginningDateRange + " TO *]))"
    + ")"
  ;

  if (clientId) {
    q = `(${q}) AND ClientId:"${clientId}"`;
  }

  console.log(q);
  var query = encodeURI(q),
    cursor = {
      index: 0,
      query: null,
      pageSize: 300
    };

  // if ajax call is already running and the query is unchanged
  if (lastRequest && lastRequest.xhr.state() === "pending") {
    if (query === lastRequest.queryString) {
      return;
    } else {
      // else cancel query and start another
      //lastRequest.xhr.abort();
    }
  }

  self.__lastFetchEventsXhr = {
    queryString: query,
    xhr: executeGetEvents()
  }

  function executeGetEvents() {
    if (query !== cursor.query || !cursor.query) {
      cursor.query = query;
      cursor.index = 0;
      cursor.results = [];
    }

    return $.ajax({
      url: `/api/d/index?id=appointments%2FbyDateRange&$filter=${cursor.query}&$top=${cursor.pageSize}&$skip=${cursor.index}&$includes=ClientId`,
      dataType: 'json'
    })
      .done((data) => {
        ko.utils.arrayPushAll(cursor.results, data);

        //automatically fetch next page of data
        if (data.length >= cursor.pageSize) {
          cursor.index += data.length;
          executeGetEvents();
        } else {
          self.setEvents(data);
        }
      })
      .fail(function () {
        toastr.error('Failed to load appointments');
        console.log('fail');
        console.log(arguments);
      });
  }
}

AppointmentsController.prototype.lookupClients = function(searchTerm, callback) {
  searchTerm = prepareFilterString(searchTerm);
  $.ajax({
    dataType: "json",
    url: `/api/d/index?id=${encodeURI("clients/byName")}&$filter=Name:*${encodeURI(searchTerm)}*`
  }).done(callback)
  .fail(() => { toastr.error("Failed to return clients")});
}

AppointmentsController.prototype.addAppointment = function(eventData) {
  //Trim the time specification off of the input value as this causes the date to be adjusted to the local timezone which may result in a change in the day
  eventData.Date = moment(eventData.Date, "YYYY-MM-DD").format("M/D/YYYY");

  const key = haveKey(eventData) ? ' (KEY)' : '';
  var apt = new EventInstance({
    id: eventData.Id,
    date: eventData.Date,
    startTime: eventData["Start Time"],
    endTime: eventData["End Time"],
    label: `${eventData.Client.Name} ${key}`,
    location: eventData.Location,
    teamName: eventData.Team,
    notes: eventData.InternalNotes,
    clientNotes: eventData.Notes,
    isRecurring: eventData.Recurrence != undefined
  });
  apt.rawData = eventData;
  
  insertAppointmentByDate(apt.date, apt);

  function insertAppointmentByDate(date, appt) {
    var appts = datesCache[date];
    if (appts == undefined) {
      datesCache[date] = [];
    };
    datesCache[date].push(appt);
  }
  function haveKey(eventData) {
    return (eventData.HaveKey && eventData.HaveKey.length && eventData.HaveKey[0] === "Yes") || false;
  }
}

module.exports = {
  viewModel: AppointmentsController,
  template: require('./appointments-controller.html'),
  name: 'Appointment Scheduler',
  componentName: 'appointments-controller'
}