var base = require('controls/basicEntryField');
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
  self.weeklyRecurrenceDays = ko.observableArray([]);
  self.recurrenceEndDate = ko.observable().extend({ moment: 'M/D/YYYY' });
  self.monthlyRecurrenceOption = ko.observable();
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

  //todo: move field access into configuration?
  var startDateField = ko.pureComputed(function() {
    var field = ko.utils.arrayFirst(params.parentContext.fields(), function (f) {
      return f.exportName === 'Start Date';
    });
    var context = field && field.context();
    if (context) {
      context.userResponse.extend({ moment: 'M/D/YYYY' });
    }

    return context && context.userResponse;
  });

  startDateField.subscribe(function (val) {
    var selectedDays = self.weeklyRecurrenceDays();
    if (!selectedDays || !selectedDays.length) {
      var startDate = startDateField();
      startDate() && self.weeklyRecurrenceDays.push(startDate.format('dddd'));
    }
  });

  var baseSetValue = self.setValue.bind(self);
  self.setValue = function (value) {
    //todo: parse value (if JSON) and set individual parts
    //return baseSetValue(value);
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

    text += ', effective <strong>' + startDateField()() + '</strong>';

    if (self.recurrenceEndDate()) {
      text += ' until <strong>' + self.recurrenceEndDate() + "</strong>";
    }

    return text;
  }
  function buildMonthlyRecurrenceSummary() {
    
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