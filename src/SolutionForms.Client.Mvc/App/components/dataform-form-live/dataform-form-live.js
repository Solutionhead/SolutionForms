require('App/fieldTypes'); //register field type components
require('koValidation');
var toastr = require('toastr'),
  _ = require('underscore'),
  page = require('page');

ko.validation.init({
    insertMessages: false,
    decorateElement: true,
    errorElementClass: 'has-error'
});

ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));

function DataFormLive(params) {
    if (!(this instanceof DataFormLive)) { return new DataFormLive(params); }
    var self = this;


    self.subscriptions = [];
    self.plugins = ko.observableArray([]);

    self.documentId = ko.pureComputed(function() {
      return ko.unwrap(params.documentId);
    });

    self.formConfig = ko.pureComputed(function () {
      return ko.unwrap(params.config) || {};
    });

    self.dynamicFormUIExport = ko.observable();
    self.fields = ko.pureComputed(function() {
      var formVm = self.dynamicFormUIExport();
      return formVm ? formVm.fields() : [];
    });
    
    self.saveCommandAsync = ko.asyncCommand({
      execute: function (complete) {
        try {
          var data = self.dynamicFormUIExport().buildDto();
          data.documentId = self.documentId();

          self.notifyListenersAsync('submit', data, self)
            .done(function() {
              toastr.success('Save completed successfully');
              if (self.documentId == undefined) {
                //assumes that the arguments[0] is the results of the ajax call
                self.documentId = arguments[0].Id;
                page.replace('/Forms/' + self.formId + '/' + self.documentId);
              }
              self.notifyListenersAsync('submitCompleted', self);
              complete();
            }).fail(function(xhr) {
              toastr.error(xhr.message, 'Failed to Save');
              complete();
            });
        } catch (e) {
          complete();
        }
      }
    });

    self.isRendered = ko.pureComputed(function () {
      return self.dynamicFormUIExport() && self.dynamicFormUIExport().isReady();
    });

    self.ready = ko.pureComputed(function() {
      return self.formConfig() != undefined
        && self.isRendered() === true;
    });

    ko.computed(function() {
      self.initFromConfig(ko.unwrap(params.config));
    });
    self.parseListeners();
    self.loadDocumentData(params.documentId);

    self.dispose = dispose;
  
    return self;

    function dispose() {
        ko.utils.arrayForEach(self.subscriptions, function (subscription) {
            subscription.dispose && !subscription.isDisposed && subscription.dispose();
        });
        self.subscriptions = null;
    }
}

DataFormLive.prototype.initFromConfig = function (jsonConfig) {
  var self = this;

  var config = (typeof jsonConfig === "string" ? ko.utils.parseJson(jsonConfig) : jsonConfig) || {};
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
      var plugin = require('plugins/' + path)();
      return plugin;
    } catch (e) {
      toastr.error('Plugin failed to load: ' + path);
    }
  });

  self.plugins(plugins);
}
DataFormLive.prototype.parseListeners = function() {
  var listeners = {
    load: [],
    fetch: [],
    loaded: [],
    before_submit: [],
    submit: [],
    submitCompleted: [],
  };

  ko.utils.arrayForEach(this.plugins(), function (p) {
    _.each(listeners, function (l, lname) {
      addListenerIfHasHandlerForEvent(p, lname);
    });
  });

  this.listeners = listeners;

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
  return $.when.apply(this, ko.utils.arrayMap(this.listeners[event], raiseEventOnListener));

  function raiseEventOnListener(listener) {
        return listener[event].apply(self, args);
    }
}
DataFormLive.prototype.loadDocumentData = function (documentId) {
  if (documentId == undefined) { return; }

  var self = this;

  if (self.isRendered()) {
    fetchData();
  } else {
    var renderedSub = self.isRendered.subscribe(function(rendered) {
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
      entityName: ko.unwrap(self.formId),
      form: self
    }).done(function() {
      self.notifyListenersAsync('loaded', self);
    }).fail(function() {
      toastr.error("Error: " + arguments[2]);
    });
  }
}
DataFormLive.prototype.setOrCreateObservable = function (name, value) {
  if (ko.isWritableObservable(this[name])) this[name](value);
  else this[name] = ko.observable(value);
}

module.exports = {
    viewModel: DataFormLive,
    template: require('./dataform-form-live.html'),
    synchronous: true
}