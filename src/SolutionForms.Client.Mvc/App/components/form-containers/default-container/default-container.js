var page = require('page'),
  toastr = require('toastr'),
  tableComponentName = 'data-table',
  editorComponentName = 'details-editor';

if (!ko.components.isRegistered(tableComponentName)) {
  ko.components.register(tableComponentName, require('components/dataentry-table-view/dataentry-table-view'));
}

if (!ko.components.isRegistered(editorComponentName)) {
  ko.components.register(editorComponentName, require('components/dataentry-form-view/dataentry-form-view'));
}

/**
 * Renders a data in a Master/Details view.
 * 
 * @param {} params 
 * @param params.config
 * @param params.formId
 * @param params.documentId
 * @returns {} 
 */
function DefaultContainer(params) {
  if (!(this instanceof DefaultContainer)) { return new DefaultContainer(params); }

  var self = this,
    showDetails = ko.observable(false),
    currentId;

  self.showDetailsView = ko.pureComputed(function() {
    return showDetails() === true;
  });
  self.showTableView = ko.pureComputed(function() {
    return showDetails() !== true;
  });

  self.dataTableViewModel = {
    config: params.config,
    onItemSelected: navigateToSelectedItemDetails,
    exports: ko.observable()
  };

  self.detailsEditorViewModel = {
    config: params.config,
    documentId: ko.observable(ko.unwrap(params.documentId)),
    documentValues: ko.observable(),
    notifyListenersAsync: params.notifyListenersAsync,
    exports: ko.observable()
  };

  self.closeDetailsCommand = ko.command({
    execute: function() {
      page(`/Forms/${ko.unwrap(params.formId)}`);
    },
    canExecute: function() {
      return showDetails() === true;
    }
  });

  self.initNewEntryCommand = ko.command({
    execute: function() {
      page(`/Forms/${ko.unwrap(params.formId)}/new`);
    }
  });

  self.saveCommandAsync = ko.asyncCommand({
    execute: function(complete) {
      try {
        var data = self.detailsEditorViewModel.exports().buildDto();
        data.documentId = currentId;
        console.log(data);
        params.notifyListenersAsync('submit', data)
          .done(function(data) {
            toastr.success('Save completed successfully');
            if (currentId == null && arguments[0].Id != null) {
              //assumes that the arguments[0] is the results of the ajax call
              currentId = data.Id;
              const table = self.dataTableViewModel.exports();
              if (table) {
                table.insertItemAtIndex(0, data);
              }
              page.replace(`/Forms/${ko.unwrap(params.formId)}/${currentId}`);
            } else {
              const table = self.dataTableViewModel.exports();
              if (table) {
                table.updateItemByKey(currentId, data);
              }
            }
            params.notifyListenersAsync('submitCompleted');
            complete();
          }).fail(function(xhr) {
            toastr.error(xhr.message, 'Failed to Save');
            complete();
          });
      } catch (e) {
        complete();
      }
    },
    canExecute: function(isExecuting) {
      return !isExecuting && self.detailsEditorViewModel.exports();
    }
  });


  function showDetailsView(values) {
    self.detailsEditorViewModel.documentValues(values || {});
    showDetails(true);
  }

  params.documentId.subscribe(initializeForDocumentId);
  initializeForDocumentId(params.documentId.peek());

  function initializeForDocumentId(docId) {
    if (docId == null) {
      self.detailsEditorViewModel.documentValues(null);
      self.detailsEditorViewModel.documentId(null);
      showDetails(false);
    } else if (docId === 'new') {
      self.detailsEditorViewModel.documentId(null);
      showDetailsView({});
      docId = null;
    } else {
      if (currentId !== docId) {
        self.detailsEditorViewModel.documentId(docId);
      }
      showDetails(true);
    }
    currentId = docId;
  }

  function navigateToSelectedItemDetails(values) {
    showDetailsView(values);
    currentId = values.Id;
    page(`/Forms/${ko.unwrap(params.formId)}/${currentId}`);
  }

  return self;
}

module.exports = {
  viewModel: DefaultContainer,
  template: require('./default-container.html')
}