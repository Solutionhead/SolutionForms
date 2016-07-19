var Field = require('models/formFieldLive'),
  formsService = require('services/dataFormsService'),
  setFormValuesPlugin = require('plugins/initializeFormValuesPlugin');

/**
 * Dynamicly generates form controls based on a given configuration object.
 * 
 * @param {} params 
 * @param params.formId   string      The key value for the form to be generated. The requested form configuration will be loaded from the api.
 * @param parms.config    object      The configuration object for generating the form.
 * @param params.exports  observable  An optional argument which enables the consuming component to access the exported members.
 */
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
      isValid: self.isValid,
      setFormContext: self.setFieldValues,
      setFieldValues: self.setFieldValues,
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

DynamicFormUIViewModel.prototype.isValid = function() {
  
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
    
    self.setOrCreateObservable('fields', ko.utils.arrayMap(form.fields || [], 
      (f) => { return new Field(f); }),
      (vals) => { return ko.observableArray(vals || []); });

    self.displayMode = getTemplateNameForFieldType;
  }).call(self);

  // For future use, components could be loaded from tenant customizations or from a global marketplace.
  // The customizations should evenutally enforce that the tenant id is specified systematically so, 
  // rather than, `customizations\my-organization\my-customization`, the path could read `customizations\my-customization` 
  // and the platform would then be able to insert the dependency on the current tenant id. This would prevent tenants to 
  // effectively steal eachother's customizations.
  function loadComponent(path) {
    // Note: webpack is currently dependent on `customizations` being hardcoded in the path. Without it, the customizations 
    // will not be included in the bundle. However, this also means that all tenant customizations are bundled which is not
    // what we want!
    var componentFactory = require('customizations/' + path);
    if (componentFactory && componentFactory.componentName && !ko.components.isRegistered(componentFactory.componentName)) {
      componentFactory.synchronous = true; // enforce all components to be rendered synchronously to ensure proper order
      ko.components.register(componentFactory.componentName, componentFactory);
    }
  }
}
DynamicFormUIViewModel.prototype.setOrCreateObservable = function (name, value, observableConstructor) {
  if (ko.isObservable(this[name])) this[name](value);
  else this[name] = typeof observableConstructor === "function" ? observableConstructor(value) : ko.observable(value);
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
    f.setValue(vals[f.exportName]);
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
  field && field.setValue(value);
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