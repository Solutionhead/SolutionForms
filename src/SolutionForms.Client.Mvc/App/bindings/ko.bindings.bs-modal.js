/**
* Bootstrap Modal Binding
* Bind to modal wrapper with class `.modal`
* Refer to http://getbootstrap.com/javascript/#modals for modal structure
*
* @param {boolean} valueAccessor - Toggles modal visibility
*/
ko.bindingHandlers.modal = {
  init: function(element, valueAccessor) {
    $(element).modal({
      show: false
    });

    var value = valueAccessor();
    if (ko.isWritableObservable(value)) {
      $(element).on('hide.bs.modal', function() {
        value(false);
      });
    }
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