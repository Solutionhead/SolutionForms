var Field = require('models/formFieldLive'),
  formsService = require('services/dataFormsService'),
  setFormValuesPlugin = require('plugins/initializeFormValuesPlugin');

function DynamicFormUIViewModel(params) {
  if (!(this instanceof DynamicFormUIViewModel)) { return new DynamicFormUIViewModel(params); }

  var self = this;

  self.fields = ko.observableArray([]);

  ko.computed(function() {
    self.initializeFromConfig(ko.unwrap(params.config));
  });

  ko.computed(function() {
    var formId = ko.unwrap(params.formId);
    formId && self.loadFormById(formId);
  });

  self.isReady = ko.pureComputed(function() {
    return ko.utils.arrayFirst(self.fields(), function(f) {
      return f.context() == undefined;
    }) === null;
  });

  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      fields: self.fields,
      isReady: self.isReady,
      setFormContext: self.setFieldValues,
      buildDto: self.buildDto,
    });
  }

  return self;
}

DynamicFormUIViewModel.prototype.initializeFromConfig = function (jsonConfig) {
  var self = this;

  var form = (typeof jsonConfig === "string" ? ko.utils.parseJson(jsonConfig) : jsonConfig) || {};
  //if (form.dataSource == undefined || form.dataSource.documentName == undefined) {
  //  throw new Error("Invalid configuration: Missing or invalid dataSource property.");
  //}

  // load components
  ko.utils.arrayMap(form.components || [], loadComponent);

  (function buildDataObject() {
    self.dataSource = form.dataSource;
    self.dataSourceId = form.dataSourceId;
    self.formId = form.id;
    self.formDescription = form.description;
    
    self.setOrCreateObservable('fields', ko.utils.arrayMap(form.fields || [], function (f) {
      return new Field(f);
    }));
  }).call(self);

  function loadComponent(path) {
    var componentFactory = require('customizations/' + path);
    if (componentFactory && componentFactory.componentName && !ko.components.isRegistered(componentFactory.componentName)) {
      componentFactory.synchronous = true; // enforce all components to be rendered synchronously to ensure proper order
      ko.components.register(componentFactory.componentName, componentFactory);
    }
  }
}
DynamicFormUIViewModel.prototype.setOrCreateObservable = function (name, value) {
  if (ko.isObservable(this[name])) this[name](value);
  else this[name] = ko.observable(value);
}
DynamicFormUIViewModel.prototype.loadFormById = function (formId) {
  var self = this;
  formsService.getDataFormByIdAsync(formId)
    .then(function(data) {
      self.initializeFromConfig(data);
    });
}
DynamicFormUIViewModel.prototype.setFieldValues = function (data) {
  var vals = data || {},
    self = this;

  if (typeof vals === "string") { vals = ko.utils.parseJson(vals) || {}; }
  ko.utils.arrayForEach(self.fields(), function (f) {
    f.context().setValue(vals[f.exportName]);
  });
}
DynamicFormUIViewModel.prototype.buildDto = function () {
  var self = this,
    output = {};

  ko.utils.arrayMap(self.fields(), function (field) {
    output[field.exportName] = ko.unwrap(ko.unwrap(field.context).userResponse);
  });
  return output;

}

module.exports = {
  viewModel: DynamicFormUIViewModel,
  template: require('./dynamic-form-ui.html'),
  synchronous: true
}