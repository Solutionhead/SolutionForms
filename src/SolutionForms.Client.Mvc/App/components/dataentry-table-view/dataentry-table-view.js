ko.punches.textFilter.enableForBinding('text');
var fetchPlugin = require('plugins/getDataFromLocalStorePlugin')(),
    page = require('page');

//require('kendoCss/kendo.common.min.css');
//require('kendoCss/kendo.default.min.css');
//require('kendoCss/kendo.default.mobile.min.css');
//require('kendoCss/kendo.bootstrap.min.css');
//require('kendoCss/kendo.bootstrap.mobile.min.css');
//require('kendoScripts/jquery.min');
//require('kendoScripts/kendo.grid.min');
//require('koKendo');

function DataEntryTable(params) {
    if (!(this instanceof DataEntryTable)) return new DataEntryTable(params);

    var self = this;

    self.formId = ko.observable();
    self.formFields = ko.observableArray([]);
    self.records = ko.observableArray([]);

    self.parseConfig(params.config);

    self.navigateToDetails = navigateToDetails;
    
    function navigateToDetails(item) {
        page('/Forms/' + self.formId() + '/' + item.Id);
    }

    return self;
}

DataEntryTable.prototype.parseConfig = function (input) {
    var values = input || {},
        self = this;

    if (typeof values === "string") { values = ko.parseJSON(input) || {}; }
    if (values.dataSource == undefined || values.dataSource.documentName == undefined) {
        throw new Error("Invalid configuration data: Missing or invalid dataSource property.");
    }

    if (values.id) {
        self.formId(values.id);
        var args = { entityName: values.dataSource.documentName };
        fetchPlugin.fetch(args)
            .then(function (data) {
                self.records(data);
            });
    }

    this.formFields((values.fields || []).slice(0, 5));
}

module.exports = {
    template: require('./dataentry-table-view.html'),
    viewModel: DataEntryTable
}