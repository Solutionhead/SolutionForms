import _create from "lodash/create";
import _assign from "lodash/assign";
var ko = require('ko');


module.exports = (function() {
  const fields = {};

  return {
    Fields: fields,
    Field: {
      register: function(id, component) {
        //var vm = component.viewModel;
        const componentName = id;
        var ctor;

        if (component.viewModel == null) {
          component.viewModel = function() { return FieldBase.apply({}, arguments);}
          ctor = component.viewModel;
        } else {
          component.viewModel = extend(FieldBase, component.viewModel);
          ctor = buildInheritanceConstructor(FieldBase, component.viewModel);
        }


        if (fields[componentName] != null) {
          throw new Error(`Component name "${componentName}" is already registered. Component names must be unique.`);
        }

        fields[id] = {
          name: component.name,
          componentName: componentName,
          viewModel: component.viewModel,
          template: component.template,
          base: FieldBase,
          __factory: ctor
        };

        // register ko component
        component.viewModel = {
          createViewModel: ctor
        }
        component.synchronous = component.synchronous == null ? true : component.synchronous;
        ko.components.register(componentName, component);
      },


      // register 
      registerFieldConfig: function(componentName, configuration) {
        const liveComponent = fields[componentName];
        configuration = configuration || { viewModel: null };
        if (liveComponent == null) {
          throw new Error(`The field "${componentName}" is not registered. Fields must be registered prior to configuration.`);
        }

        var ctor;
        if (configuration.viewModel == null) {
          configuration.viewModel = liveComponent.viewModel;
          ctor = liveComponent.__factory;
        } else {
          configuration.viewModel = extend(liveComponent.viewModel, configuration.viewModel);
          ctor = function(params) {
            var field = new liveComponent.viewModel(params);
            return configuration.viewModel(field, params);
          };
        }
        configuration.template = configuration.template || "<div></div>";

        ko.components.register(`${componentName}-config`, {
          viewModel: {
            createViewModel: ctor
          },
          template: configuration.template,
          synchronous: true
        });

        liveComponent.__config = configuration.viewModel;
      },

      unregister: function(name) {
        const component = fields[name];
        if (component) {
          ko.components.unregister(component.componentName);
          delete fields[name];
        }
      }
    },
    FieldBase: FieldBase
  }
}());

function extend(baseType, superType) {
  // Cache sub prototype before overwriting with base
  var origPrototype = superType.prototype;
  var proto = _create(
    baseType.prototype,
    _assign(
      {
        'constructor': superType,
        '_super': baseType.prototype
      },
      origPrototype
    ));
    superType.prototype = proto;
  
  // Make constructor non-enumerable
  Object.defineProperty( superType.prototype, 'constructor', {
    enumerable: false,
    value: superType
  });

  return superType;
}

function FieldBase(params) {
  params = params || {};
  const self = this;
  const input = params.input || {};
  self.settings = ko.unwrap(input.settings) || {};

  if (!ko.isObservable(self.userResponse)) {
    // input.valueContext is optionally used by the form-field ui component
    self.userResponse = ko.isWritableObservable(input.valueContext) ? 
      input.valueContext : ko.observable();
  }

  FieldBase.prototype.setupValidators.call(self, self.settings);
    
  if (ko.isWritableObservable(params.context)) {
    params.context(self);
  }

  if (!(typeof self.setValue === "function")) {
    self.setValue = function(val) {
      self.userResponse(val || ko.unwrap(this.defaultUserResponse));
    }
  }

  self.dispose = dispose;

  return self;

  function dispose() {
    params.context && ko.isObservable(params.context) && params.context(null);
  }
}

function buildInheritanceConstructor(base, superClass) {
  return function(params) {
    var me = new superClass(params);
    base.apply(me, params);
    params.context(me);
    return me;
  }
}

FieldBase.prototype.setValue = function(val) {
  this.userResponse(val);
}

FieldBase.prototype.setupValidators = function(settings) {
  const s = ko.toJS(settings) || {};
  const validation = s.validation || { isRequired: false };
  this.userResponse.extend({ required: validation.isRequired });
}