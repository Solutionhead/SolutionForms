(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(["knockout", "moment"], factory);
  } else {
    // Browser globals
    factory(ko, moment);
  }
}(function (ko, moment) {
  ko.extenders.moment = function (target, defaultFormatString) {
    var wrapper = ko.pureComputed({
      read: target,
      write: function (newValue) {
        var current = target.peek(),
          date = forceDate(newValue),
          valueToWrite = date && date.format(defaultFormatString);
        
        if (valueToWrite !== current) {
          target(valueToWrite);
        } else {
          if (newValue !== current) {
            target.notifySubscribers(valueToWrite);
          }
        }
      }
    }).extend({ notify: 'always' });

    function forceDate(date) {
      if (date != undefined) {
        if (date instanceof Date) {

        } else if (typeof(date) === 'number') {
          
        }
        else {
          date = Date.parse(date);
        }
        return moment(date);
      }
    }

    wrapper.format = format;
    wrapper.moment = moment;

    function format(formatString) {
      var date = forceDate(wrapper());
      return date && date.format(formatString || defaultFormatString);
    }

    wrapper(target.peek());
    return wrapper;
  };
}));