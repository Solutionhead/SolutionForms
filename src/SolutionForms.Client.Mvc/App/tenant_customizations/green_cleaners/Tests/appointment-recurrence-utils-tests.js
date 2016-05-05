import test from 'tape';
import * as recurrenceUtils from '../utils/appointment-recurrence-utils';
import moment from 'moment';

test('getFirstCalendarDayOfWeek returns the correct date.', function(t) {
  const sunday = 0, monday = 1, tuesday = 2, wedday = 3, thursday = 4, friday = 5, saturday = 6;
  t.plan(2);
  t.equal(recurrenceUtils.getFirstCalendarDayOfWeek(new Date(2016, 3, 20), monday).toDateString(), new Date(2016, 3, 18).toDateString());
  t.equal(recurrenceUtils.getFirstCalendarDayOfWeek(new Date(2016, 3, 20), friday).toDateString(), new Date(2016, 3, 15).toDateString());
});

test('getNextDateForDay returns the correct date when date falls within same week.', function(t) {
  t.plan(1);
  t.equal(recurrenceUtils.getNextDateForDay(new Date(2016, 3, 20), "Friday").toDateString(), new Date(2016, 3, 22).toDateString());
});

test('getNextDateForDay returns the correct date when date falls on the next week.', function(t) {
  t.plan(1);
  t.equal(recurrenceUtils.getNextDateForDay(new Date(2016, 3, 20), "Monday").toDateString(), new Date(2016, 3, 25).toDateString());
});

test('getNextDateForDay returns same date as input when the requested day is the same as the date passed in.', function(t) {
  t.plan(1);
  t.equal(recurrenceUtils.getNextDateForDay(new Date(2016, 3, 20), "Wednesday").toDateString(), new Date(2016, 3, 20).toDateString());
});

test('getFirstOccurrenceForWeeklyRecurrence correctly returns date when the next apointment occurrence is the following day with recurrence interval 1', function(t) {
  t.plan(1);
  const viewDateRangeStart = new Date(2016, 3, 21),
    recurrenceStartDate = new Date(2016, 2, 30),
    recurrenceInterval = 1,
    recurrenceDayOfWeek = "Thursday";

  var firstOccurrenceFromRange = recurrenceUtils.getFirstOccurrenceForWeeklyRecurrence(viewDateRangeStart, recurrenceStartDate, recurrenceInterval, recurrenceDayOfWeek);
  t.equal(firstOccurrenceFromRange.toDateString(), new Date(2016, 3, 21).toDateString());
});

test('getFirstOccurrenceForWeeklyRecurrence correctly returns date when the next apointment occurrence is the following day with interval 2', function(t) {
  t.plan(1);
  const viewDateRangeStart = new Date(2016, 3, 20),
    recurrenceStartDate = new Date(2016, 3, 7),
    recurrenceInterval = 2,
    recurrenceDayOfWeek = "Thursday";

  var firstOccurrenceFromRange = recurrenceUtils.getFirstOccurrenceForWeeklyRecurrence(viewDateRangeStart, recurrenceStartDate, recurrenceInterval, recurrenceDayOfWeek);
  t.equal(firstOccurrenceFromRange.toDateString(), new Date(2016, 3, 21).toDateString());
});

test('getFirstOccurrenceForWeeklyRecurrence correctly returns date when the next apointment occurrence is the following week day with interval 2', function(t) {
  t.plan(1);
  const viewDateRangeStart = new Date(2016, 3, 20),
    recurrenceStartDate = new Date(2016, 3, 14),
    recurrenceInterval = 2,
    recurrenceDayOfWeek = "Thursday";

  var firstOccurrenceFromRange = recurrenceUtils.getFirstOccurrenceForWeeklyRecurrence(viewDateRangeStart, recurrenceStartDate, recurrenceInterval, recurrenceDayOfWeek);
  t.equal(firstOccurrenceFromRange.toDateString(), new Date(2016, 3, 21).toDateString());
});

test('getFirstOccurrenceForWeeklyRecurrence correctly returns date when the next apointment occurrence is the following day with interval 3', function(t) {
  t.plan(1);
  const viewDateRangeStart = new Date(2016, 3, 20),
    recurrenceStartDate = new Date(2016, 2, 31),
    recurrenceInterval = 3,
    recurrenceDayOfWeek = "Thursday";

  var firstOccurrenceFromRange = recurrenceUtils.getFirstOccurrenceForWeeklyRecurrence(viewDateRangeStart, recurrenceStartDate, recurrenceInterval, recurrenceDayOfWeek);
  t.equal(firstOccurrenceFromRange.toDateString(), new Date(2016, 3, 21).toDateString());
});

test('getFirstOccurrenceDateFromRange returns expected date for weekly recurrence', function(t) {
  t.plan(1);
  const viewDateRangeStart = new Date(2016, 3, 20),
    recurrence = {
      recurrenceType: "Weekly",
      startDate: new Date(2016, 2, 31),
      interval: 3,
      dayOfWeek: "Thursday"
    };

  var firstOccurrenceFromRange = recurrenceUtils.getFirstOccurrenceDateFromRange(viewDateRangeStart, recurrence);
  t.equal(firstOccurrenceFromRange.toDateString(), new Date(2016, 3, 21).toDateString());
});

