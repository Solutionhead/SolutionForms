import core from 'App/core';
import Field from 'models/formFieldLive';

function TableFieldViewModel(params) {
    if (!(this instanceof TableFieldViewModel)) { return new TableFieldViewModel(params); }

    var self = core.FieldBase.call(this, params), 
        settings = ko.unwrap(params.input.settings);

    self.rows = ko.observableArray([]);

    self.userResponse = ko.pureComputed(function() {
        return ko.utils.arrayMap(self.rows(), function(item) {
            var responseObj = {};
            ko.utils.arrayMap(item.members, function(m) {
                var context = m.context();
                responseObj[m.exportName] = context && context.userResponse();
            });
            return responseObj;
        });
    });

    self.addNewItem = ko.command({
        execute: function () {
            self.rows.push(constructItemContext());
        }
    });
    self.removeItem = ko.command({
        execute: function(item) {
            ko.utils.arrayRemoveItem(self.rows(), item);
            self.rows.notifySubscribers(self.rows());
        }
    });

    self.headings = ko.utils.arrayMap(settings.fields || [], function(f) {
        return {
            displayName: f.config.displayName,
            exportName: f.config.exportName,
        }
    });

    self.setValue = function (values) {
        var mapped = ko.utils.arrayMap(values || [], function(item) {
            return constructItemContext(item);
        });
        self.rows(mapped);
    }
  
    function constructItemContext(values) {
        return {
            members: self.constructFields(settings.fields, values)
        }
    }
    return self;
}

TableFieldViewModel.prototype.constructFields = function (fields, values) {
    return ko.utils.arrayMap(fields || [], function (f) {
        return new Field(f.config, values && values[f.config.exportName]);
    });
}

module.exports = {
  viewModel: TableFieldViewModel,
  name : "Table",
  template: require('./table-field.html')
};