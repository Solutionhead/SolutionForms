// warning: $ and bootstrap are expected to be in the global scope

(function (factory) {
    // Support three module loading scenarios
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['knockout', 'require'], factory);
    } else if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [2] CommonJS/Node.js
        factory(require('knockout') || exports); // module.exports is for Node.js
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko']);
    }
}(function factory(ko) {
    ko.bindingHandlers.collapse = {
        init: function(element, valueAccessor) {
        	var $element = $(element);
            var value = ko.unwrap(valueAccessor());
            var targetSelector = $element.attr('href');

            var $context;
            if (value.scopeTo) {
				if (value.scopeTo === 'parent') {
				    $context = $element.parent();
				} else {
				    $context = $(value.scopeTo);
				}
			} else {
			    $context = window;
			}

            $element.on('click', function() {
                $context.find(targetSelector).collapse('toggle');
                return false;
            });
        }
    }

	ko.bindingHandlers.collapse.DEFAULTS = {
	    
	}
}));