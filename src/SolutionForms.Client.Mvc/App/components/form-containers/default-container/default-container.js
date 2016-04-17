var page = require('page'),
    tableComponentName = 'data-table',
    editorComponentName = 'details-editor';

if (!ko.components.isRegistered(tableComponentName)) {
  ko.components.register(tableComponentName, require('components/dataentry-table-view/dataentry-table-view'));
}

if (!ko.components.isRegistered(editorComponentName)) {
  ko.components.register(editorComponentName, require('components/dataform-form-live/dataform-form-live'));
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

  var self = this;

  var componentParams = {
    config: params.config,
    documentId: ko.observable(),
    documentValues: ko.observable()
}
  var templateName = ko.observable(tableComponentName);

  self.activeComponent = {
    name: templateName,
    params: componentParams,
  }

  self.initNewEntry = function() {
    templateName(editorComponentName);
    console.log(ko.unwrap(params.formId));
    ko.postbox.publish('initNew', ko.unwrap(params.formId));
  }

  if (ko.isObservable(params.documentId)) {
    params.documentId.subscribe(function(docId) {
      if (docId == undefined) {
        componentParams.documentId(undefined);
        templateName(tableComponentName);
      } else if (docId === 'new') {
        //todo: initialize form values
        componentParams.documentValues({});
        componentParams.documentId(undefined);
        self.initNewEntry();
      } else {
        componentParams.documentId(docId);
        templateName(editorComponentName);
      }
    });
  }

  componentParams.documentId(ko.unwrap(params.documentId));

  return self;
}

module.exports = {
  viewModel: DefaultContainer,
  template: require('./default-container.html')
}