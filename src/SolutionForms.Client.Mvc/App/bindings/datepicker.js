require('jquery-ui/datepicker');
var moment = require('moment');
require('koExtenders/knockout.extenders.moment');

ko.bindingHandlers.datepicker = {
  /*
  valueAccessor: true | string (format) | object (config) 
  */
    init: function(element, valueAccessor, allBindingsAccessor) {
      var $el = $(element),
        bindings = allBindingsAccessor && allBindingsAccessor() || {},
        valueTarget = bindings.value,
        options = $.extend({}, ko.bindingHandlers.datepicker.DEFAULT_OPTIONS, ko.unwrap(valueAccessor()) || {});

        if (ko.isObservable(valueTarget)) {
          valueTarget = valueTarget.extend({ moment: options.displayFormat });
        }

        options.onSelect = selectDateHandler;
        ko.utils.registerEventHandler(element, "change", selectDateHandler);

        $el.wrap('<div class="input-group"></div>');
        $el.datepicker(options).next(".ui-datepicker-trigger")
            .addClass("btn btn-default")
            .wrap('<span class="input-group-btn"></span>');
      
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $el.unwrap();
            $el.datepicker('destroy');
        });

        function selectDateHandler() {
          ko.isWriteableObservable(valueTarget) && valueTarget($(element).val());
        }
    },
    DEFAULT_OPTIONS: {
        showOn: 'button',
        buttonText: '<i class="fa fa-calendar"></i>',
        changeMonth: true,
        changeYear: true,
        displayFormat: 'M/D/YYYY'
    }
}