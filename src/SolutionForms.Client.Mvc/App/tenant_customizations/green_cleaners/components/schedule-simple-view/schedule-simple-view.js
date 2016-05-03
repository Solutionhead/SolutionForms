import * as recurrenceUtils from '../../utils/appointment-recurrence-utils';
import reportView from '../daily-appointment-report/daily-appointment-report';
import 'local/printThis/printThis';

var _each = require('lodash/map'),
  toastr = require('toastr'),
  moment = require('moment');

ko.components.register('report-view', reportView);

require('koExtenders/knockout.extenders.moment');
require('bindings/datepicker');

ko.filters.moment = function(value, format) {
  return moment(value).format(format);
}
ko.punches.textFilter.enableForBinding('text');
ko.punches.interpolationMarkup.enable();

function ScheduleSimpleView(params) {
  if (!(this instanceof ScheduleSimpleView)) {
    return new ScheduleSimpleView(params);
  }

  var self = this, level1BreakHold, datesCache = {};;

  self.options = $.extend({}, ScheduleSimpleView.prototype.DEFAULT_OPTIONS, params.options || {});

  self.date = ko.observable(moment()).extend({ moment: 'M/D/YYYY' });
  self.showReport = ko.observable(false);
  self.selectedAppointment = ko.observable();

  self.filters = {
    teamId: ko.observable(),
    customerId: ko.observable(),
    endDate: ko.pureComputed(function() {
      return moment(self.date()).add(1, 'd');
    })
  }

  self.appointmentsByDate = ko.observableArray([]);

  self.toggleReportView = function() {
    self.showReport(!self.showReport());
  }

  self.appointmentsForCurrentDate = ko.pureComputed(() => {
    if (!self.date.isValid()) {
      return [];
    }

    return (ko.utils.arrayFirst(self.appointmentsByDate(), (d) => { return self.date.isSame(d.date); }) || { appointments: [] }).appointments;
  });

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

  self.printReport = function() {
    $('#report').printThis();
  }

  self.setEvents = function (data) {
    datesCache = {};
    var viewDate = moment(self.date()).toDate();
    ko.utils.arrayForEach(data, eventData => {
      if (eventData.Recurrence) {
        eventData.Date = moment(eventData.Date, 'YYYY-MM-DD').toDate(); // must be a Date instance!
        eventData.Recurrence.startDate = eventData.Date;
        var instances = recurrenceUtils.createRecurrenceInstances(viewDate, viewDate, eventData);
        ko.utils.arrayForEach(instances, apt => {
          // Convert dates to floating date string.
          eventData.Date = ko.observable(apt.date).extend({moment: true}).toFloatingDateString();
          eventData.Recurrence.startDate = ko.observable(eventData.Recurrence.startDate).extend({moment: true}).toFloatingDateString();
          delete eventData.date;
          addAppointment(eventData);
        });
      } else {
        addAppointment(eventData);
      }
    });

    self.resetControlBreaks();
    self.appointmentsByDate(_each(datesCache, function (value, key) {
      return {
        date: key,
        appointments: value.sort(function (a, b) {
          if(a.teamName < b.teamName) return -1;
          if(a.teamName > b.teamName) return 1;
          if (a.start._d < b.start._d) return -1;
          if (a.start._d > b.start._d) return 1;
          return 0;
        })
      }
    }));
  }

  self.resetControlBreaks = function() {
    level1BreakHold = undefined;
  }
  
  self.fetchEvents();
  
  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      fetchEvents: self.fetchEvents.bind(self)
    });
  }
  
  return self;

  function addAppointment(eventData) {
    //Trim the time specification off of the input value as this causes the date to be adjusted to the local timezone which may result in a change in the day
    eventData.Date = moment(eventData.Date, "YYYY-MM-DD").format("M/D/YYYY");

    var apt = new EventInstance({
      id: eventData.Id,
      date: eventData.Date,
      startTime: eventData["Start Time"],
      endTime: eventData["End Time"],
      label: eventData.Client.Name,
      location: eventData.Location,
      teamName: eventData.Team,
      notes: eventData.InternalNotes,
      clientNotes: eventData.Notes,
      isRecurring: eventData.Recurrence != undefined
    });
    apt.loadEventDetailsCommand = ko.command({
      execute: function(appt) {
        self.selectedAppointment(appt);
        self.options.onEventSelected(eventData);
      },
      canExecute: function() {
        return apt.id != undefined;
      }
    });
    
    insertAppointmentByDate(apt.date, apt);
  }
  function insertAppointmentByDate(date, appt) {
    var appts = datesCache[date];
    if (appts == undefined) {
      datesCache[date] = [];
    };
    datesCache[date].push(appt);
  }
}

