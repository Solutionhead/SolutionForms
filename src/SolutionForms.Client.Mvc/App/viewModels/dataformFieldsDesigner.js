var FieldContext = require('models/formFieldDesigner'),
    inputTypes = require('App/fieldTypes');

function DataformFieldsDesigner(params) {
    var self = this,
        config = parseInputConfig(params.input),
        DesignerField = require('viewModels/dataformFieldConfigViewModel'),
        activeField;

    var _fields = ko.observableArray([]);
    self.fields = ko.computed({
        read: function () { return _fields; },
        write: function (value) {
            _fields(ko.utils.arrayMap(value, FieldContext));
        }
    });
    self.fields.push = function(val) {
        _fields.push(new FieldContext(val));
    }
    self.fields.splice = function(val, index) {
        _fields.splice(new FieldContext(val, index));
    }
    self.inputTypeOptions = ko.observableArray(buildInputInternalTypeOptions());

    self.addItemCommand = ko.command({
        execute: function (type) {
            insertField(type);
        }
    });
    self.removeItemCommand = ko.command({
        execute: function (field) {
            console.log(arguments);
            removeField(field);
        }
    });

    config.fields.length
        ? self.fields(config.fields)
        : insertField(self);

    // functions
    self.activateField = activateFieldPublic;
    self.finishEditingField = finishEditingFieldPublic;
    
    return self;

    function insertField(type, index) {
        index == undefined
            ? self.fields.push({})
            : self.fields.splice({}, index);
    }
    function removeField(field) {
        ko.utils.arrayRemoveItem(_fields(), field);
        _fields.notifySubscribers(_fields());
    }
    function activateFieldPublic(field) {
        if (!(field instanceof FieldContext)) return;

        if (activeField && activeField.isActive && ko.isObservable(activeField.isActive)) {
            activeField.isActive(false);
        }

        field.isActive(true);
        activeField = field;
    }
    function finishEditingFieldPublic(field) {
        if (!(field instanceof FieldContext)) return;
        field.config(new DesignerField(ko.toJS(field.config())));
        field.isActive(false);
        if (field == activeField) activeField = null;
    }
}

function parseInputConfig(configValues) {
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

    return $.extend({}, DataformFieldsDesigner.prototype.defaultValues, input);
}
function buildInputInternalTypeOptions() {
  var opts = [];

    for (var prop in inputTypes) {
        if (inputTypes.hasOwnProperty(prop)) {
            opts.push(inputTypes[prop]);
        }
    }

    return opts;
}

DataformFieldsDesigner.prototype.buildFieldsConfigExport = function () {
    return ko.utils.arrayMap(this.fields()(), function(f) {
        return f.config().exportConfig();
    });
}

DataformFieldsDesigner.prototype.defaultValues = {
    fields: []
};


module.exports = DataformFieldsDesigner;