test('Can create single instnace for weekly recurrence in single date range.', function(assert) {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 2, 30),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 1,
      daysOfWeek: ["Wednesday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 20),
    viewDateEnd = new Date(2016, 3, 20);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 1, "Given a single date range and a recurrence which occurs on that date, one appointment should be returned.");
});

test('Can create two instances for weekly recurrence.', function(assert) {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 2, 30),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 1,
      daysOfWeek: ["Wednesday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 20),
    viewDateEnd = new Date(2016, 3, 27);

  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 2, "Given a weekly recurrence and a date range spanning two weeks of the recurrence, two appointments should be returned.");
});

test('Can create single instnace for bi-weekly recurrence.', function(assert) {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 2, 30),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Wednesday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 16),
    viewDateEnd = new Date(2016, 3, 20);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 1, "Given a bi-weekly recurrence and a date range spanning one week of the recurrence, one appointment should be returned.");
});

test('Does not include instance which is does not occur within the specified view range.', function(assert) {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 14),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Thursday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 21),
    viewDateEnd = new Date(2016, 3, 21);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 0, "Given a recurrence which does not occur within the speicified date range, no appointments should be returned.");
});

test('Can create two instances for bi-weekly recurrence.', function(assert) {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 6),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Wednesday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 6),
    viewDateEnd = new Date(2016, 3, 20);

  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 2, "Given a bi-weekly recurrence and a date range to include 2 occurences, two appointments should be returned.");
});

test('Tri-weekly recurrence', function(assert) {
  assert.plan(3);

  const event = {
    Date: new Date(2016, 3, 4),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 3,
      daysOfWeek: ["Monday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 3, 30),
    expectedResultDates = [new Date(2016, 3, 4), new Date(2016, 3, 25)];

  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 2, "Given a tri-weekly recurrence and a date range to include 2 occurences, two appointments should be returned.");
  assert.equal(result[0].date.toDateString(), expectedResultDates[0].toDateString(), "First occurrence date is correct.");
  assert.equal(result[1].date.toDateString(), expectedResultDates[1].toDateString(), "First occurrence date is correct.");
});

test('Recurrence spans leap day', function(assert) {
  assert.plan(2);

  const event = {
    Date: new Date(2012, 1, 27),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Monday"]
    }
  };
  const viewDateStart = new Date(2012, 1, 27),
    viewDateEnd = new Date(2012, 2, 12),
    expectedResultDates = [new Date(2012, 1, 27), new Date(2012, 2, 12)];

  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  if (!result.length) {
    assert.end("Result contained no instances.");
  } else if (result.length !== expectedResultDates.length) {
    assert.end(`Incorrect number of occurrences created (${result.length}, expected ${expectedResultDates.length})`);
  } else {
    assert.equal(result[0].date.toDateString(), expectedResultDates[0].toDateString(), "First occurrence date is correct.");
    assert.equal(result[1].date.toDateString(), expectedResultDates[1].toDateString(), "First occurrence date is correct.");
  }
});

test('Recurrence spans leap year', function(assert) {

  const event = {
    Date: new Date(2012, 1, 13),
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Monday"]
    }
  };
  const viewDateStart = new Date(2016, 1, 8),
    viewDateEnd = new Date(2016, 1, 8),
    expectedResultDates = [new Date(2016, 1, 8)];

  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.plan(result.length);
  if (!result.length) {
    assert.end("Result contained no instances.");
  } else if (result.length !== expectedResultDates.length) {
    assert.end(`Incorrect number of occurrences created (${result.length}, expected ${expectedResultDates.length})`);
  } else {
    assert.equal(result[0].date.toDateString(), expectedResultDates[0].toDateString(), "First occurrence date is correct.");
  }
});

test('Recurrence instances are assigned the instance date.', function(assert) {
  const event = {
    Date: new Date(2016, 2, 30),
    StartTime: '8:30 am',
    EndTime: '10:30 am',
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 2,
      daysOfWeek: ["Wednesday"]
    }
  };

  const viewDateStart = new Date(2016, 3, 6),
    viewDateEnd = new Date(2016, 4, 1);
  const expectedInstanceDates = [new Date(2016, 3, 13), new Date(2016, 3, 27)];

  const results = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  assert.plan(3);
  assert.true(results.length === 2);
  var i = 0;
  assert.comment(`Results length: ${results.length}`);
  results.forEach(r => {
    assert.ok(moment(r.date).isSame(expectedInstanceDates[i]), `Recurrence instance assigned. Expected: ${expectedInstanceDates[i]}, recieved: ${r.date}`);
    i++;
  });
});

test('Semi-weekly recurrences result in separate appointment instances.', function(assert) {
  const event = {
    Date :new Date(2016, 3, 25),
    StartTime: '8:30 am',
    EndTime: '10:30 am',
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 1,
      daysOfWeek: ["Monday", "Thursday"]
    }
  };

  const viewDateStart = new Date(2016, 3, 25),
    viewDateEnd = new Date(2016, 3, 30);
  const expectedInstanceDates = [new Date(2016, 3, 25), new Date(2016, 3, 28)];

  const results = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  assert.plan(1);
  assert.equal(results.length, expectedInstanceDates.length, `Returns expected number of records (${expectedInstanceDates.length}).`); 
});

