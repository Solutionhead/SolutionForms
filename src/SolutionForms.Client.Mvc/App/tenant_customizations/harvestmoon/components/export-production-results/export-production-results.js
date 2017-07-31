import 'bindings/datepicker';
import toastr from 'toastr';
import { getDataByIndexName as fetch } from 'App/services/dataEntriesService';
import core from 'App/core';
import moment from 'moment';

ko.filters.formattedDate = function (value) {
  return value.toLocaleDateString();
};

var today = moment().format('M/D/YYYY');

function ExportProductionResults(params) {
  if (!(this instanceof ExportProductionResults)) {
    return new ExportProductionResults(params);
  }

  var self = core.FieldBase.call(this, params);

  this.filters = {
    startDate: ko.observable(today).extend({ moment: 'M/D/YYYY' }),
    endDate: ko.observable(today).extend({ moment: 'M/D/YYYY'})
  };

  this.csvData = ko.observable();
  
  this.commands = {
    loadProductionResultsCommand: ko.asyncCommand({
      execute: self.loadProductionResults
    }),
    copyResultsToClipboardCommand: ko.command({
      execute: () => {
        var el = document.querySelector('#exporteDataText')
        el.select();

        try {
          if (document.execCommand('copy')) {
            toastr.success('The text has been copied to your clipboard. Now you can paste it into Excel.','Text Copied to Clipboard');
          }
        } catch (err) {
          toastr.error(`There was an error while attempting to copy content to the clipboard. Please try to manually copy the text. <blockquote>${err}</blockquote>`, 'Unable to copy content');
        }
      },
      canExecute: () => {
        return self.csvData() != null;
      }
    }),
    copyResultsWithoutHeaderToClipboardCommand: ko.command({
      execute: () => {
        var d = self.csvData();        
        //self.csvData(d.replace(/.*\n/, ''));
        self.csvData(d.substr(d.match(/.*\n/).index + 1));

        setTimeout(() => {
          var el = document.querySelector('#exportedDataText')
          el.select();

          try {
            if (document.execCommand('copy')) {
              toastr.success('The text has been copied to your clipboard. Now you can paste it into Excel.', 'Text Copied to Clipboard');
            }
          } catch (err) {
            toastr.error(`There was an error while attempting to copy content to the clipboard. Please try to manually copy the text. <blockquote>${err}</blockquote>`, 'Unable to copy content');
          }

          self.csvData(d);
        }, 0)
        
      },
      canExecute: () => {
        return self.csvData() != null;
      }
    })
  }
  
  return self;
}

ExportProductionResults.prototype.loadProductionResults = function (completedCallback) {
  var startDate = this.filters.startDate(),
    endDate = this.filters.endDate(),
    target = this.csvData;

  if (startDate) {
    startDate = moment(startDate, 'M/D/YYYY').format('YYYY-MM-DD')
  } else {
    startDate = '*'
  }

  if (endDate) {
    endDate = moment(endDate, 'M/D/YYYY').format('YYYY-MM-DD')
  } else {
    endDate = '*'
  }

  return fetch('ProductionResults%2FbyEnterpriseCode', {
    '$transformWith': 'ProductionResults%2FPayroll',
    '$filter': `(ProductionDate: [${startDate} TO ${endDate}])`,
    cache: false,
    accepts: {
      csv: 'application/csv'
    },
    dataType: 'csv',
    converters: {
      'text csv': function (result) {
        return result;
      }
    }
  })
    .done((r) => {
      target(r);
    })
    .error((test1, test2, test3) => {
      console.log('error');
      console.log(arguments);
    })
    .always(completedCallback);
}

module.exports = {
  viewModel: ExportProductionResults,
  template: require('./export-production-results.html'),
  name: 'Export Production Results',
  componentName: 'export-production-results'
}