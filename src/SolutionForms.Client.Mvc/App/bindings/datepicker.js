require('jquery-ui/datepicker');
var moment = require('moment');

ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var $el = $(element),
        valueTarget = valueAccessor(),
        bindings = allBindingsAccessor && allBindingsAccessor() || { datepickerOptions: {} },
        options = $.extend({}, ko.bindingHandlers.datepicker.DEFAULT_OPTIONS, bindings.datepickerOptions);

      var selectDateHandler = function (newValue) {
        valueTarget(newValue);
      }

        options.onSelect = selectDateHandler;
        //handle the field changing by registering datepicker's changeDate event
        ko.utils.registerEventHandler(element, "change", selectDateHandler);

        $el.wrap('<div class="input-group"></div>');
        $el.datepicker(options).next(".ui-datepicker-trigger")
            .addClass("btn btn-default")
            .wrap('<span class="input-group-btn"></span>');

        if (ko.isObservable(valueTarget)) {
          ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
          ko.bindingHandlers.validationCore && ko.bindingHandlers.validationCore.init(element, valueAccessor, allBindingsAccessor);
        }
      
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $el.unwrap();
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