test('No instances are created beyond the recurring event\'s end date.', assert => {
  const event = {
    Date: new Date(2015, 3, 25),
    StartTime: '8:30 am',
    EndTime: '10:30 am',
    Recurrence: {
      recurrenceType: 'Weekly',
      interval: 1,
      daysOfWeek: ["Monday"],
      endDate: '2016-04-27'
    }
  };

  const viewDateStart = new Date(2016, 3, 25),
    viewDateEnd = new Date(2016, 4, 2);

  const results = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  assert.plan(1);
  assert.equal(results.length, 1, `Returns expected number of records (1)`);
});

test('Single monthly recurrence (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 20),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      daysOfWeek: ["Wednesday"],
      index: 3
    }
  };
  const viewDateStart = new Date(2016, 3, 20),
    viewDateEnd = new Date(2016, 3, 20);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 1, `Returns expected number of results (expected: 1, actual: ${result.length}).`);
});

test('Multiple monthly recurrence (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 20),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      daysOfWeek: ["Wednesday"],
      index: 3
    }
  };
  const viewDateStart = new Date(2016, 3, 20),
    viewDateEnd = new Date(2016, 4, 18);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);

  assert.equal(result.length, 2, `Returns expected number of results (expected: 2, actual: ${result.length}).`);
});

test('Bi-monthly recurrence (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 20),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 2,
      daysOfWeek: ["Wednesday"],
      index: 3
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 5, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 20), new Date(2016, 5, 15)];
  assert.plan(3);
  assert.equal(result.length, 2, `Given a bi-monthly recurrence with a view date range spanning two occurrences, two occurrences are returned.`);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString(), `Given a bi-monthly recurrence and a 3 month view, with the first occurrence happening in the first month the view, the first occurrence date is as expected.`);
  assert.equal(result[1].date.toDateString(), expectedDates[1].toDateString(), `Given a bi-monthly recurrence and a 3 month view, with the first occurrence happening in the first month the view, the second occurrence date is as expected.`);
});

test('Bi-monthly recurrence view dates starting on off-interval month (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2016, 3, 20),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 2,
      daysOfWeek: ["Wednesday"],
      index: 3
    }
  };
  const viewDateStart = new Date(2016, 2, 1),
    viewDateEnd = new Date(2016, 5, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 20), new Date(2016, 5, 15)];
  assert.plan(2);
  assert.equal(result.length, 2, `Given a bi-monthly recurrence with a view date range starting on an off-interval month and spanning two occurrences, two occurrences are returned.`);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString(), `Given a bi-monthly recurrence and view date range starting on an off-interval month and spanning two occurrences, with the first occurrence happening in the first month the view, the first occurrence date is as expected.`);
});

test('Bi-monthly recurrence beginning in a previous year (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2015, 11, 16),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 2,
      daysOfWeek: ["Wednesday"],
      index: 3
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 3, 30);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 20)];
  assert.plan(2);
  assert.equal(result.length, 1);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString());
});

test('Monthly recurrence ending within scope of date range (indexed day)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2015, 11, 16),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      daysOfWeek: ["Wednesday"],
      index: 3,
      endDate: '2016-4-20'
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 4, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 20)];
  assert.plan(2);
  assert.equal(result.length, 1);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString(), "Given a monthly recurrence which ends within the scope of the view, occurrences are not generated beyond the end date.");
});

test('Monthly recurrence on last Tuesday (4 in week)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2015, 11, 16),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      index: -1,
      daysOfWeek: ["Tuesday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 3, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 26)];
  assert.plan(2);
  assert.equal(result.length, 1);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString(), "Given a monthly recurrence on the last Tuesday of a month with 4 Tuesdays (April 2016), the result is as expected (4/27/2016).");
});

test('Monthly recurrence on last Friday (5 in week)', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2015, 11, 16),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      index: -1,
      daysOfWeek: ["Friday"]
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 3, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  const expectedDates = [new Date(2016, 3, 29)];
  assert.plan(2);
  assert.equal(result.length, 1);
  assert.equal(result[0].date.toDateString(), expectedDates[0].toDateString(), "Given a monthly recurrence on the last Friday of a month with 5 Fridays, the result is as expected.");
});

test('Monthly recurrence exception is excluded', assert => {
  assert.plan(1);

  const event = {
    Date: new Date(2015, 11, 16),
    Recurrence: {
      recurrenceType: 'Monthly',
      interval: 1,
      index: -1,
      daysOfWeek: ["Friday"],
      Exceptions: ["2016-04-29T00:00:00"]
    }
  };
  const viewDateStart = new Date(2016, 3, 1),
    viewDateEnd = new Date(2016, 3, 31);
  
  const result = recurrenceUtils.createRecurrenceInstances(viewDateStart, viewDateEnd, event);
  assert.plan(1);
  assert.equal(result.length, 0);
});