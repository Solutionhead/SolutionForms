import core from 'App/core';
import toastr from 'toastr';
import { parseCode } from '../../utils/employeeTicketCodeParser';
import * as userMessages from '../../resources/userMessages'
import moment from 'moment';
import 'App/bindings/ko.bindings.bs-modal';
import * as service from 'App/services/dataEntriesService';

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
  self.versionNumber = "1.0.0.4";

  var ticketScannerVm = ko.observable(),
    toteScannerVm = ko.observable(),
    bypassToteScanner = ko.observable(false),
    ready = ko.observable(false),
    employeeTickets = [],
    scannedTickets = {},
    scannedTotes = {},
    registeredTicketCache = {};
  
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
  this.preserveEmployee = ko.observable(false);

  this.config = {
    ticketScannerConfig: {
      inputType: 'barcode-scanner',
      config: {
        "FieldContainerType": "container",
        "captureResultImages": false,
        "onBarcodeDetected": employeeTicketBarcodeDetected,
        "scannerConfig": {
          locator: {
            halfSample: true,
            patchSize: "medium"
          },
          inputStream: {
            name: "Ticket Scanner",
            size: 800
          },
          decoder: {
            readers: ['code_39_reader']
          }
        }
      },
      exports: ticketScannerVm
    },
    ticketScannerConfig2: {
      value: ko.observable()
    },
    toteScannerConfig: {
      inputType: 'barcode-scanner',
      config: {
        "FieldContainerType": "container",
        "captureResultImages": true,
        "onBarcodeDetected": toteBarcodeImageDetected,
        "scannerConfig": {
          locator: {
            halfSample: true,
            patchSize: "medium"
          },
          inputStream: {
            name: "Tote Scanner",
            size: 800
          },
          decoder: {
            readers: ['code_39_reader']
          }
        }
      },
      exports: toteScannerVm
    },
    employeeLookupConfig: {
      label: 'Employee',
      inputType: 'employee-lookup',
      exports: ko.observable(),
      fieldContext: ko.observable(),
    },
  }
  
  self.enterpriseVm.subscribe(function (vm) {
    if (vm && vm.setFieldValues) {
      var cachedValue = localStorage.getItem('enterpriseData') || '{}';
      var initialValues = JSON.parse(cachedValue);
      if (initialValues.ProductionDate == null || !moment(initialValues.cacheDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
        initialValues.ProductionDate = moment().format('YYYY-MM-DD');
      } else {

      }
      vm.setFieldValues(initialValues);
    }
  });

  var ticketScannerValue = ko.pureComputed(self.config.ticketScannerConfig2.value)
    .extend({ rateLimit: { timeout: 800, method: 'notifyWhenChangesStop' } });

  ticketScannerValue.subscribe((val) => {
    setTimeout(() => {
      employeeTicketBarcodeDetected(val);
    }, 0);
  });

  this.viewState = {
    mode: ko.observable(),
    useQuaggaScanner: ko.pureComputed(() => {
      var useQuagga = self.viewState.mode() === 'camera';
      return useQuagga;
    }),
    focusTicketScanner: ko.observable(),
    focusToteScanner: ko.observable(),
    showEnterpriseUI: ko.observable(true),
    showEmployeeTicketScannerStep: ko.pureComputed(() => {
      return !self.viewState.showEnterpriseUI() &&
        (self.model.employee() == null ||
        self.model.workTicket() == null);
    }),
    showToteStep: ko.pureComputed(() => {
      return !self.viewState.showEnterpriseUI() &&
        !self.viewState.showEmployeeTicketScannerStep();
    }),
    displayToteScanner: ko.pureComputed(() => {
      return self.viewState.showToteStep() && !self.model.toteNumber() && !bypassToteScanner();
    }),
    displayToteEntry: ko.pureComputed(() => {
      var toteStep = self.viewState.showToteStep() && !self.model.toteNumber() && bypassToteScanner();
      if (toteStep && !self.viewState.useQuaggaScanner()) {
        setTimeout(() => { self.viewState.focusToteScanner(true); }, 0)
      }
      return toteStep;
    }),
    displayToteAcknowledgement: ko.pureComputed(() => {
      return self.model.toteNumber() != null;
    }).extend({ rateLimit: { timeout: 800, method: 'notifyWhenChangesStop' } }),
    displayError: ko.observable(new validationError()),
  }

  this.viewState.useQuaggaScanner.subscribe(function (useQuagga) {
    if (useQuagga) {
      if (self.viewState.showEmployeeTicketScannerStep()) {
        startTicketScanner();
      } else if (self.viewState.showToteStep()) {
        startToteScanner();
      }
    } else {
      bypassToteScanner(true);
    }
  });
  this.viewState.useQuaggaScanner.notifySubscribers();
  
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
        mode: mode,
        activity: mode.Activity || '',
        farmName: field.Farm['FarmName'] || '',
        field: field
      }
    }),
    employee: ko.observable(),
    ticketNumber: ko.observable(),
    workTicket: ko.observable(),
    toteNumber: ko.observable().extend({ rateLimit: { timeout: 800, method: 'notifyWhenChangesStop' } }),
    toteScanImageData: ko.observable(),
    field: ko.observable()
  };

  this.commands = {
    acceptEnterpriseCodeCommand: ko.command({
      execute: function () {
        var e = self.model.enterprise();
        var prodDate = moment(e.productionDate, moment.ISO_8601).format("YYYY-MM-DD");
        ready(false);
        $.when([
          loadWorkTicketsAsync(e.fieldCode, prodDate),
          loadProductionResultsAsync(e.fieldCode, prodDate)])
          .then(() => { ready(true); });
        startTicketScanner();
        self.viewState.showEnterpriseUI(false);
        localStorage.setItem('enterpriseData', ko.toJSON({
          Field: e.field,
          ProductionDate: prodDate,
          Mode: e.mode,
          cacheDate: moment().format('YYYY-MM-DD')
        }))
      },
      canExecute: function () {
        return enterpriseCodeComplete();
      }
    }),
    changeEnterpriseCodeCommand: ko.command({
      execute: function () {
        self.viewState.showEnterpriseUI(true);
        ready(false);
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

        if (!validate(data)) {
          complete();
          return $.Deferred().reject();
        }
        
        return $.ajax("/api/d/productionResults", {
          data: ko.toJSON(data),
          dataType: 'json',
          contentType: 'application/json',
          method: 'POST'
        }).done((response) => {
          toastr.success(`Employee: <strong>${data.employee.name}</strong>, Tote: <strong>${data.toteNumber}</strong>`, 'Saved Successfully', { timeOut: 5000 });
          scannedTickets[data.ticket.ticketNum] = true;
          scannedTotes[data.toteNumber] = true;
          var preserveEmployee = self.preserveEmployee();
          resetForTicketScan(true);
          if (preserveEmployee) {
            self.model.employee(data.employee);
          }
        }).fail(() => {
          toastr.fail(`An error occurred when attempting to save.`, 'Save failed');
        }).always(() => {
          complete();
        });
      },
      canExecute: function (isExecuting) {
        return ready() == true &&
          !isExecuting &&
          enterpriseCodeComplete() &&
          self.model.employee() != null &&
          self.model.workTicket() != null &&
          self.model.toteNumber() != null;
      }
    }),
    toggleToteScanner: ko.command({
      execute: function () {
        bypassToteScanner(!bypassToteScanner()); 
      }
    })
  }

  function validate(data) {
    // has ticket already been scanned?
    var completedTicket = scannedTickets[data.ticket.ticketNum];
    if (completedTicket != null) {
      if (completedTicket.employee.id === data.employee.id && 
        completedTicket.toteNumber === data.toteNumber) {
        showError(
          userMessages.ticketAlreadyProcessedWarningTitle,
          userMessages.ticketAlreadyProcessedWarningMessage(data.ticket.ticketNum),
          'warning')
      } else {
        showError(
          userMessages.ticketAlreadyProcessedCriticalTitle,
          userMessages.ticketAlreadyProcessedCriticalMessage(data.ticket.ticketNum, completedTicket.employee.name, completedTicket.toteNumber),
          'critical');
        recordDuplicateAttempt(data, completedTicket);
      }
      return false;
    }

    // has tote already been scanned?
    var completedTote = scannedTotes[data.toteNumber];
    if (completedTote != null) {
      if (completedTote.employee.id === data.employee.id &&
        completedTote.toteNumber === data.toteNumber) {
        showError(
          userMessages.toteAlreadyScannedWarningTitle,
          userMessages.toteAlreadyScannedWarningMessage(data.toteNumber),
          'warning'
        );
      } else {
          showError(
            userMessages.toteAlreadyScannedCriticalTitle,
            userMessages.toteAlreadyScannedCriticalMessage(data.toteNumber, completedTote.employee.name, completedTote.ticket.ticketNum),
            'critical'
          );
          recordDuplicateAttempt(data, completedTote);
      }
      return false;
    }

    return true;
  }
  function showError(title, body, level) {
    self.viewState.displayError(new validationError(
      title || 'Validation error occurred',
      body,
      level || 'info'))
  }
  function recordDuplicateAttempt(duplicate, original) {
    return service.createAsync('DuplicatePaymentAttempts', {
      duplicate: {
        toteNumber: duplicate.toteNumber,
        employee: duplicate.employee,
        ticket: duplicate.ticket
      },
      original: {
        toteNumber: original.toteNumber,
        employee: original.employee,
        ticket: original.ticket
      }
    })
  }
  function clearError() {
    self.viewState.displayError(new validationError());
  }
  function startTicketScanner() {
    self.viewState.useQuaggaScanner() ?
      ticketScannerVm().startScanner() :
      setTimeout(() => self.viewState.focusTicketScanner(true), 0);
  }
  function stopTicketScanner() {
    self.viewState.useQuaggaScanner() && ticketScannerVm().stopScanner();
  }
  function startToteScanner() {
    self.viewState.useQuaggaScanner() ?
      toteScannerVm().startScanner() :
      setTimeout(() => self.viewState.focusToteScanner(true), 0);
  }
  function stopToteScanner() {
    toteScannerVm() && toteScannerVm().stopScanner();
  }
  function resetForTicketScan(startScanner) {
    resetForToteScan(false);
    self.model.employee(null);
    self.model.workTicket(null);
    self.model.ticketNumber(null);
    //self.config.employeeLookupConfig.fieldContext().setValue(null)
    self.config.ticketScannerConfig2.value(null);
    startScanner === true && startTicketScanner();
  }
  function resetForToteScan(startScanner) {
    self.model.toteNumber(null);
    self.model.toteScanImageData(null);
    clearError();
    startScanner === true && startToteScanner();
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
      resetForTicketScan(true);
      return;
    }
    
    var enterprise = ko.toJS(self.model.enterprise);
    
    // ticket matches field on enterprise 
    if (enterprise.fieldCode != scannedTicket.fieldCode) {
      toastr.error(
        userMessages.ticketNotRegisteredToFieldMessage(scannedTicket.ticketNum, enterprise.fieldCode, scannedTicket.fieldCode),
        userMessages.ticketNotRegisteredToFieldTitle);
      resetForTicketScan(true);
      return;
    }

    // ticket matches field on enterprise
    var mProdDateEnterprise = moment(enterprise.productionDate);
    var mProdDate = moment(scannedTicket.productionDate);
    var employee_sub;

    if (!mProdDateEnterprise.isSame(mProdDate, 'day')) {
      toastr.error(
        userMessages.ticketNotRegisteredToDateMessage(
          scannedTicket.ticketNum,
          mProdDateEnterprise.format('YYYY-MM-DD'),
          mProdDate.format('YYYY-MM-DD')),
        userMessages.ticketNotRegisteredToDateTitle);
      resetForTicketScan(true);
      return;
    }
    scannedTicket.productionDate = mProdDate.format('YYYY-MM-DD');

    stopTicketScanner();

    var registeredTicket = registeredTicketCache[scannedTicket.ticketNum];
    if (registeredTicket == null) {
      // ticket has not been registered, select employee
      employee_sub = self.config.employeeLookupConfig.exports().userResponse.subscribe((v) => {
        if (v == null) { return; }

        self.model.employee(v);
        startToteScanner();
        employee_sub.dispose();
        //todo: handle cleanup of this subscription when a new ticket is scanned
      });
    } else {
      // ticket has been registered
      self.model.employee(registeredTicket.employee);
      startToteScanner();
    }
    
    self.model.ticketNumber(scannedTicket.ticketNum);
    self.model.workTicket(scannedTicket);
    return true;
  }

  var workingOnTote = false;
  var lastToteScanned;
  function toteBarcodeImageDetected(code, resultsCollector) {
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
    stopToteScanner();
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
        registeredTicketCache[t.ticketNumber] = m;
        return m;
      });
      employeeTickets = mapped;
    });
  }
  function loadProductionResultsAsync(fieldCode, productionDate) {
    var queryString = `$filter=(fieldCode:"${fieldCode}" AND productionDate:[[${productionDate}]])`
    return $.ajax({
      url: `/api/d/index?${encodeURI(`id=ProductionResults%2FbyDateAndField&${queryString}`)}`,
      dataType: 'json',
      cache: false
    }).then((d) => {
      ko.utils.arrayForEach(d || [], (t) => {
        scannedTickets[t.ticket.ticketNum] = t;
        scannedTotes[t.toteNumber] = t;
      });;
    });
  }
}

module.exports = {
  viewModel: ProductionController,
  template: require('./production-controller.html'),
  name: 'Production Controller',
  componentName: 'production-controller'
}

function validationError(title, body, level) {
  return {
    title: title,
    bodyMessage: body,
    level: level
  }
}