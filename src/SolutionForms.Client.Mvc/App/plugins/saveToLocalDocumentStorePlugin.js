// Form Submission Plug-in

function SaveToLocalDocumentStorePlugin() {
    if (!(this instanceof SaveToLocalDocumentStorePlugin)) return new SaveToLocalDocumentStorePlugin();

    var plugin = this;
    
    plugin.submit = function (document) {
        plugin.isResolved = null;
        plugin.isExecuting = true;

            var data, entityName;
            try {
                if (document.dataSource == undefined || document.dataSource.documentName == undefined) {
                    throw new Error("Invalid arguments: Missing or invalid entityName member.");
                }

                data = plugin.parseForm(document);
                entityName = document.dataSource.documentName;
            } catch (e) {
                console.log("Error processing submit function of SaveToLocalDocuentStorePlugin.");
                console.log("Error: " + e.message);
                failure();
                return;
            }

            var isNew = document.documentId == undefined;
            return $.ajax("/api/d/" + entityName + "/" + (isNew ? '' : document.documentId), {
                data: ko.toJSON(data),
                dataType: 'json',
                contentType: 'application/json',
                method: isNew ? 'POST' : 'PUT'
            }).then(success)
            .fail(failure);
            
            function success() {
                plugin.isResolved = true;
                plugin.isExecuting = false;
            }
            function failure() {
                plugin.isResolved = false;
                plugin.isExecuting = false;
            }
    };
    plugin.submitCompleted = function(doucment) {
        return new Promise(function(fulfill, reject) {
            //alert(plugin.isResolved ? 'Submit succeeded!' : 'Submit failed');
            fulfill();
        });
    };

    return plugin;
}

SaveToLocalDocumentStorePlugin.prototype.parseForm = function (form) {
    var output = {
        documentId: form.documentId
    };

    ko.utils.arrayMap(ko.unwrap(form.fields), function (field) {
        output[field.exportName] = field.context().userResponse();
    });
    return output;
}

module.exports = SaveToLocalDocumentStorePlugin;