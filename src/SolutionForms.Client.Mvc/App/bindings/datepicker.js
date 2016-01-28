require('jquery-ui/datepicker');
var moment = require('momentjs');

ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var $el = $(element),
            options = $.extend({}, ko.bindingHandlers.datepicker.DEFAULT_OPTIONS, allBindingsAccessor().datepickerOptions || {});

        var selectDateHandler = function() {
            var observable = valueAccessor();

            // support for ko.validation
            if (typeof observable.isValid === "function") {
                if (observable.isValid()) {
                    observable(ko.bindingHandlers.datepicker.getFormattedDateValue($el.datepicker("getDate")));
                    $el.blur();
                }
            } else {
                observable(ko.bindingHandlers.datepicker.getFormattedDateValue($el.datepicker("getDate")));
            }
        }
        options.onSelect = selectDateHandler;

        $el.wrap('<div class="input-group"></div>');
        $el.datepicker(options).next(".ui-datepicker-trigger")
            .addClass("btn btn-default")
            .wrap('<span class="input-group-btn"></span>');

        //handle the field changing by registering datepicker's changeDate event
        ko.utils.registerEventHandler(element, "change", selectDateHandler);

        ko.bindingHandlers.validationCore && ko.bindingHandlers.validationCore.init(element, valueAccessor, allBindingsAccessor);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            //todo: cleanup wrapper element
            $el.datepicker('destroy');
        });
    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            $el = $(element);

        if (value && value instanceof Date) {

        } else {
            var sDate = String(value);

            //handle date data coming via json from Microsoft
            value = sDate.indexOf('/Date(') == 0
                ? new Date(parseInt(sDate.replace(/\/Date\((.*?)\)\//gi, "$1")))
                : value && new Date(value);
        }

        var current = $el.datepicker("getDate");

        if (value - current !== 0) {
            $el.datepicker("setDate", value);
        }
    },
    getFormattedDateValue: function(dateValue) {
        return moment(dateValue).format('YYYY-MM-DD');
    },
    DEFAULT_OPTIONS: {
        showOn: 'button',
        buttonText: '<i class="fa fa-calendar"></i>',
        changeMonth: true,
        changeYear: true
    }
}