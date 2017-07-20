import core from 'App/core';
import toastr from 'toastr';
import { parseCode } from '../../utils/employeeTicketCodeParser';
import * as userMessages from '../../resources/userMessages'
import moment from 'moment';

if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

ko.filters.longDate = function (val) {
  return moment(val).format('dddd, MMMM DD, YYYY')
}

function ProductionController(params) {
  if (!(this instanceof ProductionController)) {
    return new ProductionController(params);
  }

  var self = core.FieldBase.call(this, params);

  var ticketScannerVm = ko.observable(),
    toteScannerVm = ko.observable(),
    employeeTickets = [],
    ticketCache = {};

  var enterpriseCodeComplete = ko.pureComputed(function () {
    var vm = self.enterpriseVm();
    if (!vm || !vm.isReady()) return false;

    return vm.isReady()
      && vm.getFieldValue('ProductionDate')
      && vm.getFieldValue('Field')
      && vm.getFieldValue('Mode')
      && true;
  });

  this.enterpriseVm = ko.observable();
  this.productionEntries = ko.observableArray([]);
  this.config = {
    ticketScannerConfig: {
      inputType: 'barcode-scanner',
      config: {
        "FieldContainerType": "container",
        "captureResultImages": false,
        "onBarcodeDetected": employeeTicketBarcodeDetected,
        "scannerConfig": {
          name: "Ticket Scanner"
        }
      },
      exports: ticketScannerVm
    },
    toteScannerConfig: {
      inputType: 'barcode-scanner',
      config: {
        "FieldContainerType": "container",
        "captureResultImages": true,
        "onBarcodeDetected": toteBarcodeDetected,
        "scannerConfig": {
          name: "Tote Scanner"
        }
      },
      exports: toteScannerVm
    }
  }


  this.viewState = {
    showEnterpriseUI: ko.observable(true),
    showEmployeeTicketScannerStep: ko.pureComputed(() => {
      return !self.viewState.showEnterpriseUI() && self.model.workTicket() == null;
    }),
    showToteStep: ko.pureComputed(() => {
      return !self.viewState.showEnterpriseUI() &&
        !self.viewState.showEmployeeTicketScannerStep();
    })
  }

  this.model = {
    enterprise: ko.computed(function () {
      var vm = self.enterpriseVm();
      if (!vm || !vm.isReady()) return null;

      var field = vm.getFieldValue('Field') || { Farm: {} };
      var mode = vm.getFieldValue('Mode') || {};

      var d = vm.getFieldValue('ProductionDate');
      var pDate = d ? moment(d).format('YYYY-MM-DD') : '';

      return {
        fieldCode: field.FieldCode || '',
        productionDate: pDate,
        activity: mode.Activity || '',
        farmName: field.Farm['Farm Name'] || '',
        field: field
      }
    }),
    employee: ko.observable(),
    ticketNumber: ko.observable(),
    workTicket: ko.observable(),
    toteNumber: ko.observable(),
    toteScanImageData: ko.observable(),
    field: ko.observable()
  };

  this.commands = {
    acceptEnterpriseCodeCommand: ko.command({
      execute: function () {
        var e = self.model.enterprise();
        loadWorkTicketsAsync(e.fieldCode, moment(e.productionDate, moment.ISO_8601).format("YYYY-MM-DD"))
          .then(() => {
            if (!employeeTickets || !employeeTickets.length) {
              toastr.error('No employees are checked in at this location. Employees must be assigned tickets before their work can be recorded.', 'No Tickets Found')
            }
          });
        ticketScannerVm().startScanner();
        self.viewState.showEnterpriseUI(false);
      },
      canExecute: function () {
        return enterpriseCodeComplete();
      }
    }),
    changeEnterpriseCodeCommand: ko.command({
      execute: function () {
        self.viewState.showEnterpriseUI(true);
      },
      canExecute: function () {
        return !self.viewState.showEnterpriseUI();
      }
    }),
    rescanTicketCommand: ko.command({
      execute: function () {
        resetForTicketScan(true);
      }
    }),
    rescanToteCommand: ko.command({
      execute: function () {
        resetForToteScan(true);
      }
    }),
    saveProductionEntryCommand: ko.asyncCommand({
      execute: function (complete) {
        var data = ko.toJS(self.model.enterprise());
        data.employee = self.model.employee();
        data.ticket = self.model.workTicket();
        data.toteNumber = self.model.toteNumber();
        data.toteScanImageData = self.model.toteScanImageData();
        
        return $.ajax("/api/d/productionResults", {
          data: ko.toJSON(data),
          dataType: 'json',
          contentType: 'application/json',
          method: 'POST'
        }).done((response) => {
          toastr.success(`Employee: <strong>${data.employee.name}</strong>, Tote: <strong>${data.toteNumber}</strong>`, 'Saved Successfully', { timeOut: 5000 });
          resetForTicketScan(true);
        }).fail(() => {
          console.log(arguments);
          toastr.fail(`An error occurred when attempting to save.`, 'Save failed');
        }).always(() => {
          complete();
        });
      },
      canExecute: function (isExecuting) {
        return !isExecuting &&
          enterpriseCodeComplete() &&
          self.model.employee() != null &&
          self.model.workTicket() != null &&
          self.model.toteNumber() != null;
      }
    })
  }

  function resetForTicketScan(startScanner) {
    resetForToteScan(false);
    self.model.employee(null);
    self.model.workTicket(null);
    self.model.ticketNumber(null);
    startScanner === true && ticketScannerVm().startScanner();
  }
  function resetForToteScan(startScanner) {
    self.model.toteNumber(null);
    self.model.toteScanImageData(null);
    startScanner === true && toteScannerVm().startScanner();
  }
  function employeeTicketBarcodeDetected(scannedValue) { 
    if (!scannedValue) { return; }
    try {
      var scannedTicket = parseCode(scannedValue);
      if (scannedTicket == null) {
        throw new Error('Unable to parse scanned ticket.');
      }
    } catch (ex) {
      toastr.warning(`The value <strong>${scannedValue}</strong> was not recognized as a valid ticket code.`, 'Invalid Barcode Scanned');
      return;
    }

    var e = ko.toJS(self.model.enterprise);

    // ticket is registered for field/date
    var verifiedTicket = ticketCache[scannedTicket.ticketNum];
    if (verifiedTicket == null) {
      toastr.error(userMessages.ticketNotRegisteredMessage(scannedTicket.ticketNum), userMessages.ticketNotRegisteredTitle);
      return;
    }

    // ticket matches verified ticket field
    if (verifiedTicket.fieldCode != scannedTicket.fieldCode) {
      toastr.error(
        userMessages.ticketNotRegisteredToFieldMessage(scannedTicket.ticketNum, verifiedTicket.fieldCode, scannedTicket.fieldCode),
        userMessages.ticketNotRegisteredToFieldTitle);
      return;
    }

    // ticket matches verified ticket date
    var mProdDate = moment(scannedTicket.productionDate);
    if (!moment(verifiedTicket.productionDate).isSame(mProdDate, 'day')) {
      toastr.error(
        userMessages.ticketNotRegisteredToDateMessage(scannedTicket.ticketNum, verifiedTicket.productionDate, scannedTicket.productionDate),
        userMessages.ticketNotRegisteredToDateTitle);
      return;
    }
    
    self.model.ticketNumber(scannedTicket.ticketNum); //todo: remove this variable
    scannedTicket.productionDate = mProdDate.format('YYYY-MM-DD');
    self.model.workTicket(scannedTicket);
    self.model.employee(verifiedTicket.employee);
    
    ticketScannerVm().stopScanner();
    toteScannerVm().startScanner();
  }

  var workingOnTote = false;
  var lastToteScanned;
  function toteBarcodeDetected(code, resultsCollector) {
    if (!code || workingOnTote || code === lastToteScanned) {
      return;
    }

    self.model.toteNumber(code);
    lastToteScanned = code;

    if (resultsCollector) {
      workingOnTote = true;
      var results = resultsCollector.getResults();
      var match = ko.utils.arrayFirst(results, (r) => {
        return r.codeResult.code === code;
      })

      if (match) {
        self.model.toteScanImageData(match.frame);
      }
    } else {
      self.model.toteScanImageData(null);
    }

    workingOnTote = false;
    toteScannerVm().stopScanner();
  }

  return self;
  
  function loadWorkTicketsAsync(fieldCode, productionDate) {
    var queryString = `$filter=(fieldCode:"${fieldCode}" AND productionDate:[[${productionDate}]])`
    return $.ajax({
      url: `/api/d/index?${encodeURI(`id=EmployeeTickets%2FbyDateAndField&${queryString}`)}`,
      dataType: 'json',
      cache: false
    }).then((d) => {
      var mapped = ko.utils.arrayMap(d || [], (t) => {
        var m = {
          fieldCode: t.fieldCode, //todo: get field object
          employee: t.employee,
          productionDate: moment(t.productionDate, 'YYYY-MM-DD'),
          ticketNumber: t.ticketNumber
        };
        ticketCache[t.ticketNumber] = m;
        return m;
      });
      employeeTickets = mapped;
    });
  }
}

module.exports = {
  viewModel: ProductionController,
  template: require('./production-controller.html'),
  name: 'Production Controller',
  componentName: 'production-controller'
}