ScheduleSimpleView.prototype.fetchEvents = function () {
  var self = this,
    beginningDateRange = self.date.format("YYYY-MM-DD"),
    endingDateRange = self.filters.endDate().format("YYYY-MM-DD"),
    lastRequest = self.__lastFetchEventsXhr;

  if (!self.date()) {
    return;
  }

  if (!self.date.isValid()) {
    toastr.error("The date is an invalid or unsupported format. Please use the format MM/DD/YYYY.", "Invalid date");
    return;
  }

  var q =
    // scheduled for a specific date YAY!
    "(RecurrenceType:[[NULL_VALUE]] AND StartDate:[" + beginningDateRange + " TO " + endingDateRange + "]) "

    // or scheduled recurrence is on this date 
    + "OR (!RecurrenceType:[[NULL_VALUE]] AND " 
      + "(StartDate: [* TO " + endingDateRange + "] AND (EndDate: [[NULL_VALUE]] OR EndDate: [" + beginningDateRange + " TO *]))"
    + ")"
    ;

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

ScheduleSimpleView.prototype.DEFAULT_OPTIONS = {
  onEventSelected: function() {}
}


//#region calendar rendering logic
function projectAppointmentData(data, viewDateRangeStart, viewDateRangeEnd) {
  var appointments = [];

  ko.utils.arrayForEach(data, function(d) {
    if (d.Recurrence == undefined) { addMappedAppointment(d); }
    else {
      d.Recurrence.startDate = d.Date;
      var firstOccurrenceCandidate = recurrenceUtils.getFirstOccurrenceFromRange(viewDateRangeStart, d.Recurrence);
      if (firstOccurrenceCandidate <= viewDateRangeEnd) {
        recurrenceUtils.createRecurrenceInstances(d.Recurrence, viewDateRangeStart, viewDateRangeEnd);
        d.Date = firstOccurrenceCandidate;
        addMappedAppointment(d);
      }
    }
  });

  return appointments;

  function addMappedAppointment(eventData) {
    var apt = new EventInstance({
      id: eventData.Id,
      client: eventData.Client,
      location: eventData.Location,
      notes: eventData.InternalNotes,
      date: eventData.Date,
      startTime: eventData['Start Time'],
      endTime: eventData['End Time'],
      teamName: eventData.Team,
      isRecurring: eventData.Recurrence != undefined
    });
    appointments.push(apt);
  }
  
}
//#endregion

module.exports = {
  name: 'Schedule Simple View',
  componentName: 'schedule-simple-view',
  viewModel: ScheduleSimpleView,
  template: require('./schedule-simple-view.html')
}

function EventInstance(values) {
  if (!(this instanceof EventInstance)) return new EventInstance(values);

  var self = this,
    fDate = getMomentDate(values.date);

  self.id = values.id;
  self.date = fDate;
  self.start = moment(fDate + ' ' + values.startTime);
  self.end = moment(fDate + ' ' + values.endTime);
  self.startTime = self.start.format('h:mma');
  self.endTime = self.end.format('h:mma');
  self.label = values.label;
  self.location = values.location;
  self.teamName = values.teamName;
  self.notes = values.notes,
  self.clientNotes = values.clientNotes,
  self.isRecurring = values.isRecurring || false;
  
  return self;
}
EventInstance.prototype.DEFAULTS = {
  isRecurring: false
}

function getMomentDate(dateValue) {
  return moment(dateValue).format('MM/DD/YYYY');
}