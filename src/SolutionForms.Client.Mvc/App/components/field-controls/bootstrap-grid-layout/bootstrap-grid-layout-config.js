var base = require('viewModels/dataformFieldsDesigner');
ko.components.register('fields-designer', require('components/dataform-fields-designer/dataform-fields-designer'));

function BootstrapColLayoutConfig(field, params) {
  if (!(this instanceof BootstrapColLayoutConfig)) { return new BootstrapColLayoutConfig(field, params); }

  var self = this,
      settings = params.input.settings.peek();

  self.containerClassOptions = ['container', 'container-fluid'];

  self.containerClass = ko.observable(settings.containerClass);
  self.rows = ko.observableArray(ko.utils.arrayMap(settings.contents || [{}], RowConfig));
  

  self.addRowCommand = ko.command({
    execute: function() {
      self.rows.push( new RowConfig( {} ) ); 
    }
  });

  self.removeCurrentRowCommand = ko.command({
    execute: function(item) {
      self.rows.remove(item);
    }
  });

  settings.containerClass = self.containerClass;
  settings.contents = ko.pureComputed(function() {
    return ko.utils.arrayMap(self.rows() || [], r => {
      var conf = r.exportConfig();
      return conf;
    });
  });

  params.input.settings(settings);
}

function RowConfig(values) {
  if (!(this instanceof RowConfig)) { return new RowConfig(values); }
  values = values || {};

  const self = this;

  this.columns = ko.observableArray(ko.utils.arrayMap(values.columns || [], ColumnConfig));
  this.addColumnCommand = ko.command({
    execute: function() {
      self.columns.push(new ColumnConfig());
    }
  });
  this.removeCurrentColumnCommand = ko.command({
    execute: function(item) {
      self.columns.remove(item);
    }
  });

  return self;
}
RowConfig.prototype.exportConfig = function() {
  return {
    columns: ko.utils.arrayMap(this.columns(), c => {
      return c.exportConfig();
    })
  };
}

function ColumnConfig(values) {
  if (!(this instanceof ColumnConfig)) { return new ColumnConfig(values); }
  values = values || {};

  const self = this;
  this.classValue = ko.observable(values.classValue);
  this.fieldsInput = values.contents;
  this.fieldsExport = ko.observable();

  return self;
}
ColumnConfig.prototype.exportConfig = function() {
  return {
    classValue: this.classValue(),
    contents: this.fieldsExport().exportFieldsConfig()
  };
}

module.exports = BootstrapColLayoutConfig;