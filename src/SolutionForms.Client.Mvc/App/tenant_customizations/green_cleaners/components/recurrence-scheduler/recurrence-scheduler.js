var moment = require('moment');
require('koExtenders/knockout.extenders.numeric');
require('koExtenders/knockout.extenders.moment');

function RecurrenceSchedulerViewModel(params) {
  if (!(this instanceof RecurrenceSchedulerViewModel)) { return new RecurrenceSchedulerViewModel(params); }

  var self = this;
  var nonRecurring = 'Non-recurring', 
    weekly = 'Weekly',
    monthly = 'Monthly',
    values = ko.unwrap(params.input) || {};

  self.recurrenceOptions = [nonRecurring, weekly, monthly];
  self.monthlyByDateOptions = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

  self.recurrence = ko.observable(values.recurrenceType);
  self.isRecurring = ko.pureComputed(function () {
    return self.recurrence() !== nonRecurring;
  });
  self.isWeekly = ko.pureComputed(function () {
    return self.recurrence() === 'Weekly';
  });
  self.isMonthly = ko.pureComputed(function () {
    return self.recurrence() === 'Monthly';
  });

  self.interval = ko.observable(values.interval).extend({ numeric: 0 });
  self.index = ko.observable(values.index);
  self.weeklyRecurrenceDays = ko.observableArray(self.isWeekly() && values.daysOfWeek || []);
  self.endDate = ko.observable(values.endDate).extend({ moment: 'M/D/YYYY' });
  self.startDate = ko.observable(values.startDate).extend({ moment: 'M/D/YYYY' });
  self.monthlyRecurrenceOption = ko.observable(values.monthlyRecurrenceOption || 'bydate');
  self.monthlyByDay = ko.observable(self.isMonthly() && values.daysOfWeek);
  self.monthlyByDate = ko.observable(values.dayOfMonth);

  // computeds
  self.recurrenceLabel = ko.pureComputed(function () {
    var name = '';
    switch(self.recurrence()) {
      case 'Weekly':
        name = 'week';
        break;
      case 'Monthly':
        name = 'month';
        break;
    }
    return name +
      (parseInt(self.interval()) > 1 ? 's' : '')
      + ' on ';
  });
  self.summaryText = ko.pureComputed(function() {
    switch (self.recurrence()) {
      case weekly: return buildWeeklyRecurrenceSummary();
      case monthly: return buildMonthlyRecurrenceSummary();
      default: return '';
    }
  });

  self.startDate.subscribe(function (val) {
    if (!val) return;

    var mDate = moment(val);

    var selectedDays = self.weeklyRecurrenceDays();
    if (!selectedDays || !selectedDays.length) {
      mDate.isValid && self.weeklyRecurrenceDays.push(mDate.format('dddd'));
    }

    self.monthlyByDate(mDate.format('D'));
    self.monthlyByDay(mDate.format('dddd'));

    var indexOptions = ['First', 'Second', 'Third', 'Fourth', 'Last'];
    var weekIndex = mDate.format('D') / 7;
    self.index(indexOptions[0 | weekIndex]);
  });

  function buildWeeklyRecurrenceSummary() {
    var text = 'Every ';
    var interval = self.interval();
    var days = self.weeklyRecurrenceDays();

    if (interval < 1 || !days.length) {
      return '';
    }

    if (interval > 1) {
      text += interval + ' weeks on ';
    }

    ko.utils.arrayForEach(days, function(day, index) {
      if (index > 0) {
        if (index === (days.length - 1)) {
          text += ' and ';
        } else {
          text += ', ';
        }
      }
      text += day;
    });

    //appendRecurrenceSummary(text);
    return appendRecurrenceSummary(text);
  }
  function buildMonthlyRecurrenceSummary() {
    var text = '';
    if (self.monthlyRecurrenceOption() === 'bydate') {
      text += 'Day <strong>' + self.monthlyByDate() + '</strong>';
    } else {
      text += 'The <strong>' + self.index().toLowerCase() + ' ' + self.monthlyByDay() + '</strong>';
    }
    if (self.interval() === 1) {
      text += ' of every month';
    } else {
      text += ' every <strong>' + self.interval() + ' months</strong>';
    }
    return appendRecurrenceSummary(text);
  }
  function appendRecurrenceSummary(text) {
    var startDate = moment(self.startDate()).format('M/D/YYYY');
    text += ', effective <strong>' + startDate + '</strong>';
    if (self.endDate()) {
      text += ' until <strong>' + self.endDate() + "</strong>";
    }
    return text;
  }

  params.exports({
    model: ko.pureComputed(function() {
      return self.recurrence() === nonRecurring ? null : ko.toJS({
        recurrenceType: self.recurrence,
        interval: self.interval,
        daysOfWeek: self.isMonthly() ? self.monthlyByDay : self.weeklyRecurrenceDays,
        startDate: self.startDate.toAbsoluteDateISOString(),
        endDate: self.endDate.toAbsoluteDateISOString(),
        dayOfMonth: self.monthlyByDate,
        index: self.index,
        monthlyRecurrenceOption: self.isMonthly() ? self.monthlyRecurrenceOption : null
      });
    })
  });

  return self;
}

module.exports = {
  name: 'Recurrence Scheduler',
  componentName: 'recurrence-scheduler',
  viewModel: RecurrenceSchedulerViewModel,
  template: require('./recurrence-scheduler.html'),
  synchronous: true,
}