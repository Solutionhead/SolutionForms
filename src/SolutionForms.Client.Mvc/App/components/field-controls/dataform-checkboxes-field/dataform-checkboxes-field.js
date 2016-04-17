var base = require('controls/basicEntryField');

function CheckboxesFieldViewModel(params) {
    if (params == undefined || params.context == undefined) throw new Error('Requires argument params.context');
    if (!(this instanceof CheckboxesFieldViewModel)) { return new CheckboxesFieldViewModel(params); }

    var self = this,
        input = ko.unwrap(params.input) || {},
        settings = ko.unwrap(input.settings) || {};

    self.userResponse = ko.observableArray([]);

    base.call(this, params, true);

    self.options = ko.observableArray(ko.unwrap(settings.options) || []);

    params.context(self);

    self.setValue = function (val) {
        self.userResponse(val || []);
    }

    return self;
}

CheckboxesFieldViewModel.prototype = base.prototype;

module.exports = {
    viewModel: CheckboxesFieldViewModel,
    template: require('./dataform-checkboxes-field.html'),
    synchronous: true,
}