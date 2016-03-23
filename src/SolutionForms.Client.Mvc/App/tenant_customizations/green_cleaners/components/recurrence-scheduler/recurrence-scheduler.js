﻿var base = require('controls/basicEntryField');
require('koExtenders/knockout.extenders.numeric');
require('koExtenders/knockout.extenders.moment');

function RecurrenceSchedulerViewModel(params) {
  if (params == undefined || params.context == undefined) throw new Error('Requires argument params.context');
  if (!(this instanceof RecurrenceSchedulerViewModel)) { return new RecurrenceSchedulerViewModel(params); }

  var self = this,
      input = ko.unwrap(params.input) || {},
      settings = ko.unwrap(input.settings) || {};
  var nonRecurring = 'Non-recurring', 
    weekly = 'Weekly',
    monthly = 'Monthly';

  base.call(this, params, true);

  self.recurrenceOptions = [nonRecurring, weekly, monthly];
  self.monthlyByDateOptions = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

  self.recurrence = ko.observable();
  self.interval = ko.observable().extend({ numeric: 0 });
  self.index = ko.observable();
  self.weeklyRecurrenceDays = ko.observableArray([]);
  self.recurrenceEndDate = ko.observable().extend({ moment: 'M/D/YYYY' });
  self.monthlyRecurrenceOption = ko.observable('bydate');
  self.monthlyByDay = ko.observable();
  self.monthlyByDate = ko.observable();

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
      (parseInt(self.interval()) > 1 ? 's' : '');
  });
  self.isRecurring = ko.pureComputed(function() {
    return self.recurrence() !== nonRecurring;
  });
  self.isWeekly = ko.pureComputed(function () {
    return self.recurrence() === 'Weekly';
  });
  self.isMonthly = ko.pureComputed(function () {
    return self.recurrence() === 'Monthly';
  });
  self.summaryText = ko.pureComputed(function() {
    switch (self.recurrence()) {
      case weekly: return buildWeeklyRecurrenceSummary();
      case monthly: return buildMonthlyRecurrenceSummary();
      default: return '';
    }
  });

  var startDateField = ko.pureComputed(function () {
    if(params.parentContext == null) { return null; }
    var field = ko.utils.arrayFirst(params.parentContext.fields(), function (f) {
      //todo: move field identification into configuration?
      return f.exportName === 'Start Date';
    });

    var context = field && field.context();
    if (context) { 
      var startDate = context.userResponse.extend({ moment: 'M/D/YYYY' });
      return startDate;
    }

    return null;
  });

  self.userResponse = function() {
    return self.recurrence() === nonRecurring ? null : ko.toJS({
      recurrenceType: self.recurrence,
      interval: self.interval,
      daysOfWeek: self.isMonthly() ? self.monthlyByDay : self.weeklyRecurrenceDays,
      endDate: self.recurrenceEndDate,
      dayOfMonth: self.monthlyByDate,
      index: self.index,
      monthlyRecurrenceOption: self.isMonthly() ? self.monthlyRecurrenceOption : null
    });
  };

  startDateField.subscribe(function (val) {
    var startDate = startDateField();
    if (!startDate) return;

    if (startDate() == undefined) startDate(Date.now());
    var selectedDays = self.weeklyRecurrenceDays();
    if (!selectedDays || !selectedDays.length) {
      startDate() && startDate.format
        && self.weeklyRecurrenceDays.push(startDate.format('dddd'));
    }

    self.monthlyByDate(startDate.format('D'));
    self.monthlyByDay(startDate.format('dddd'));

    var indexOptions = ['First', 'Second', 'Third', 'Fourth', 'Last'];
    var weekIndex = startDate.format('D') / 7;
    self.index(indexOptions[0 | weekIndex]);
  });

  self.setValue = function (value) {
    var initialValues = value || {};

    self.recurrence(initialValues.recurrenceType);
    self.interval(initialValues.interval);
    self.index(initialValues.index);
    self.weeklyRecurrenceDays(self.isWeekly() && initialValues.daysOfWeek || []);
    self.recurrenceEndDate(initialValues.endDate);
    self.monthlyRecurrenceOption(initialValues.monthlyRecurrenceOption);
    self.monthlyByDay(self.isMonthly() && initialValues.daysOfWeek);
    self.monthlyByDate(initialValues.dayOfMonth);
  }


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

    appendRecurrenceSummary(text);
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
    var startDate = startDateField();
    text += ', effective <strong>' + startDate() + '</strong>';
    if (self.recurrenceEndDate()) {
      text += ' until <strong>' + self.recurrenceEndDate() + "</strong>";
    }
    return text;
  }

  params.context(self);
  return self;
}

RecurrenceSchedulerViewModel.prototype = base.prototype;

module.exports = {
  name: 'Recurrence Scheduler',
  componentName: 'recurrence-scheduler',
  viewModel: RecurrenceSchedulerViewModel,
  template: require('./recurrence-scheduler.html'),
  synchronous: true,
}