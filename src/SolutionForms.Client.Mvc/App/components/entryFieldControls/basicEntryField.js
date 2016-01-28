function BasicEntryField(params, isBase) {
    if (params == undefined || !ko.isObservable(params.context)) throw new Error('Requires argument params.context.');
    if (!(this instanceof BasicEntryField)) { return new BasicEntryField(params); }

    var self = this;

    self.settings = params.input.settings;

    if (!ko.isObservable(self.userResponse)) {
        self.userResponse = ko.observable();
    }

    BasicEntryField.prototype.setupValidators.call(self, params.input.settings);
    
    if (!isBase) {
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