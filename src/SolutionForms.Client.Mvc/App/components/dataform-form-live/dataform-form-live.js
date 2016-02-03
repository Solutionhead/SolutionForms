require('App/fieldTypes'); //register field type components
require('koValidation');
var Field = require('models/formFieldLive'),
  toastr = require('toastr'),
  _ = require('underscore'),
  page = require('page');

var plugins = {
  //todo: dynamically load plugins
  // --> See this discussion on plugins with webpack https://github.com/webpack/webpack/issues/118 
  "plugins/saveToLocalDocumentStorePlugin": require('plugins/saveToLocalDocumentStorePlugin')(),
  "plugins/initializeFormValuesPlugin": require('plugins/initializeFormValuesPlugin')(),
};

ko.validation.init({
    insertMessages: false,
    decorateElement: true,
    errorElementClass: 'has-error'
});

function DataFormLive(params) {
    if (!(this instanceof DataFormLive)) { return new DataFormLive(params); }
    var self = this;
    var subscriptions = [];
    
    self.documentId = params.documentId;
    self.fields = ko.observableArray([]);
    self.parseConfig(params.config);

    self.saveCommandAsync = ko.asyncCommand({
        execute: function (complete) {
            self.notifyListenersAsync('submit', self).then(function () {
                    if (self.documentId == undefined) {
                        //assumes that the arguments[0] is the results of the ajax call
                        self.documentId = arguments[0].Id;
                        page.replace('/Forms/' + self.formId + '/' + self.documentId);
                    }
                    self.notifyListenersAsync('submitCompleted', self);
                    toastr.success('Save completed successfully');
                    complete();
                },
                function(xhr) {
                    toastr.error(xhr.message, 'Failed to Save');
                    complete();
                });
        }
    });

    self.isRendered = ko.pureComputed(function() {
        return ko.utils.arrayFirst(self.fields(), function(f) {
            return f.context() == undefined;
        }) === null;
    });

    if (params.documentId) {
        if (self.isRendered()) {
            fetchData();
        } else {
            var renderedSub = self.isRendered.subscribe(function(rendered) {
                if (!rendered) return;
                fetchData();
                renderedSub.dispose();
                renderedSub = null;
            });
            subscriptions.push(renderedSub);
        }

        //todo: replace with initalizeFormValuesPlugin
        function fetchData() {
            self.notifyListenersAsync('fetch', {
                id: params.documentId,
                entityName: ko.unwrap(self.formId),
                form: self
            }).then(function() {
                self.notifyListenersAsync('loaded', self);
            }, function() {
                toastr.error("Error: " + Arguments[2]);
            });
        }
    }

    self.dispose = dispose;
    
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

    buildDataObject.call(this);
    
    this.listeners = parseListeners();

    function buildDataObject() {
        this.dataSource = form.dataSource;
        this.dataSourceId = form.dataSourceId;
        this.formId = form.id;
        this.formTitle = form.title;
        this.formDescription = form.description;

        this.setOrCreateObservable('fields', ko.utils.arrayMap(form.fields || [], function (f) {
            return new Field(f);
        }));
    }

    function parseListeners() {
        var listeners = {
            load: [],
            fetch: [],
            loaded: [],
            submitting: [],
            submit: [],
            submitCompleted: [],
        };

        ko.utils.arrayForEach(form.plugins || [], function (pname) {
            _.each(listeners, function (l, lname) {
                wireListenerIfRegistered(plugins[pname], lname);
            });
        });

        return listeners;

        function wireListenerIfRegistered(plugin, event) {
            if (plugin && isRegisteredForEvent.call(plugin, event)) {
                listeners[event].push(plugin);
            }
        }
        function isRegisteredForEvent(eventName) {
            return typeof this[eventName] === "function";
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