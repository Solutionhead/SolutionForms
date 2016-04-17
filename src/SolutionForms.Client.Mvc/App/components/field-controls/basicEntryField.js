function BasicEntryField(params, isBase) {
    if (!(this instanceof BasicEntryField)) { return new BasicEntryField(params); }

    var self = this;

    params.input = params.input || {};
    self.settings = params.input.settings || {};

    // this is used by the form-field ui component
    if (!ko.isObservable(self.userResponse)) {
      self.userResponse = ko.isWritableObservable(params.input.valueContext)
        ? params.input.valueContext : ko.observable();
    }

    BasicEntryField.prototype.setupValidators.call(self, self.settings);
    
    if (!isBase && ko.isWritableObservable(params.context)) {
        params.context(self);
    }

    self.dispose = dispose;

    return self;

    function dispose() {
        params.context && ko.isObservable(params.context) && params.context(null);
    }
}

BasicEntryField.prototype.setValue = function(val) {
    this.userResponse(val);
}
BasicEntryField.prototype.dispose = function() {
    
}
BasicEntryField.prototype.setupValidators = function(settings) {
    var s = ko.toJS(settings) || {};
    var validation = s.validation || {};
    if (validation.isRequired) {
        this.userResponse.extend({ required: true });
    }
}

module.exports = BasicEntryField;