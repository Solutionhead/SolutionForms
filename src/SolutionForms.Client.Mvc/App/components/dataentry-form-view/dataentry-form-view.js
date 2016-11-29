ko.punches.enableAll();
var toastr = require('toastr');

if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

function DataEntryForm(params) {
  if (!(this instanceof DataEntryForm)) {
    return new DataEntryForm(params);
  }
  const self = this;
  const __disposables = [];

  self.subscriptions = [];

  self.formId = params.config.id;
  self.formConfig = params.config;
  self.notifyListenersAsync = params.notifyListenersAsync;
  self.dynamicFormUIExport = ko.observable();
  self.fields = ko.pureComputed(function () {
    var formVm = self.dynamicFormUIExport();
    return formVm ? formVm.fields() : [];
  });

  self.isRendered = ko.pureComputed(function () {
    return self.dynamicFormUIExport() && self.dynamicFormUIExport().isReady() && true;
  });

  self.ready = ko.pureComputed(function () {
    return self.formConfig() != undefined
      && self.isRendered() === true;
  });

  var lastDocLoaded;
  __disposables.push(ko.computed(function () {
    const docId = ko.unwrap(params.documentId);
    if (docId != null && docId !== lastDocLoaded) {
      lastDocLoaded = docId;
      self.loadDocumentData(docId);
      //documentId(docId);
    }
  }));

  __disposables.push(ko.computed(function () {
    const values = ko.unwrap(params.documentValues) || {};
    self.setFieldValues(values);
    //documentId(values.Id);
    lastDocLoaded = values.Id;
  }));

  self.dispose = dispose;

  // exports
  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      buildDto: self.buildDto.bind(self)
    });
  }


  function dispose() {
    ko.utils.arrayForEach(__disposables, function (d) {
      d.dispose && !d.isDisposed && d.dispose();
    });
    __disposables.splice(0, __disposables.length);
  }
}

DataEntryForm.prototype.buildDto = function() {
  var form = this.dynamicFormUIExport();
  return form == null ? {} : form.buildDto();
}

DataEntryForm.prototype.setFieldValues = function (values) {
  const form = this.dynamicFormUIExport();
  if (form) {
    form.setFieldValues(values);
  }
}
DataEntryForm.prototype.loadDocumentData = function (documentId) {
  if (documentId == undefined) { return; }

  var self = this;

  if (self.isRendered()) {
    fetchData();
  } else {
    var renderedSub = self.isRendered.subscribe(function (rendered) {
      if (rendered) {
        fetchData();
        renderedSub.dispose();
        renderedSub = null;
      }
    });
    self.subscriptions.push(renderedSub);
  }

  function fetchData() {
    self.notifyListenersAsync('fetch', {
      id: documentId,
      entityName: self.formId,
      form: self
    }).done(function (data) {
      self.setFieldValues(data);
      self.notifyListenersAsync('loaded', self);
    }).fail(function () {
      toastr.error("Error: " + arguments[2]);
    });
  }
}


module.exports = {
  viewModel: DataEntryForm,
  template: require('./dataentry-form-view.html'),
  synchronous: true
}