function Field(input, value) {
    if (!(this instanceof Field)) { return new Field(input, value); }

    var self = this;

    $.extend(self, Field.prototype.DEFAULTS, input);

    self.context = ko.observable();
    self.validationElement = ko.pureComputed(function () {
        var context = self.context();
        //HACK: in order to prevent the validationElement and validationMessage bindings from throwing an error, return the unbound observable as a fallback.
        //Consider replacing this hack with a binding - vk 2015-06-19
        return context && ko.isObservable(context.userResponse)
          ? context.userResponse : ko.observable();
    });
    
    self.setValue = Field.prototype.setValue.bind(self);
    value != undefined && self.setValue(value);

    return self;
}

Field.prototype.DEFAULTS = {
    displayName: null,
    exportName: null,
    helpText: null,
    inputType: null,
    settings: {},
    fieldType: 'fieldset'
}

Field.prototype.setValue = function (val) {
    var input = this;
    if (input.context() == undefined) {
        var sub = input.context.subscribe(function(ctx) {
            setContextValue(ctx, val);
            sub.dispose();
            sub = null;
        });
    } else {
        setContextValue(input.context(), val);
    }

    function setContextValue(context, value) {
        if (typeof context.setValue === "function") {
            context.setValue(value);
        } else {
            context.userResponse(value);
        }
    }
}

module.exports = Field;