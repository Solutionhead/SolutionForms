import * as registrationHelper from 'App/utils/registerLocalFieldTypes';
var $ = require('jquery'),
    emptyContainerName = 'empty-container',
    defaultContainerName = 'default-container',
    toastr = require('toastr'),
    formsService = require('services/dataFormsService');

registrationHelper.registerLocalFieldTypes();
if (!ko.components.isRegistered(emptyContainerName)) {
  ko.components.register(emptyContainerName, require('containers/empty-container/empty-container'));
}
if (!ko.components.isRegistered(defaultContainerName)) {
  ko.components.register(defaultContainerName, require('containers/default-container/default-container'));
}

var page = require('page');

(function () {
  var currentFormId,
    documentId = ko.observable();

  var vm = {
    activeComponent: ko.observable(),
    formId: ko.observable()
  };

  page('/Forms/:formId/:documentId?', function (opt) {
    vm.formId(opt.params.formId);
    documentId(opt.params.documentId);
    loadComponent(opt.params.formId);
  });

  ko.postbox.subscribe('initNew', function(val) {
    console.log('publication recieved:' + val);
    page('/Forms/' + currentFormId + '/new');
  });
  
  page();

  ko.applyBindings(vm);

  function loadComponent(formId) {
    if (formId === currentFormId && formId != undefined) {
      return;
    }

    currentFormId = formId;
    vm.activeComponent(null);

    formsService.getDataFormByIdAsync(formId)
      .then(function (data) {
        vm.activeComponent({
          name: data.formType || 'default-container',
          params: {
            config: data,
            documentId: documentId,
            formId: formId
          }
        });
      })
      .fail(function () {
        if (arguments[0].status === 401) {
          toastr.error("You are not authorized to view this form. Please see the system administrator if you believe this is an error.", "Unauthorized Access.");
        } else {
          toastr.error(arguments[2], "Error loading form.");
        }
      });
  }
}());
