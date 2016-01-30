require('ko.bs.collapse');
require('ko.sortable');

// KendoUI resources
//require('ko.kendo');
//require('kendoui/kendo.ui.core.min');
//require('kendoui/kendo.multiselect.min');
//require('kendoui-styles/kendo.bootstrap.min.css');
//require('kendoui-styles/kendo.common-bootstrap.min.css');

var base = require('viewModels/dataformFieldsDesigner'),
  toastr = require('toastr');
function split(val) {
  return val.split(/,\s*/);
}

function extractLast(term) {
  return split(term).pop();
}



function DataformDesignerViewModel(params) {
  if (!(this instanceof DataformDesignerViewModel)) { return new DataformDesignerViewModel(params); }

  var self = this,
      values = self.parseInputConfig(params.input),
      dataSourceId = ko.observable();

  base.call(this, params);

  self.__subscriptions = [];
  self.formId = values.id;
  self.formTitle = ko.observable(values.title);
  self.authorizedClaims = ko.observable();
  self.claimsOptions = ko.observableArray(values.authorizedClaims || []);

  self.dataSourceId = ko.computed({
    read: function () { return dataSourceId(); },
  });
  self.isNewDataSource = ko.computed(function () {
    return dataSourceId() == undefined;
  }, self);


  self.newDataSourceName = ko.observable();
  self.dataSourceOptions = ko.observableArray([]);
  self.formDescription = ko.observable(values.description);

  self.plugins = ko.observableArray(values.plugins);

  //setup
  var loadDataSourceOptionsPromise = self.loadDataSourceOptions();
  var loadClaimsPromise = self.loadClaimOptions();

  if (ko.isObservable(params.input)) {
    self.__subscriptions.push(params.input.subscribe(function (value) {
      var parsed = self.parseInputConfig(value);
      self.formId = parsed.id;
      self.formTitle(parsed.title);
      self.formDescription(parsed.description);
      self.fields(parsed.fields);
      self.authorizedClaims(parsed.authorizedClaims || []);

      loadDataSourceOptionsPromise.then(function () {
        if (parsed.dataSourceId == undefined) console.warn('dataSourceId is undefined');
        dataSourceId(parsed.dataSourceId);
      });
      loadClaimsPromise.then(function () {
        self.authorizedClaims(parsed.authorizedClaims || []);
      });
    }));
  } else {
    loadDataSourceOptionsPromise.then(function () {
      values.dataSourceId && dataSourceId(values.dataSourceId);
    });
    loadClaimsPromise.then(function () {
      values.authorizedClaims && self.authorizedClaims(values.authorizedClaims);
    });
  }


  //commands
  self.saveCommandAsync = ko.asyncCommand({
    execute: function (complete) {
      var data = self.buildConfig(),
          isNew = data.id == undefined;

      $.ajax({
        url: '/api/dataforms/' + (isNew ? '' : data.id),
        data: ko.toJSON(data),
        dataType: 'json',
        contentType: 'application/json',
        method: isNew ? 'POST' : 'PUT'
      }).then(function () {
        if (data.newDataSourceName && self.dataSourceOptions().length) {
          self.loadDataSourceOptions().then(function () {
            var selected = ko.utils.arrayFirst(self.dataSourceOptions(), function (item) {
              return item.name === data.newDataSourceName;
            });
            dataSourceId(selected ? selected.id : null);
          });
        }

        if (isNew) {
          var id = arguments[0].dataSourceId;
          self.formId = id;
          page.replace('/Forms/' + id);
        }

        toastr.success('Your changes were saved successfully!', 'Save Completed');
      }).always(complete);
    },
    canExecute: function (isExecuting) {
      return !isExecuting;
    }
  });

  if (ko.isObservable(params.exports)) { params.exports(self); }

  return self;
}

DataformDesignerViewModel.prototype = base.prototype;
DataformDesignerViewModel.prototype.defaultValues = {
  title: "Untitled form",
  fields: [],
  plugins: ['plugins/initializeFormValuesPlugin', 'plugins/saveToLocalDocumentStorePlugin']
};
DataformDesignerViewModel.prototype.parseInputConfig = function (configValues) {
  var input = ko.unwrap(configValues) || {};
  switch (typeof input) {
    case "string":
      input = ko.utils.parseJson(input);
      break;
    case "object":
    case "undefined":
      break;
    default:
      throw new Error('Invalid input. Expected JSON string or object.');
  }

  return $.extend({}, DataformDesignerViewModel.prototype.defaultValues, input);
}
DataformDesignerViewModel.prototype.buildConfig = function () {
  var self = this;
  var config = {
    id: self.formId,
    title: self.formTitle(),
    dataSourceId: self.dataSourceId(),
    authorizedClaims: self.authorizedClaims(),
    newDataSourceName: self.newDataSourceName(),
    description: self.formDescription(),
    fields: self.buildFieldsConfigExport(),
    plugins: self.plugins(),
  };
  return config;
}
DataformDesignerViewModel.prototype.dispose = function () {
  ko.utils.arrayForEach(this.__subscriptions, function (s) {
    s.dispose && s.dispose();
  });
  this.__subscriptions = [];
}
DataformDesignerViewModel.prototype.loadDataSourceOptions = function () {
  var self = this;
  return $.ajax({
    url: '/api/datasources',
    contentType: 'application/json',
    method: 'GET'
  }).then(function (data) {
    self.dataSourceOptions(data || []);
  });
}
DataformDesignerViewModel.prototype.loadClaimOptions = function () {
  var self = this;
  return $.ajax({
    url: '/api/d/__solutionforms_claims',
    contentType: 'application/json',
    method: 'GET'
  }).then(function (data) {
    self.claimsOptions(ko.utils.arrayMap(data, function (claim) { return claim.Name; }));
  });
}

module.exports = {
  viewModel: DataformDesignerViewModel,
  template: require('./dataform-form-designer.html')
}