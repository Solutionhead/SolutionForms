﻿function Field(input, value) {
    if (!(this instanceof Field)) { return new Field(input, value); }

    var self = this;

    $.extend(self, Field.prototype.DEFAULTS, input);

    self.context = ko.observable();
    self.validationElement = ko.pureComputed(function () {
        var context = self.context();
        //HACK: in order to prevent the validationElement and validationMessage bindings from throwing an error, return the unbound observable as a fallback.
        //Consider replacing this hack with a binding - vk 2015-06-19
        return context && ko.isObservable(context.userResponse)
          ? context.userResponse : ko.observable();
    });
    
    self.setValue = Field.prototype.setValue.bind(self);
    self.getValue = Field.prototype.getValue.bind(self);

    value != undefined && self.setValue(value);

    if (ko.isObservable(input.exports)) {
      input.exports({
        setValue: self.setValue,
        getValue: self.getValue
      })
    }

    return self;
}

Field.prototype.DEFAULTS = {
    displayName: null,
    exportName: null,
    helpText: null,
    inputType: null,
    settings: {},
    fieldType: 'fieldset'
}

Field.prototype.setValue = function (val) {
    var me = this;
    if (me.context.peek() == undefined) {
        var sub = me.context.subscribe(function(ctx) {
            setContextValue(ctx, val);
            sub.dispose();
            sub = null;
        });
    } else {
        setContextValue(me.context(), val);
    }

    function setContextValue(context, value) {
        if (typeof context.setValue === "function") {
            context.setValue(value);
        } else {
            context.userResponse(value);
        }
    }
}
Field.prototype.getValue = function () {
  var input = this;
  if (input.context.peek() == undefined) {
    var sub = input.context.subscribe(function (ctx) {
      return getContextValue(ctx);
      sub.dispose();
      sub = null;
    });
  } else {
    return getContextValue(input.context());
  }

  function getContextValue(context) {
    if (typeof context.getValue === "function") {
      return context.getValue();
    } else {
      return context.userResponse();
    }
  }
}

module.exports = Field;