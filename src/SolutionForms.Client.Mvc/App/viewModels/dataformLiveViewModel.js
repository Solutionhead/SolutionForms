var $ = require('jquery'), 
    tableComponentName = 'data-table',
    editorComponentName = 'details-editor',
    toastr = require('toastr'),
    formsService = require('services/dataFormsService');

//consider loading components dynamically
ko.components.register(tableComponentName, require('components/dataentry-table-view/dataentry-table-view'));
ko.components.register(editorComponentName, require('components/dataform-form-live/dataform-form-live'));

var page = require('page');

(function () {
    var currentFormId;
    var vm = {
        activeComponent: ko.observable(),
        createNewEntry: function() {
            currentFormId && page('/Forms/' + currentFormId + '/new');
        }
    };

    page('/Forms/:formId/new', function (opt) {
        currentFormId = opt.params.formId;
        loadComponent(editorComponentName, opt.params.formId);
    });
    page('/Forms/:formId/:documentId?', function (opt) {
        currentFormId = opt.params.formId;
        if (opt.params.documentId == undefined) {
            loadComponent(tableComponentName, opt.params.formId);
        } else {
            loadComponent(editorComponentName, opt.params.formId, opt.params.documentId);
        }
    });
    page();

    ko.applyBindings(vm);

    function loadComponent(componentName, formId, docId) {
      vm.activeComponent(null);
      formsService.getDataFormByIdAsync(formId)
        .then(function(data) {
          vm.activeComponent({
            name: data.componentName || componentName,
            params: {
              config: data,
              documentId: docId
            }
          });
        })
        .fail(function() {
          if (arguments[0].status === 401) {
            toastr.error("You are not authorized to view this form. Please see the system administrator if you believe this is an error.", "Unauthorized Access.");
          } else {
            toastr.error(arguments[2], "Error loading form.");
          }
        });
    }
}());
