import moment from 'moment';
import Appointment from '../models/scheduling-models';
import find from 'lodash/find';

export function createRecurrenceInstances(startDate, endDate, eventData) {
  var result = [];
  eventData.Recurrence.startDate = eventData.Date;

  if (eventData.Recurrence.daysOfWeek && eventData.Recurrence.daysOfWeek.length) {
    eventData.Recurrence.daysOfWeek.forEach(day => {
      eventData.Recurrence.dayOfWeek = day;
      createInstances();
    });
  } else {
    createInstances();
  }

  function createInstances() {
    var instanceDate = getFirstOccurrenceDateFromRange(startDate, eventData.Recurrence),
      exceptions = eventData.Recurrence.Exceptions || [];

    while (instanceDate >= startDate && instanceDate <= endDate && (eventData.Recurrence.endDate == undefined || instanceDate <= moment(eventData.Recurrence.endDate).toDate())) {
      if (!exceptions.length || find(exceptions, (exDate) => { return moment(exDate, "YYYY-MM-DD").isSame(instanceDate); }) == undefined) {
        eventData.date = instanceDate;
        result.push(new Appointment(eventData));
      }

      instanceDate = getNextInstanceDateForRecurrence(instanceDate, eventData.Recurrence);
    }
  }

  return result;
}

export function getFirstOccurrenceDateFromRange(startDate, recurrence) {
  switch (recurrence.recurrenceType) {
    case "Monthly": return getFirstOccurrenceForMonthlyRecurrence(startDate, recurrence);
    case "Weekly": return getFirstOccurrenceForWeeklyRecurrence(startDate, recurrence.startDate, recurrence.interval, recurrence.dayOfWeek);
    default: throw new Error(`Missing, invalid or unsupported recurrence type encountered. Value: "${recurrence.recurrenceType}"`);
  }
}

export function getFirstOccurrenceForMonthlyRecurrence(startDate, recurrence) {
  if (recurrence.dayOfMonth > 0) {
    throw new Error('Monthly by date recurrences are not currently supported :(');
  }

  var recurrenceInterval = recurrence.interval;

  var instanceMonth = moment(startDate).date(1);

  if (recurrenceInterval > 1) {
    const recurrenceStartMonth = moment(recurrence.startDate).date(1);
    const adjust = (instanceMonth.year() - recurrenceStartMonth.year()) * 12;
    const diffInMonths = Math.abs((instanceMonth.month() - recurrenceStartMonth.month()) + adjust);

    // mod by recurrence interval
    var remainder = diffInMonths % recurrenceInterval;

    // adjust date if mod !== 0 
    if (remainder > 0) {
      instanceMonth = moment(startDate).add(recurrenceInterval - remainder, "months");
    }
  }

  return getNextDateForMonthlyRecurrencePattern(instanceMonth.toDate(), recurrence);
}

export function getFirstOccurrenceForWeeklyRecurrence(startDate, recurrenceStartDate, recurrenceInterval, recurrenceDayOfWeek) {
  var instanceWeek = startDate;
  if (recurrenceInterval > 1) {
    // Ensure the date aligns with the recurrence interval
    var diffInDays = Math.abs(dateDiffInDays(getFirstCalendarDayOfWeek(startDate), getFirstCalendarDayOfWeek(recurrenceStartDate)));
    var remainder = (diffInDays / 7) % recurrenceInterval;
    if (remainder > 0) {
      // interval is incorrect. adjust date to align with next interval.
      instanceWeek = moment(startDate).add(recurrenceInterval - remainder, "days").toDate();
    }
  }

  // adjust date so it matches the recurrence pattern
  return getNextDateForDay(instanceWeek, recurrenceDayOfWeek);
}

export function getFirstCalendarDayOfWeek(date, firstDayOfCalendarWeek) {
  firstDayOfCalendarWeek = firstDayOfCalendarWeek || 1; //Monday is the first day of GC's calendar week
  var day = date.getDay(),
    diff = day - firstDayOfCalendarWeek;

  if (diff < 0) {
    diff = 7 - Math.abs(diff);
  }
  return moment(date).add(-diff, "days").toDate();
}

export function getNextDateForDay(date, dayOfWeek) {
  var day1 = date.getDay(),
    day2 = convertDayNameToNumeric(dayOfWeek);
  var diff = day2 - day1;
  if (diff < 0) { diff = diff + 7; }
  return moment(date).add(diff, "days").toDate();
}

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
        utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function convertDayNameToNumeric(dayName) {
  switch (dayName.toLowerCase()) {
    case "sunday": return 0;
    case "monday": return 1;
    case "tuesday": return 2;
    case "wednesday": return 3;
    case "thursday": return 4;
    case "friday": return 5;
    case "saturday": return 6;
    default: throw new Error("Invalid dayName value: '" + dayName + "'");
  }
}

function getNextInstanceDateForRecurrence(previousInstanceDate, recurrence) {
  switch (recurrence.recurrenceType) {
    case "Weekly": return getNextInstanceDateForWeeklyRecurrence();
    case "Monthly": return getNextInstanceDateForMonthlyRecurrence();
  }

  function getNextInstanceDateForWeeklyRecurrence() {
    return moment(previousInstanceDate).add(recurrence.interval, "weeks").toDate();
  }
  function getNextInstanceDateForMonthlyRecurrence() {
    // monthly by indexed day only
    const mDate = moment(previousInstanceDate);
    const firstOfNextMonth = mDate.month(mDate.month() + recurrence.interval).date(1).toDate();
    return getNextDateForMonthlyRecurrencePattern(firstOfNextMonth, recurrence);
  }
}

function getNextDateForMonthlyRecurrencePattern(seedDate, recurrence) {
  return recurrence.index === -1
      ? lastDayRecurrence(seedDate, recurrence.dayOfWeek)
      : getNextDateForMonthlyByDayRecurrencePattern(seedDate, recurrence.dayOfWeek, recurrence.index);

  function getNextDateForMonthlyByDayRecurrencePattern(monthDate, dayOfWeek, indexOfWeekInMonth) {
    const dayIndexWanted = convertDayNameToNumeric(dayOfWeek);

    var indexWanted = indexOfWeekInMonth;
    const dateOfFirstOfMonth = moment(monthDate).date(1);
    const dayOfFirstOfMonth = dateOfFirstOfMonth.day();
    const diffInDays = dayIndexWanted - dayOfFirstOfMonth;
    if (dayIndexWanted >= dayOfFirstOfMonth) {
      indexWanted--;
    }

    return dateOfFirstOfMonth.add((7 * indexWanted) + diffInDays, "days").toDate();
  }

  function lastDayRecurrence(monthDate, dayOfWeek) {
    const dayIndexWanted = convertDayNameToNumeric(dayOfWeek);
    const lastDayOfMonth = moment(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
    const dayOfLastDayOfMonth = lastDayOfMonth.day();
    var diff = dayIndexWanted - dayOfLastDayOfMonth;
    if (dayIndexWanted > dayOfLastDayOfMonth) {
      diff = diff - 7;
    }
    return lastDayOfMonth.add(diff, "days").toDate();
  }
}