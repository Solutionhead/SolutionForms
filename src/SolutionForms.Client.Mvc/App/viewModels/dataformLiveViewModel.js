import * as registrationHelper from 'App/utils/registerLocalFieldTypes';
var page = require('page');

registrationHelper.registerLocalFieldTypes();

ko.components.register("data-form", require('components/dataform-live/dataform-live'));


(function () {
  var vm = {
    formId: ko.observable(),
    documentId: ko.observable()
  };

  page('/Forms/:formId/:documentId?', function (opt) {
    if (opt.params.formId !== vm.formId()) {
      vm.formId(opt.params.formId);
    }
    if (opt.params.documentId !== vm.documentId()) {
      vm.documentId(opt.params.documentId);
    }
  });

  page();

  ko.applyBindings(vm);
}());
