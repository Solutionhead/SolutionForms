var _each = require('lodash/map'),
  toastr = require('toastr'),
  moment = require('moment');

require('koExtenders/knockout.extenders.moment');
require('bindings/datepicker');

ko.punches.interpolationMarkup.enable();

ko.filters.moment = function(value, format) {
  return moment(value).format(format);
}

function ScheduleSimpleView(params) {
  if (!(this instanceof ScheduleSimpleView)) {
    return new ScheduleSimpleView(params);
  }

  var self = this, level1BreakHold;

  self.options = $.extend({}, ScheduleSimpleView.prototype.DEFAULT_OPTIONS, params.options || {});

  self.date = ko.observable(moment()).extend({ moment: 'M/D/YYYY' });
  self.selectedAppointment = ko.observable();

  self.filters = {
    teamId: ko.observable(),
    customerId: ko.observable(),
    endDate: ko.pureComputed(function() {
      return moment(self.date()).add(1, 'd');
    })
  }

  self.appointmentsByDate = ko.observableArray([]);

  self.date.subscribe(function (val) {
    level1BreakHold = null;
    if (val) { self.fetchEvents(); }
    self.options.onEventSelected(null);
  });

  self.renderTeamHeader = function (appointment) {
    if (level1BreakHold !== appointment.teamName) {
      level1BreakHold = appointment.teamName;
      return true;
    }
    return false;
  }
  
  self.fetchEvents();
  
  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      fetchEvents: self.fetchEvents.bind(self)
  });
  }

  return self;
}

ScheduleSimpleView.prototype.fetchEvents = function() {
  var datesCache = {};
  var self = this,
    beginningDateRange = self.date.format("YYYY-MM-DD"),
    endingDateRange = self.filters.endDate().format("YYYY-MM-DD"),
    lastRequest = self.__lastFetchEventsXhr;

  var q = "StartDate:[" + beginningDateRange + " TO " + endingDateRange + "]"
    + "OR (" + recurringEventIsInRange(endingDateRange)
    + " AND " + eventIsOnTheCorrectDay(self.date.format("dddd"))
    + " AND (*:* AND NOT Exceptions:" + self.date.toAbsoluteDateISOString() + ")" // exclude recurring events with an exception on the current date
    + ")";
  console.log(q);
  var query = encodeURI(q);

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

  function appointmentDatePredicate(obj) {
    return obj['Date'];
  }
  function getAppointmentsByDate(obj) {
    return datesCache[appointmentDatePredicate(obj)];
  }
  function executeGetEvents() {
    return $.ajax({
      url: '/api/d/index?id=events%2FbyDateRange&$query=' + query,
      dataType: 'json'
    })
      .done(function (data) {
        datesCache = {};
        ko.utils.arrayForEach(data, addAppointment);

        self.appointmentsByDate(_each(datesCache, function(value, key) {
          return {
            date: key,
            appointments: value.sort(function(a, b) {
              return b.end._d - a.start._d;
            })
          }
        }));
      })
      .fail(function () {
        toastr.error('Failed to load appointments');
        console.log('fail');
        console.log(arguments);
      });

  }
  function addAppointmentDate(obj) {
    datesCache[appointmentDatePredicate(obj)] = [];
    return datesCache[appointmentDatePredicate(obj)];
  }
  function addAppointment(eventData) {
    //remap recurring events to contain a current date
    if (eventData.Recurrence != undefined) {
      eventData["Date"] = self.date();
    }

    var apt = new EventInstance({
      id: eventData.Id,
      customerName: eventData.Client.Name,
      location: eventData.Client.Address,
      date: appointmentDatePredicate(eventData),
      startTime: eventData['Start Time'],
      endTime: eventData['End Time'],
      teamName: eventData['Team'],
      isRecurring: eventData.Recurrence != undefined,
    });
    apt.loadEventDetailsCommand = ko.command({
      execute: function (appt) {
        self.selectedAppointment(appt);
        self.options.onEventSelected(eventData);
      },
      canExecute: function() {
        return apt.id != undefined;
      }
    });
    var dateAppts = getAppointmentsByDate(eventData) || addAppointmentDate(eventData);
    dateAppts.push(apt);
  }
}
ScheduleSimpleView.prototype.DEFAULT_OPTIONS = {
  onEventSelected: function() {}
}
function recurringEventIsInRange(endingDate) {
  return eventHasOrWillHaveStartedQuery(endingDate) + " AND " + eventHasNotEndedQuery(endingDate);
}
function eventHasOrWillHaveStartedQuery(endingDate) {
  return "StartDate: [* TO " + endingDate + "]";
}
function eventHasNotEndedQuery(endingDate) {
  return "EndDate: [" + endingDate + " TO *]";
}
function eventIsOnTheCorrectDay(day) {
  return "@in<RecurrenceDays>: (\"" + day+ "\")";
}

module.exports = {
  name: 'Schedule Simple View',
  componentName: 'schedule-simple-view',
  viewModel: ScheduleSimpleView,
  template: require('./schedule-simple-view.html')
}

function EventInstance(values) {
  if (!(this instanceof EventInstance)) return new EventInstance(values);

  var self = this,
    fDate = formatDate(values.date);

  self.id = values.id;
  self.start = moment(fDate + ' ' + values.startTime);
  self.end = moment(fDate + ' ' + values.endTime);
  self.customerName = values.customerName;
  self.title = values.title;
  self.location = values.location;
  self.teamName = values.teamName;
  self.date = fDate;
  self.startTime = self.start.format('h:mma');
  self.endTime = self.end.format('h:mma');
  self.description = values.description;
  self.isRecurring = values.isRecurring || false;
  
  return self;
}

function formatDate(dateValue) {
  return moment(dateValue).format('MM/DD/YYYY');
}