import core from 'App/core';

function NumericField(params) {
  if (!(this instanceof NumericField)) {
    return new NumericField(params);
  }

  var self = core.FieldBase.call(this, params);

  var userResponse = self.userResponse;
  self.userResponse = ko.pureComputed({
    read: function () {
      return userResponse();
    },
    write: function (val) {
      var n = Number(val) || 0;
      userResponse(n);
    }
  });

  return self;
}
module.exports = {
  name: 'Number',
  viewModel: NumericField
};