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
    if(typeof defaultFormatString !== "string") { defaultFormatString = "MM-DD-YYYY" }
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

    function forceDate(dateValue) {
      if (dateValue != undefined && dateValue !== '') {
        if (typeof dateValue === "string") {
          var m = moment(dateValue, defaultFormatString);
          if (m.isValid()) return m;
          return moment(dateValue); // if parsing fails using supplied format string, try default parsing and hope it's in ISO format!
        } else if (dateValue instanceof Date) {
          return moment(dateValue);
        } else if (dateValue._isAMomentObject) {
          return dateValue;
        }

        console.log(`Unsupported date format encountered: '${dateValue}'. Supported values types are string in format '${defaultFormatString}' as specified by defaultFormatString argument, a Date object, or a moment instance.`);
      }
    }

    wrapper.toAbsoluteDateISOString = function() {
      var mDate = forceDate(wrapper());
      return mDate && mDate._d.toISOString().replace(/\.(\d{3})Z$/, ".$10000Z");
    }
    wrapper.toFloatingDateString = function() {
      var mDate = forceDate(wrapper());
      return mDate && mDate.format("YYYY-MM-DD[T00:00:00]");
    }
    wrapper.format = format;
    wrapper.isValid = isValid;
    wrapper.isSame = isSame;
    
    function format(formatString) {
      var date = forceDate(wrapper());
      return date && date.format(formatString || defaultFormatString);
    }

    function isSame(val) {
      return moment(wrapper()).isSame(val);
    }

    function isValid() {
      return moment(wrapper()).isValid();
    }

    wrapper(target.peek());
    return wrapper;
  };
}));