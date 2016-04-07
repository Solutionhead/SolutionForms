module.exports = {
  getDataFormByIdAsync: function(formId) {
    return $.getJSON('/api/dataforms/' + formId);
  }
}