import _create from "lodash/create";
import _assign from "lodash/assign";
var ko = require('ko');

module.exports = (function() {
  const fields = {};
  const fieldsArray = ko.observableArray([]);

  return {
    defaultFieldName: 'text-field',
    Fields: ko.pureComputed(function () {
      return fieldsArray();
    }, this),
    Field: {
      register: function(id, component) {
        const componentName = id;
        var ctor;

        if (component.viewModel == null) {
          component.viewModel = function() { return FieldBase.apply({}, arguments);}
          ctor = component.viewModel;
        } else {
          ctor = component.viewModel;
          //component.viewModel = extend(FieldBase, component.viewModel);
          //ctor = buildInheritanceConstructor(FieldBase, component.viewModel);

          //component.viewModel = {
          //  //createViewModel: ctor
          //  createViewModel: function () {

          //  }
          //}
        }


        if (fields[componentName] != null) {
          throw new Error(`Component name "${componentName}" is already registered. Component names must be unique.`);
        }
                
        component.synchronous = true; //component.synchronous == null ? true : component.synchronous;
        ko.components.register(componentName, component);

        var field = fields[id] = {
          name: component.name,
          componentName: componentName,
          viewModel: component.viewModel,
          template: component.template,
          base: FieldBase,
          __factory: ctor
        };
        fieldsArray.push(field);

        return field;
      },
      
      // register 
      registerFieldConfig: function(componentName, componentObject) {
        const liveComponent = fields[componentName];
        if (liveComponent == null) {
          throw new Error(`The field "${componentName}" is not registered. Fields must be registered prior to configuration.`);
        }

        componentObject = componentObject || { viewModel: null };
        
        var ctor;
        if (componentObject.viewModel == null) {
          componentObject.viewModel = liveComponent.viewModel;
          ctor = liveComponent.__factory;
        } else {
          componentObject.viewModel = extend(liveComponent.viewModel, componentObject.viewModel);
          ctor = function(params) {
            var field = liveComponent.viewModel.createViewModel ?
              liveComponent.viewModel.createViewModel(params) :
              liveComponent.viewModel(params);
            return componentObject.viewModel(field, params);
          };
        }
        componentObject.template = componentObject.template || "<div></div>";

        ko.components.register(`${componentName}-config`, {
          viewModel: {
            createViewModel: ctor
          },
          template: componentObject.template,
          synchronous: true
        });

        liveComponent.__config = componentObject.viewModel;
      },

      unregister: function(name) {
        const component = fields[name];
        if (component) {
          ko.components.unregister(component.componentName);
          delete fields[name];
        }
      },

      isRegistered: function (componentName) {
        return ko.components.isRegistered(componentName);
      }
    },
    FieldBase: FieldBase,
    getTenantId: function() {
      var hostparts = location.hostname.split('.');
      var subdomain = hostparts.shift();
      return subdomain;
    }
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
    
  if (ko.isWritableObservable(input.context)) {
    input.context(self);
  }

  if (!(typeof self.setValue === "function")) {
    self.setValue = function(val) {
      self.userResponse(val || ko.unwrap(this.defaultUserResponse));
    }
  }

  if (ko.isObservable(params.exports)) {
    params.exports({
      userResponse: ko.pureComputed(() => {
        return self.userResponse();
      })
    })
  }

  self.dispose = dispose;

  return self;

  function dispose() {
    params.context && ko.isObservable(params.context) && params.context(null);
  }
}

function buildInheritanceConstructor(base, superClass) {
  return function (params) {
    var me = new base(params);
    me.prototype = superClass
    superClass.prototype = me;
    ///extend(me, superClass);
    me = superClass.apply(me, params);

    //var me = new superClass(params);
    //base.apply(me, params);
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