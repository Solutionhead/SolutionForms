var Field = require('models/formFieldLive');

function FormField(params) {
  if (!(this instanceof FormField)) { return new FormField(params); }

  var self = this;
  
  self.labelText = params.label;
  self.inputType = ko.unwrap(params.inputType);
  //self.fieldConfig = new Field({
  //  //valueContext: params.context,
  //  settings: params.config,
  //  exports: params.exports
  //});
  self.fieldParams = {
    fieldConfig: new Field({
      settings: params.config,
      exports: params.fieldContext || null
    }),
    exports: params.exports
  }
  self.displayWithoutLabel = ko.pureComputed(function () {
    var settings = self.fieldParams.fieldConfig.settings || {};
    return (settings && settings.FieldContainerType && settings.FieldContainerType == 'container')
      || false;
  });
  self.displayWithLabel = ko.pureComputed(function () {
    return !self.displayWithoutLabel();
  });

  if (ko.isObservable(params.exports)) {
    params.exports({
      value: ko.pureComputed(function () {
        var context = self.fieldParams.fieldConfig.context();
        if (context == null) return null;
        return context.userResponse();
      })
    })
  }

  return self;
}


module.exports = {
  viewModel: FormField,
  template: require('./form-field.html')
}