import 'local/jquery.payment';
ko.bindingHandlers.ccNum = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (ko.unwrap(valueAccessor()) === true) {
            $(element).payment('formatCardNumber');
        }
    }
};

ko.bindingHandlers.ccExp = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (ko.unwrap(valueAccessor()) === true) {
            $(element).payment('formatCardExpiry');
        }
    }
};

ko.bindingHandlers.ccCvc = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (ko.unwrap(valueAccessor()) === true) {
            $(element).payment('formatCardCVC');
        }
    }
};

ko.bindingHandlers.numeric = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (ko.unwrap(valueAccessor()) === true) {
            $(element).payment('restrictNumeric');
        }
    }
};