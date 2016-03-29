var base = require('controls/basicEntryField');
require('koExtenders/knockout.extenders.moment');

function DateFieldViewModel(params) {
  if(!(this instanceof DateFieldViewModel)) { return new DateFieldViewModel(params); }

  var self = this;

  base.call(this, params, true);

  self.selectedDate = ko.observable().extend({ moment: 'M/D/YYYY' });
  self.userResponse = ko.computed({
    read: function() {
      return self.selectedDate.toAbsoluteDateISOString();
    },
    write: function(value) {
      self.selectedDate(value);
    }
  });

  params.context(self);

  return self;
}

DateFieldViewModel.prototype = base.prototype;

module.exports = {
  viewModel: DateFieldViewModel,
  template: require('./dataform-date-field.html'),
  synchronous: true,
}