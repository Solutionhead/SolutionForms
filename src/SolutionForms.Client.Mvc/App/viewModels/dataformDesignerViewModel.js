ko.components.register('dataform-form-designer', require('components/dataform-form-designer/dataform-form-designer'));
ko.components.register('dataform-form-live', require('components/dataform-form-live/dataform-form-live'));

var page = require('page');

(function() {
    var vm = {
        config: ko.observable()
    };
    
    page('/Forms/:id/Designer', loadForm);
    page();

    ko.applyBindings(vm);

    function loadForm(opts) {
        $.ajax('/api/dataforms/' + opts.params.id)
            .then(function (data) {
                vm.config(data);
            });
    }
}());
