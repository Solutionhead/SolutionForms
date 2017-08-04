ko.punches.textFilter.enableForBinding('text');
var fetchPlugin = require('plugins/getDataFromLocalStorePlugin'),
  page = require('page');

function DataEntryTable(params) {
  if (!(this instanceof DataEntryTable)) return new DataEntryTable(params);

  var self = this;

  self.formId = ko.observable();
  self.formFields = ko.observableArray([]);
  self.records = ko.observableArray([]);

  const indexedKeys = ko.pureComputed(() => {
    var i = 0, dictionary = {};
    ko.utils.arrayMap(self.records(), (r) => {
      dictionary[r.Id] = i++;
    });

    return dictionary;
  });

  self.parseConfig(params.config);

  self.navigateToDetails = function (item) {
    if (typeof params.onItemSelected === "function") {
      params.onItemSelected(item);
    }
  };

  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      records: self.records,
      getIndexForKey: getIndexForKey,
      updateItemByKey: updateItemByKey,
      insertItemAtIndex: self.insertItemAtIndex.bind(self)
    });
  }

  return self;

  function getIndexForKey(key) {
    return indexedKeys()[key] || -1;
  }
  function updateItemByKey(key, values) {
    const index = getIndexForKey(key);
    this.records.splice(index, 1, values);
  }
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

DataEntryTable.prototype.insertItemAtIndex = function (index, values) {
  this.records.splice(index, 0, values);
}

module.exports = {
  template: require('./dataentry-table-view.html'),
  viewModel: DataEntryTable
}