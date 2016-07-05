import fieldsHelper from 'viewModels/dataformFieldsDesigner';

function SubFormFieldConfigViewModel(field, params) {
    if (!(this instanceof SubFormFieldConfigViewModel)) { return new SubFormFieldConfigViewModel(field, params); }

    var self = this,
        settings = params.input.settings.peek() || {};

    self.constructFieldsForConfig(params);

    settings.fields = self.fields;

    params.input.settings(settings);
}


SubFormFieldConfigViewModel.prototype.constructFieldsForConfig = function (params) {
    var settings = ko.unwrap(params.input.settings);
    var mappedFields = ko.utils.arrayMap(settings.fields || [], function (f) {
        return f.config || {};
    });

    params.input.fields = mappedFields;

    fieldsHelper.call(this, params);
}

module.exports = SubFormFieldConfigViewModel;