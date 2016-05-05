/**
* Bootstrap Modal Binding
* Bind to modal wrapper with class `.modal`
* Refer to http://getbootstrap.com/javascript/#modals for modal structure
*
* @param {boolean} valueAccessor - Toggles modal visibility
*/
var _ = require('lodash');

ko.bindingHandlers.modal = {
  init: function (element, valueAccessor, allBindingsAccessor) {
    var allBindings = allBindingsAccessor() || {};
    $(element).modal({
      show: false
    });

    var value = valueAccessor();
    if (ko.isWritableObservable(value)) {
      $(element).on('hide.bs.modal', function() {
        value(false);
      });
    }

    _.each(allBindings.modalEventCallbacks || [], function(fn, eventName) {
      if (typeof fn === "function") {
        $(element).on(eventName, fn);
      }
    });
  },
  update: function(element, valueAccessor) {
    var value = valueAccessor();
    if (ko.utils.unwrapObservable(value)) {
      $(element).modal('show');
    } else {
      $(element).modal('hide');
    }
  }
};