// Form Submission Plug-in

function SaveToLocalDocumentStorePlugin() {
  if (!(this instanceof SaveToLocalDocumentStorePlugin)) return new SaveToLocalDocumentStorePlugin();

  var plugin = this;

  plugin.submit = function (values) {
    if (values == undefined) return $.Deferred().reject('Argument cannot be null');
    const document = this;

    plugin.isResolved = null;
    plugin.isExecuting = true;

    var entityName;
    try {
      entityName = ko.unwrap(document.dataSource);
      if (entityName && entityName.documentName) { entityName = entityName.documentName; }
      if (entityName == undefined) {
        throw new Error("Unable to find the documentName or documentName was undefined.");
      }
    } catch (e) {
      console.log("Error processing submit function of SaveToLocalDocuentStorePlugin.");
      console.log("Error: " + e.message);

      return $.Deferred()
        .done(failure)
        .reject(e.message);
    }

    var docId = ko.unwrap(values.documentId),
        isNew = docId == undefined,
        dfd = $.Deferred();

    $.ajax("/api/d/" + entityName + "/" + (isNew ? '' : docId), {
      data: ko.toJSON(values),
      dataType: 'json',
      contentType: 'application/json',
      method: isNew ? 'POST' : 'PUT'
    }).then(success)
    .fail(failure);

    return dfd;

    function success() {
      plugin.isResolved = true;
      plugin.isExecuting = false;
      dfd.resolve(arguments[0]);
    }
    function failure() {
      plugin.isResolved = false;
      plugin.isExecuting = false;
      dfd.reject.apply(null, arguments);
    }
  };
  plugin.submitCompleted = function (doucment) {
    return new Promise(function (fulfill, reject) {
      fulfill();
    });
  };

  return plugin;
}

module.exports = SaveToLocalDocumentStorePlugin();