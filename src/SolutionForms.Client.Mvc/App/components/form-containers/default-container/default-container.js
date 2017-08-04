import moment from 'moment';
import toastr from 'toastr';
import { fetch as fetchRecords } from 'plugins/getDataFromLocalStorePlugin';
var page = require('page'),
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

  this.entityName = null; 

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
      page(`/Forms/${ko.unwrap(self.formId)}`);
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


  this.commands = {
    downloadAsCsvCommand: ko.asyncCommand({
      execute: function (complete) {
        return self.downloadAllRecordsAsCsv(complete);
      }
    })
  }


  function showDetailsView(values) {
    var editorVm = self.detailsEditorViewModel.exports();
    editorVm && editorVm.initializeFormValues(values || {});
    showDetails(true);
  }

  params.documentId.subscribe(initializeForDocumentId);
  initializeForDocumentId(params.documentId.peek());

  self.parseConfig(params.config);

  function initializeForDocumentId(docId) {
    if (docId == null) {
      //var editorVm = self.detailsEditorViewModel.exports();
      //editorVm && editorVm.initializeFormValues({});
      //self.detailsEditorViewModel.documentValues(null);
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
    page(`/Forms/${ko.unwrap()}/${currentId}`);
  }

  return self;
}

DefaultContainer.prototype.parseConfig = function (input) {
  var values = input || {},
    self = this;

  if (typeof values === "string") { values = ko.parseJSON(values) || {}; }
  if (values.dataSource == undefined || values.dataSource.documentName == undefined) {
    throw new Error("Invalid configuration data: Missing or invalid dataSource property.");
  }
  this.entityName = values.dataSource.documentName;
}

DefaultContainer.prototype.downloadAllRecordsAsCsv = function (complete) {
    var self = this,
      entityName = this.entityName,
      results = '';

    fetchData(0, 300);

    function fetchData(skip, take) {
      return fetchRecords({
        entityName: entityName,
        skip: skip || 0,
        top: take || 300,
        accepts: {
          csv: 'application/csv'
        },
        dataType: 'csv',
        converters: {
          'text csv': function (result) {
            return result;
          }
        }
      })
        .done((data) => {
          if (!data) {
            // all data has been downloaded
            triggerDownload(results);
            complete();
            return;
          }

          //data.replace(/\r\n/g, /\n/);
          if (results != '') {
            //remove header row from first line
            data = data.substr(data.match(/.*\n/).index + 1);
          }

          results += data;
          skip += take;
          return fetchData(skip, take);
        })
        .fail(() => {
          toastr.error(`An error occurred while attempting to download CSV file.`, 'Failed to download CSV')
          complete();
        });
    }

    function triggerDownload(data) {
      if (!data.match(/^data:text\/csv/i)) {
        data = 'data:text/csv;charset=utf-8,' + data;
      }
      var link = document.createElement('a');
      link.setAttribute('href', encodeURI(data));
      link.setAttribute('download', `${encodeURI(self.entityName)}_${moment().format('YYYYMMDD-HHmmss-SSSSSS')}.csv`);
      link.click();
      link = null;

      window.open(encodeURI(data));
    }
  }

module.exports = {
  viewModel: DefaultContainer,
  template: require('./default-container.html')
}