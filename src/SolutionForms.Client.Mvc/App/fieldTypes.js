require('bindings/datepicker');

(function() {
    var fieldTypes = {
        textField: {
            name: 'Text',
            componentName: 'text-input',
        },
        paragraphTextField: {
            name: 'Paragraph Text',
            componentName: 'paragraph-text-input',
        },
        checkboxField: {
            name: 'Checkboxes',
            componentName: 'checkbox-input'
        },
        selectField: {
            name: 'Select from list',
            componentName: 'select-input'
        },
        dateField: {
            name: 'Date',
            componentName: 'date-input'
        },
        tableField: {
            name: 'Table',
            componentName: 'table-input'
        },
    };
    module.exports = fieldTypes;

    // configuration component registration
    ko.components.register(
        fieldTypes.textField.componentName + '-config',
        require('controls/dataform-text-field/dataform-text-field-config'));
    ko.components.register(fieldTypes.paragraphTextField.componentName + '-config', {
        viewModel: require('controls/basicEntryField'),
        template: require('components/entryFieldPreviewTemplates/dataform-paragraph-text-field-preview.html')
    });
    ko.components.register(fieldTypes.checkboxField.componentName + '-config', require('components/dataform-checkboxes-field-config/dataform-checkboxes-field-config'));
    ko.components.register(fieldTypes.selectField.componentName + '-config', require('controls/dataform-select-field/dataform-select-field-config'));
    ko.components.register(fieldTypes.dateField.componentName + '-config', {
        viewModel: require('controls/basicEntryField'),
        template: require('controls/dataform-date-field/dataform-date-field-config.html')
    });
    ko.components.register(fieldTypes.tableField.componentName + '-config', require('controls/dataform-table-field/dataform-table-field-config'));

    // live component registration
    ko.components.register(fieldTypes.textField.componentName, {
        viewModel: require('controls/basicEntryField'),
        template:  require('controls/dataform-text-field/dataform-text-field.html')
    });
    ko.components.register(fieldTypes.paragraphTextField.componentName, {
        viewModel: require('controls/basicEntryField'),
        template:  require('controls/dataform-paragraph-text-field.html')
    });
    ko.components.register(fieldTypes.checkboxField.componentName, require('controls/dataform-checkboxes-field/dataform-checkboxes-field'));
    ko.components.register(fieldTypes.selectField.componentName, require('controls/dataform-select-field/dataform-select-field'));

  ko.components.register(fieldTypes.dateField.componentName, require('controls/dataform-date-field/dataform-date-field'));
    //ko.components.register(fieldTypes.dateField.componentName, {
    //    viewModel: require('controls/basicEntryField'),
    //    template:  require('controls/dataform-date-field/dataform-date-field.html')
    //});
    ko.components.register(fieldTypes.tableField.componentName, require('controls/dataform-table-field/dataform-table-field'));

}());