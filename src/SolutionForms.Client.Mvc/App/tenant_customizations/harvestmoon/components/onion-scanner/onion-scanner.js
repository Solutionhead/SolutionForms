import 'bindings/ko.bindings.jq-autocomplete';
import toastr from 'toastr';
import core from 'App/core';

//if (!ko.components.isRegistered('dynamic-form')) {
//  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
//}

//if (!ko.components.isRegistered('form-field')) {
//  ko.components.register('form-field', require('components/form-field/form-field'));
//}

function OnionScanner(params) {
  if (!(this instanceof OnionScanner)) {
    return new OnionScanner(params);
  }

  var self = core.FieldBase.call(this, params);
  this.currentEntry = ko.observable(new ProductionEntry());
  
  //// lookup values
  //this.employeesCheckedIn = ko.observableArray([
  //  new Employee("5509", "Jose Valdez"),
  //  new Employee("5510", "Ricardo Hernandez"),
  //  new Employee("5511", "Estevan Estevez")
  //]);
    
  this.toteBarcodeDetected = function (result, resultsCollector) {
    var code = result.codeResult.code;
    if (workingOnTote || code === lastToteScanned) {
      return;
    }

    workingOnTote = true;

    var results = resultsCollector.getResults();
    var match = ko.utils.arrayFirst(results, (r) => {
      return r.codeResult.code === code;
    })

    if (match) {
      this.currentEntry().tote(new ToteRecord(code, match.frame));
      workingOnTote = false;
      this.stopAllScanners();
    }
  }
  this.initEmployeeScanner = function () {
    self.currentEntry().employee(null);
    var config = configOptions;
    config.inputStream.target = document.querySelector('#employee-scanner');
    quagga.init(config);
    quagga.addHandler('detected', self.employeeBarcodeDetected);
  }
  this.initToteScanner = function () {
    self.currentEntry().tote(null);
    var config = configOptions;
    config.inputStream.target = document.querySelector('#tote-scanner');
    quagga.init(config);
    var resultsCollector = quagga.buildResultsCollector({
      capture: true, // keep track of the image producing this result
      capacity: 20,  // maximum number of results to store
      filter: function (codeResult) {
        return true;
      }
    });
    quagga.addHandler('detected', (r) => { self.toteBarcodeDetected(r, resultsCollector); });
  }
  this.stopAllScanners = function () {
    quagga.stop();
  }
  this.changeEmployeeCommand = ko.command({
    execute: self.initEmployeeScanner
  })
  this.rescanToteCommand = ko.command({
    execute: self.initToteScanner
  })

  if (ko.isObservable(params.exports)) {
    params.exports({
      data: self.currentEntry,
      isValid: ko.computed(function () { return true; }),
      reset: function () {
        self.initToteScanner();
      }
    });
  }

  setTimeout(self.initEmployeeScanner, 0);
}

const configOptions = {
  locate: true,
  inputStream: {
    name: "Live",
    type: "LiveStream",
    target: document.querySelector('#scanner-container'),
    //size: 400,
    //area: {
    //  top: "10%",
    //  right: "10%",
    //  bottom: "30%",
    //  left: "10%"
    //},
    //constraints: {
    //  width: "330",
    //  height: "200"
    //}
  },
  decoder: {
    readers: ["code_39_reader"],
    debug: {
      drawBoundingBox: true,
      showFrequency: true,
      drawScanline: true,
      showPattern: true
    }
  },
  locator: {
    halfSample: true,
    patchSize: "medium"
  }
}

class ProductionEntry {
  constructor(employee) {
    this.employee = ko.observable(employee);
    this.tote = ko.observable();
  }

  reset = () => {
    this.employee(null);
    this.tote(null);
  }
}
class Employee {
  constructor(employeeId, name) {
    this.employeeId = employeeId;
    this.name = name;
  }
}
class ToteRecord {
  constructor(toteKey, imageData) {
    this.toteKey = toteKey;
    this.imageData = imageData;
  }
}

module.exports = {
  viewModel: OnionScanner,
  template: require('./onion-scanner.html'),
  name: 'Onion Producion Scanner',
  componentName: 'onion-scanner'
}