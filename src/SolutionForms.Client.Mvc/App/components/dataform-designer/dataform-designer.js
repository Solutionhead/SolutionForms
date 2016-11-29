ko.punches.enableAll();
require('ko.bs.collapse');
require('ko.sortable');
ko.components.register('dataform-fields-designer', require('components/dataform-fields-designer/dataform-fields-designer'));
//var base = require('viewModels/dataformFieldsDesigner'),
var toastr = require('toastr'),
  page = require('page');
function split(val) {
  return val.split(/,\s*/);
}

function extractLast(term) {
  return split(term).pop();
}

function DataformDesignerViewModel(params) {
  if (!(this instanceof DataformDesignerViewModel)) { return new DataformDesignerViewModel(params); }

  var self = this,
      values = self.parseInputConfig(params.input);

  //base.call(this, params);

  self.fieldsParams = {
    fieldsConfig: ko.observable( values.fields ),
    inputTypeOptions: ko.observableArray([]),
    exports: ko.observable()
  }

  self.__subscriptions = [];
  self.formId = values.id;
  self.formTitle = ko.observable(values.title);
  self.dataSourceId = ko.observable();
  self.newDataSourceName = ko.observable();
  self.formDescription = ko.observable(values.description);
  self.authorizedClaims = ko.observable();
  self.claimsOptions = ko.observableArray(values.authorizedClaims || []);
  self.restrictDataAccessByOwner = ko.observable(false);
  self.linkOnHomePage = ko.observable(true);
  self.containerOptions = [
    {
      name: 'Default Layout',
      value: 'default-container',
      description: 'Master / Details view with button for creating and saving data. Useful for basic data entry.'
    }, {
      name: 'Empty Layout',
      value: 'empty-container',
      description: 'Does not contain any elements or functionality. Ideal for custom components which handle their own database operations.'
    }
  ];
  var containerType = ko.observable();
  self.containerType = ko.computed({
    read: function() {
      return containerType();
    },
    write: function(value) {
      if (typeof(value) === "string") {
        value = ko.utils.arrayFirst(self.containerOptions, (o) => o.value === value);
      }
      containerType(value);
    }
  });
  self.containerType(values.formType || self.containerOptions[0].value);

  self.isNewDataSource = ko.computed(function () {
    return self.dataSourceId() == undefined;
  }, self);


  self.dataSourceOptions = ko.observableArray([]);

  self.plugins = ko.observableArray(values.plugins);
  self.customizations = ko.observableArray(values.components);

  //setup
  var loadDataSourceOptionsPromise = self.loadDataSourceOptions();
  var loadClaimsPromise = self.loadClaimOptions();

  self.loadCustomizations(values);
  loadDataSourceOptionsPromise.then(function () {
    values.dataSourceId && self.dataSourceId(values.dataSourceId);
  });
  loadClaimsPromise.then(function () {
    values.authorizedClaims && self.authorizedClaims(values.authorizedClaims);
  });

  if (ko.isObservable(params.input)) {
    self.__subscriptions.push(params.input.subscribe(function (value) {
      var formConfig = self.parseInputConfig(value);
      self.formId = formConfig.id;
      self.formTitle(formConfig.title);
      self.formDescription(formConfig.description);
      self.loadCustomizations(formConfig); // must be lodaded before fields are set or the selected option will not be set
      self.plugins(formConfig.plugins);
      self.customizations(formConfig.components);
      self.linkOnHomePage(formConfig.linkOnHomePage);
      self.containerType(formConfig.formType);
      
      self.fieldsParams.fieldsConfig( formConfig.fields );

      loadDataSourceOptionsPromise.then(function () {
        if (formConfig.dataSourceId == undefined) console.warn('dataSourceId is undefined');
        self.dataSourceId(formConfig.dataSourceId);
      });
      loadClaimsPromise.then(function () {
        self.authorizedClaims(formConfig.authorizedClaims || []);
      });
    }));
  } else {
    //when is params.input not an observable
    console.log('params.input is not an observable!');

    self.loadCustomizations(values);
    loadDataSourceOptionsPromise.then(function () {
      values.dataSourceId && self.dataSourceId(values.dataSourceId);
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
            self.dataSourceId(selected ? selected.id : null);
          });
        }

        if (isNew) {
          var id = arguments[0].id;
          self.formId = id;

          //Note: The response header includes the created at route in the `Location` property. 
          //  It is an absolute route but perhaps we could consider grabing the route from there rather than duplicating the information here.
          page.replace('/Forms/' + id + '/Designer');
        }

        toastr.success('Your changes were saved successfully!', 'Save Completed');
      }).fail(function() {
        toastr.error('', 'Save failed');
      }).always(complete);
    },
    canExecute: function (isExecuting) {
      return !isExecuting;
    }
  });

  if (ko.isObservable(params.exports)) { params.exports(self); }

  return self;
}

//DataformDesignerViewModel.prototype = base.prototype;
DataformDesignerViewModel.prototype.defaultValues = {
  title: "Untitled form",
  plugins: ['getDataFromLocalStorePlugin', 'saveToLocalDocumentStorePlugin'],
  components: []
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
    fields: self.fieldsParams.exports().fieldsConfig(),
    plugins: self.plugins(),
    components: self.customizations(),
    restrictDataAccessByOwner: self.restrictDataAccessByOwner(),
    linkOnHomePage: self.linkOnHomePage(),
    formType: self.containerType().value
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
DataformDesignerViewModel.prototype.loadCustomizations = function (config) {
  // plugins
  var me = this;
  var pluginsSourceTemp = config.components || [],
    typeOptionsToAdd = [];

  ko.utils.arrayForEach(pluginsSourceTemp, function (src) {
    var plugin = require(`customizations/${ src }-config`);
    plugin.synchronous = true;
    plugin.config.template = plugin.config.template || '<div></div>';

    ko.components.register(
      plugin.componentName + '-config',
      plugin.config);

    ko.components.register(
      plugin.componentName,
      plugin);

    typeOptionsToAdd.push({
      name: plugin.name,
      componentName: plugin.componentName
    });
  });

  ko.utils.arrayPushAll(me.fieldsParams.inputTypeOptions(), typeOptionsToAdd);
  me.fieldsParams.inputTypeOptions.notifySubscribers();
}
module.exports = {
  viewModel: DataformDesignerViewModel,
  template: require('./dataform-designer.html')
}