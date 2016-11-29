var DesignerField = require('viewModels/dataformFieldConfigViewModel');

function FieldContext(values) {
    if (!(this instanceof FieldContext)) { return new FieldContext(values); }

    this.config = ko.observable(new DesignerField(values));
    this.isActive = ko.observable(isEmpty(values));

    return this;
}

function isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;

    //ECMAScript 5 supported browsers
    if (typeof Object.getOwnPropertyNames == "function") {
        return !Object.getOwnPropertyNames(obj).length > 0;
    }
    
    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;

}

module.exports = FieldContext;