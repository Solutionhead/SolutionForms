(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(["knockout", "moment"], factory);
  } else {
    // Browser globals
    factory(ko, moment);
  }
}(function (ko, moment) {
  ko.extenders.moment = function (target, formatString) {
    var result = ko.pureComputed({
      read: target,
      write: function (value) {
        //force to a valid date
        var date = forceDate(value);
        target(date && date.format(formatString));
      }
    }).extend({ notify: 'always' });

    function forceDate(date) {
      if (date) {
        return moment(date);
      }
    }

    target.equalityComparer = function (a, b) {
      //only trigger change event if date _really_ changed
      if (!a && !b) return true;
      if (!a || !b) return false;
      return a.valueOf() === b.valueOf();
    };

    target.format = format;
    target.moment = moment;

    function format(formatString) {
      var date = forceDate(result());
      return date && date.format(formatString);
    }

    result(target());
    return result;
  };
}));