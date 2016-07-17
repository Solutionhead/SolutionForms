import 'bindings/datepicker';

function DateFieldViewModel(params) {
  if(!(this instanceof DateFieldViewModel)) { return new DateFieldViewModel(params); }

  var self = this;

  self.formatMode = ko.observable(DateFieldViewModel.prototype.FORMAT_MODES.Floating);
  self.selectedDate = ko.observable().extend({ moment: 'M/D/YYYY' });
  self.userResponse = ko.computed({
    read: function() {
      return self.getFormattedValue();
    },
    write: function(value) {
      self.selectedDate(value);
    }
  });

  return self;
}

DateFieldViewModel.prototype.getFormattedValue = function() {
  switch(this.formatMode()) {
    case DateFieldViewModel.prototype.FORMAT_MODES.Floating:
      return this.selectedDate.toFloatingDateString();
    case DateFieldViewModel.prototype.FORMAT_MODES.ISO:
      return this.selectedDate.toAbsoluteDateISOString();
    default:
      throw new Error(`Missing, invalid or supported format mode encountered (${this.formatMode()}).`);
  }
}
DateFieldViewModel.prototype.FORMAT_MODES = {
  Local: "Local",
  ISO: "Global (ISO)",
  Floating: "Floating/Unspecified"
}

module.exports = {
  name: 'Date',
  viewModel: DateFieldViewModel,
  template: require('./date-field.html')
};