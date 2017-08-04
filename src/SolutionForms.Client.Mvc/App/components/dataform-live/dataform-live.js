ko.punches.enableAll();
var toastr = require('toastr'),
  _ = require('underscore'),
  formsService = require('services/dataFormsService');

ko.components.register('form-field', require('components/form-field/form-field'));

/* Framework level component which understands how to deserialize the configuration data and pass it into the
 * specified UI container.
 */
function DataFormLive(params) {
  if (!(this instanceof DataFormLive)) { return new DataFormLive(params); }
  var self = this;
  var __disposables = [];

  self.plugins = ko.observableArray([]);
  self.activeComponent = ko.observable();
  self.formId = ko.observable();
  self.documentId = params.documentId;
  self.formTitle = ko.observable();
  self.formDescription = ko.observable();
  self.listeners = [];
  self.formConfig = ko.pureComputed(function () {
    return ko.unwrap(params.config) || {};
  });

  __disposables.push(ko.computed(function () {
    loadComponent(params.formId());
  }));

  if (ko.isObservable(params.config)) {
    __disposables.push(ko.computed(function () {
      self.initFromConfig(ko.unwrap(params.config));
    }));
  };

  self.dispose = dispose;
  
  return self;

  function loadComponent(formId) {
    if (formId == null || formId === self.formId()) {
      return;
    }

    self.activeComponent(null);

    formsService.getDataFormByIdAsync(formId)
      .then(function (data) {

        self.initFromConfig(data);
      })
      .fail(function () {
        if (arguments[0].status === 401) {
          toastr.error("You are not authorized to view this form. Please see the system administrator if you believe this is an error.", "Unauthorized Access.");
        } else {
          toastr.error(arguments[2], "Error loading form.");
        }
      });
  }

  function dispose() {
    ko.utils.arrayForEach(__disposables, function (d) {
      d.dispose && !d.isDisposed && d.dispose();
    });
  }
}

DataFormLive.prototype.initFromConfig = function (jsonConfig) {
  const self = this;
  const config = (typeof jsonConfig === "string" ? ko.utils.parseJson(jsonConfig) : jsonConfig) || {};
  if (config.dataSource == undefined || config.dataSource.documentName == undefined) {
    throw new Error("Invalid configuration: Missing or invalid dataSource property.");
  }

  self.setOrCreateObservable("dataSource", config.dataSource);
  self.setOrCreateObservable("dataSourceId", config.dataSourceId);
  self.setOrCreateObservable("formId", config.id);
  self.setOrCreateObservable("formTitle", config.title);
  self.setOrCreateObservable("formDescription", config.description);


  var plugins = ko.utils.arrayMap(config.plugins || [], function (path) {
    try {
      return require('plugins/' + path);
    } catch (e) {
      toastr.error('Plugin failed to load: ' + path);
    }
  });

  self.plugins(plugins);
  self.listeners = self.parseListeners(plugins);

  var containerName = config.formType || config.containerType || 'default-container';
  if (!ko.components.isRegistered(containerName)) {
    ko.components.register(containerName, require(`containers/${containerName}/${containerName}`));
  }

  self.activeComponent({
    name: containerName,
    params: {
      config: config,
      documentId: self.documentId,
      formId: self.formId,
      notifyListenersAsync: self.notifyListenersAsync.bind(self),
    }
  });
}
DataFormLive.prototype.parseListeners = function (plugins) {
  var listeners = {
    load: [],
    fetch: [],
    loaded: [],
    before_submit: [],
    submit: [],
    submitCompleted: [],
  };

  //todo: make events discoverable on plugins rather than hard-coded
  ko.utils.arrayForEach(plugins, function (p) {
    _.each(listeners, function (l, lname) {
      addListenerIfHasHandlerForEvent(p, lname);
    });
  });

  return listeners;

  function addListenerIfHasHandlerForEvent(plugin, event) {
    if (plugin && hasHandlerForEvent.call(plugin, event)) {
      listeners[event].push(plugin);
    }
  }

  function hasHandlerForEvent(eventName) {
    return typeof this[eventName] === "function";
  }
}
DataFormLive.prototype.notifyListenersAsync = function (event, args) {
  var self = this;
  if (arguments.length > 1) {
    args = Array.prototype.slice.call(arguments, 1);
  }
  return $.when.apply(this, ko.utils.arrayMap(self.listeners[event], raiseEventOnListener));

  function raiseEventOnListener(listener) {
        return listener[event].apply(self, args);
    }
}
DataFormLive.prototype.setOrCreateObservable = function (name, value) {
  if (ko.isWritableObservable(this[name])) this[name](value);
  else this[name] = ko.observable(value);
}
module.exports = {
    viewModel: DataFormLive,
    template: require('./dataform-live.html'),
    synchronous: true
}