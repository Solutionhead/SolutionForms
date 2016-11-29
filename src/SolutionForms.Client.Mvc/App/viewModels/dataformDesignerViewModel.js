import * as registrationHelper from 'App/utils/registerLocalFieldTypes';
ko.components.register('dataform-form-designer', require('components/dataform-designer/dataform-designer'));

var page = require('page');

(function() {
  var vm = {
      config: ko.observable()
  };

  registrationHelper.registerLocalFieldTypes(true);
    
  page('/Forms/:id/Designer', loadForm);
  page();

  ko.applyBindings(vm);

  function loadForm(opts) {
      $.ajax('/api/dataforms/' + opts.params.id)
          .then(function (data) {
              vm.config(data);
          });
  }
}());