import moment from 'moment';
import core from 'App/core';

function DataformFieldViewModel(input) {
    if (!(this instanceof DataformFieldViewModel)) return new DataformFieldViewModel(input);
    var values = ko.toJS(input) || {};
    var config = new ComponentConfiguration();

    var self = this;
    self.displayName = ko.observable(values.displayName).extend({ required: true });
    self.inputType = ko.observable(values.inputType || core.defaultFieldName).extend({ required: true });
    self.configTemplateName = ko.pureComputed(function() {
        var inputType = this.inputType();
        return inputType
            ? inputType + '-config'
            : null;
    }, self);
    self.helpText = ko.observable(values.helpText);
    self.exportName = ko.observable(values.exportName).extend({ required: true });

    var settings = ko.unwrap(values.settings) || {};
    var validation = ko.unwrap(settings.validation) || {};
    self.isRequired = ko.observable(validation.isRequired);
    validation.isRequired = self.isRequired;
    settings.validation = validation;
    // Consider making settings non-observable. This way, the components can only  modify
    // the settings through the `config` param.
    self.settings = ko.observable(settings);
    self.fieldType = ko.observable(values.fieldType);
    self.config = config;
    self.rawSettings = settings; //todo: rename to settings when observable settings is removed

    self.displayName.subscribe(function(name) {
        if (self.exportName() == undefined) {
            self.exportName(name);
        } else if (name == undefined || name === '') {
            self.exportName(undefined);
        }
    });
  
    return self;
}

DataformFieldViewModel.prototype.exportConfig = function () {
  const settings = ko.unwrap(this.settings) || {};
  $.extend(settings, this.config.getSettings() || {});
  const fieldType = ko.unwrap(this.config.fieldType || this.fieldType);

  return ko.toJS({
          displayName: this.displayName,
          inputType: this.inputType,
          helpText: this.helpText,
          exportName: this.exportName,
          settings: settings,
          fieldType: fieldType
      });
}

module.exports = DataformFieldViewModel;

function ComponentConfiguration() {
  if (!( this instanceof ComponentConfiguration )) {
    return new ComponentConfiguration();
  }

  const _configDelegates = {
    settings: []
  };

  this.asContainer = function( ) {
    _configDelegates.fieldType = curryFieldTypeSetter("container").bind(this);
    return this;
  }

  this.asFieldSet = function( ) {
    _configDelegates.fieldType = curryFieldTypeSetter("fieldset").bind(this);
    return this;
  }

  this.withSettings = function( arg0 ) {
    if ( typeof ( arg0 ) === "function" ) {
      _configDelegates.settings.push( arg0 );
    }
    return this;
  }

  this.getSettings = function() {
    var settings = {};
    ko.utils.arrayForEach(_configDelegates.settings, (d) => {
      $.extend(settings, d() || {});
    });
    return settings;
  }

  this.getFieldType = function() {
    return _configDelegates.fieldType && _configDelegates.fieldType();
  }

  this.fieldType = ko.pureComputed(this.getFieldType, this)
  
  function curryFieldTypeSetter(value) {
    return () => { this.fieldType(value); }
  }
}