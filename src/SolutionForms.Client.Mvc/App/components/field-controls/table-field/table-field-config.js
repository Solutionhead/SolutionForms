//var base = require('controls/table-field/table-field').viewModel;

function SubFormFieldConfigViewModel(params) {
    if (!(this instanceof SubFormFieldConfigViewModel)) { return new SubFormFieldConfigViewModel(params); }

    var self = this,
        settings = params.input.settings.peek() || {};

    self.constructFieldsForConfig(params);

    base.call(self, params);

    self.addNewItem.execute();
    settings.fields = self.fields;
}

//SubFormFieldConfigViewModel.prototype = base.prototype;

SubFormFieldConfigViewModel.prototype.constructFieldsForConfig = function (params) {
    var settings = ko.unwrap(params.input.settings);
    var mappedFields = ko.utils.arrayMap(settings.fields || [], function (f) {
        return f.config || {};
    });

    params.input.fields = mappedFields;

    var fieldsHelper = require('viewModels/dataformFieldsDesigner');
    fieldsHelper.call(this, params);
}

module.exports = {
    viewModel: SubFormFieldConfigViewModel,
    template: require('./table-field-config.html')
}