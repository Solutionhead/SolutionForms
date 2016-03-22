require('App/fieldTypes'); //register field type components
require('koValidation');
var Field = require('models/formFieldLive'),
  toastr = require('toastr'),
  _ = require('underscore'),
  page = require('page');

//var plugins = {
//  //todo: dynamically load plugins
//  // --> See this discussion on plugins with webpack https://github.com/webpack/webpack/issues/118 
//  "plugins/saveToLocalDocumentStorePlugin": require('plugins/saveToLocalDocumentStorePlugin')(),
//  "plugins/initializeFormValuesPlugin": require('plugins/initializeFormValuesPlugin')(),
//};

ko.validation.init({
    insertMessages: false,
    decorateElement: true,
    errorElementClass: 'has-error'
});

function DataFormLive(params) {
    if (!(this instanceof DataFormLive)) { return new DataFormLive(params); }
    var self = this;
    var subscriptions = [],
      components_loaded = [];
    
    self.documentId = params.documentId;
    self.fields = ko.observableArray([]);
    self.parseConfig(params.config);

    self.saveCommandAsync = ko.asyncCommand({
      execute: function (complete) {
        try {
          self.notifyListenersAsync('submit', self).then(function () {
              toastr.success('Save completed successfully');
              if (self.documentId == undefined) {
                //assumes that the arguments[0] is the results of the ajax call
                self.documentId = arguments[0].Id;
                page.replace('/Forms/' + self.formId + '/' + self.documentId);
              }
              self.notifyListenersAsync('submitCompleted', self);
              complete();
            },
            function(xhr) {
              toastr.error(xhr.message, 'Failed to Save');
              complete();
            });
        } catch (e) {
          complete();
        }
      }
    });

    self.isRendered = ko.pureComputed(function() {
        return ko.utils.arrayFirst(self.fields(), function(f) {
            return f.context() == undefined;
        }) === null;
    });

  (function loadDocumentData(documentId) {
    if (!documentId) { return; }

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
      subscriptions.push(renderedSub);
    }

    function fetchData() {
      self.notifyListenersAsync('fetch', {
        id: documentId,
        entityName: ko.unwrap(self.formId),
        form: self
      }).then(function() {
        self.notifyListenersAsync('loaded', self);
      }, function() {
        toastr.error("Error: " + Arguments[2]);
      });
    }
  })(params.documentId);

    self.dispose = dispose;

    //self.exportedContext = ko.pureComputed(function() {
    //  var obj = {};
    //  ko.utils.arrayMap(self.fields(), function (field) {
    //    var fieldContext = field.context();
    //    obj[field.exportName] = fieldContext.userResponse;

    //    field.contet().userResponse.subscribe(function() { console.log('field.context changed') });
    //    obj[field.exportName].subscribe(function(val) { console.log('exported obj changed'); });
    //    fieldContext.userResponse.subscribe(function(val) { console.log('fieldContext obj changed'); });
    //  });
    //  return obj;
    //});
    
    return self;

    function dispose() {
        ko.utils.arrayForEach(subscriptions, function (subscription) {
            subscription.dispose && !subscription.isDisposed && subscription.dispose();
        });
        subscriptions = null;
    }
}

DataFormLive.prototype.parseConfig = function(jsonConfig) {
    var form = (typeof jsonConfig === "string" ? ko.utils.parseJson(jsonConfig) : jsonConfig) || {};
    if (form.dataSource == undefined || form.dataSource.documentName == undefined) {
        throw new Error("Invalid configuration: Missing or invalid dataSource property.");
    }

    // load components
    ko.utils.arrayMap(form.components || [], loadComponent);

    form.plugins = ko.utils.arrayMap(form.plugins || [], function (path) {
      try {
        var plugin = require('plugins/' + path)();
        return plugin;
      } catch (e) {
        toastr.error('Plugin failed to load');
      }
    });

  (function buildDataObject() {
    this.dataSource = form.dataSource;
    this.dataSourceId = form.dataSourceId;
    this.formId = form.id;
    this.formTitle = form.title;
    this.formDescription = form.description;

    this.setOrCreateObservable('fields', ko.utils.arrayMap(form.fields || [], function(f) {
      return new Field(f);
    }));
  }).call(this);

  this.listeners = (function parseListeners() {
    var listeners = {
      load: [],
      fetch: [],
      loaded: [],
      before_submit: [],
      submit: [],
      submitCompleted: [],
    };

    ko.utils.arrayForEach(form.plugins || [], function(p) {
      _.each(listeners, function(l, lname) {
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
  }).call(this);

  function loadComponent(path) {
    var componentFactory = require('customizations/' + path);
    if (componentFactory && componentFactory.componentName && !ko.components.isRegistered(componentFactory.componentName)) {
      componentFactory.synchronous = true; // enforce all components to be rendered synchronously to ensure proper order
      ko.components.register(componentFactory.componentName, componentFactory);
    }
  }
}
DataFormLive.prototype.notifyListenersAsync = function (event, args) {
  return $.when.apply(this, ko.utils.arrayMap(this.listeners[event], raiseEventOnListener));

  function raiseEventOnListener(listener) {
        return listener[event](args);
    }
}
DataFormLive.prototype.setOrCreateObservable = function(name, value) {
    if (ko.isObservable(this[name])) this[name](value);
    else this[name] = ko.observable(value);
}

module.exports = {
    viewModel: DataFormLive,
    template: require('./dataform-form-live.html'),
    synchronous: true
}