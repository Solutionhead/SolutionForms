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

  self.isReady = ko.computed(function () {
    var nonReady = self.fields().length && ko.utils.arrayFirst(self.fields(), function(f) {
      return f.context() == undefined;
    });
    return nonReady === null;
  });

  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      fields: self.fields,
      isReady: self.isReady,
      setFormContext: self.setFieldValues,
      buildDto: self.buildDto,
      getFieldByName: self.getFieldByName.bind(self),
      setFieldValue: self.setFieldValue.bind(self),
      getFieldValue: self.getFieldValue.bind(self),
      hideField: self.hideField.bind(self),
      showField: self.showField.bind(self),
      resetForm: self.resetForm.bind(self),
      getFieldContextByName: self.getFieldContextByName.bind(self)
  });
  }

  return self;
}

DynamicFormUIViewModel.prototype.initializeFromConfig = function (jsonConfig) {
  var self = this;

  var form = (typeof jsonConfig === "string" ? ko.utils.parseJson(jsonConfig) : jsonConfig) || {};
  
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

    self.displayMode = getTemplateNameForFieldType;
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
    .done(function(data) {
      self.initializeFromConfig(data);
    });
}
DynamicFormUIViewModel.prototype.setFieldValues = function (data) {
  var vals = data || {};

  if (typeof vals === "string") { vals = ko.utils.parseJson(vals) || {}; }
  ko.utils.arrayForEach(this.fields(), function (f) {
    f.context().setValue(vals[f.exportName]);
  });
}
DynamicFormUIViewModel.prototype.getFieldByName = function (fieldName) {
  return ko.utils.arrayFirst(this.fields(), function (f) {
    return f.exportName === fieldName;
  });
}
DynamicFormUIViewModel.prototype.getFieldContextByName = function (fieldName) {
  var field = this.getFieldByName(fieldName);
  var context = field && field.context();
  return context && context.userResponse;
}
DynamicFormUIViewModel.prototype.setFieldValue = function (fieldName, value) {
  var field = this.getFieldByName(fieldName);
  field && field.context().setValue(value);
}
DynamicFormUIViewModel.prototype.getFieldValue = function (fieldName) {
  var field = this.getFieldByName(fieldName);
  return field && field.context().userResponse();
}
DynamicFormUIViewModel.prototype.buildDto = function () {
  var self = this,
    output = {};

  ko.utils.arrayMap(self.fields(), function (field) {
    output[field.exportName] = ko.unwrap(ko.unwrap(field.context).userResponse);
  });
  return output;

}
DynamicFormUIViewModel.prototype.onFieldRendered = function(domNodes) {
  var fieldContext;

  var domNode = ko.utils.arrayFirst(domNodes, function (node) {
    fieldContext = ko.contextFor(node);
    if (fieldContext != undefined) {
      return node;
    };
  });

  if(fieldContext) { fieldContext.$data.__domNode = domNode; }
}
DynamicFormUIViewModel.prototype.hideField = function(fieldName) {
  var field = this.getFieldByName(fieldName);
  if (field && field.__domNode) {
    $(field.__domNode).hide();
  }
}
DynamicFormUIViewModel.prototype.showField = function(fieldName) {
  var field = this.getFieldByName(fieldName);
  if (field && field.__domNode) {
    $(field.__domNode).show();
  }
}
DynamicFormUIViewModel.prototype.resetForm = function() {
  ko.utils.arrayForEach(this.fields(), function(f) {
    f.context().setValue(undefined);
  });
}

function getTemplateNameForFieldType(fieldData) {
  switch(fieldData.fieldType) {
    case "container" :
      return 'form-container-template';
    default:
      return 'form-field-template';
  }
}

module.exports = {
  viewModel: DynamicFormUIViewModel,
  template: require('./dynamic-form-ui.html'),
  synchronous: true
}