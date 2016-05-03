var moment = require('moment');
require('koExtenders/knockout.extenders.numeric');
require('koExtenders/knockout.extenders.moment');
if (!ko.components.isRegistered('form-field')) {
  ko.components.register('form-field', require('components/form-field/form-field'));
}


function RecurrenceSchedulerViewModel(params) {
  if (!(this instanceof RecurrenceSchedulerViewModel)) { return new RecurrenceSchedulerViewModel(params); }

  var self = this;
  var weekly = 'Weekly',
    monthly = 'Monthly',
    values = ko.unwrap(params.input) || {};

  self.recurrenceOptions = [weekly, monthly];
  self.monthlyByDateOptions = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
  self.weekIndexOptions = [{ value: 1, name: 'First' }, { value: 2, name: 'Second' }, { value: 3, name: 'Third' }, { value: 4, name: 'Fourth' }, { value: -1, name: 'Last' }];

  self.isWeekly = ko.pureComputed(function () {
    return self.recurrence() === 'Weekly';
  });
  self.isMonthly = ko.pureComputed(function () {
    return self.recurrence() === 'Monthly';
  });
  
  self.recurrence = ko.observable(values.recurrenceType);
  self.interval = ko.observable(values.interval).extend({ numeric: 0 });
  self.index = ko.observable(values.index);
  self.weeklyRecurrenceDays = ko.observableArray(self.isWeekly() && values.daysOfWeek || []);
  self.endDate = ko.observable(values.endDate).extend({ moment: 'M/D/YYYY' });
  self.startDate = ko.observable(values.startDate).extend({ moment: 'M/D/YYYY' });
  self.monthlyByDay = ko.observable(self.isMonthly() && values.daysOfWeek);
  self.monthlyByDate = ko.observable(values.dayOfMonth);
  self.monthlyRecurrenceOption = ko.observable();
  self.Exceptions = values.Exceptions;

  // computeds
  self.recurrenceLabel = ko.pureComputed(function () {
    var name = '';
    switch(self.recurrence()) {
      case 'Weekly':
        name = `${pluralize("week")} on`;
        break;
      case 'Monthly':
        name = pluralize('month');
        break;
    }
    return name;

    function pluralize(val) {
      return val + (parseInt(self.interval()) > 1 ? 's' : '');
    }
  });
  self.indexText = ko.pureComputed(function() {
    var index = self.index();
    if(index == undefined) { return ''; }
    var option = ko.utils.arrayFirst(self.weekIndexOptions, o => o.value === index);
    return (option && option.name) || '';
  });
  self.summaryText = ko.pureComputed(function() {
    switch (self.recurrence()) {
      case weekly: return buildWeeklyRecurrenceSummary();
      case monthly: return buildMonthlyRecurrenceSummary();
      default: return '';
    }
  });

  self.startDate.subscribe(self.setRecurrenceDefaults);

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

    return appendRecurrenceSummary(text);
  }
  function buildMonthlyRecurrenceSummary() {
    var text = '';
    if (self.monthlyRecurrenceOption() === 'bydate') {
      text += 'Day <strong>' + self.monthlyByDate() + '</strong>';
    } else {
      text += 'The <strong>' + self.indexText().toLowerCase() + ' ' + self.monthlyByDay() + '</strong>';
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
    buildDto: self.buildDto.bind(self)
  });

  (function init() {
    var monthlyRecurrenceOpt = values && values.dayOfMonth > 0 ? 'bydate'
      : 'byday';
    self.monthlyRecurrenceOption(monthlyRecurrenceOpt);

    if (!values || !values.recurrenceType) {
      self.setRecurrenceDefaults();
    }
  }());

  return self;
}

RecurrenceSchedulerViewModel.prototype.setRecurrenceDefaults = function () {
  var self = this, 
    startDate = self.startDate();
  if (!startDate) return;

  var mDate = moment(startDate);

  var selectedDays = self.weeklyRecurrenceDays();
  if (!selectedDays || !selectedDays.length) {
    mDate.isValid && self.weeklyRecurrenceDays.push(mDate.format('dddd'));
  }

  self.monthlyByDate(mDate.format('D'));
  self.monthlyByDay(mDate.format('dddd'));

  var indexOptions = self.weekIndexOptions;
  var weekIndex = self.index() === -1 ? indexOptions[4] : mDate.format('D') / 7;
  self.index(indexOptions[0 | weekIndex]);
}
RecurrenceSchedulerViewModel.prototype.buildDto = function () {
  var dto = {
    recurrenceType: this.recurrence(),
    interval: this.interval(),
    startDate: this.startDate.toFloatingDateString(),
    endDate: this.endDate.toFloatingDateString(),
    Exceptions: this.Exceptions
  };

  if (this.isWeekly()) {
    dto.daysOfWeek = this.weeklyRecurrenceDays();
  }

  if (this.isMonthly()) {
    if (this.monthlyRecurrenceOption() === "bydate") {
      dto.dayOfMonth = this.monthlyByDate();
    } else {
      dto.index = this.index();
      dto.daysOfWeek = [this.monthlyByDay()];
    }
  }

  return dto;
}

module.exports = {
  name: 'Recurrence Scheduler',
  componentName: 'recurrence-scheduler',
  viewModel: RecurrenceSchedulerViewModel,
  template: require('./recurrence-scheduler.html'),
  synchronous: true,
}