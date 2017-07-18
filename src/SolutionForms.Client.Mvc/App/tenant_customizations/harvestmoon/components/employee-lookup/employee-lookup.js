import 'bindings/ko.bindings.jq-autocomplete';
import quaggaPlugin from 'plugins/quaggaBarcodeScannerPlugin';
import toastr from 'toastr';
import formsService from 'services/dataFormsService';
import { getAllRecordsFromDataSourceAsync as fetch } from 'App/services/dataEntriesService';
import core from 'App/core';

if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

if (!ko.components.isRegistered('form-field')) {
  ko.components.register('form-field', require('components/form-field/form-field'));
}

const quagga = new quaggaPlugin();

function EmployeeLookup(params) {
  if (!(this instanceof EmployeeLookup)) {
    return new EmployeeLookup(params);
  }

  var self = core.FieldBase.call(this, params);

  this.lookupValue = self.userResponse;
  this.employees = ko.observableArray([]);

  //this.initEmployeeScanner = function () {
  //  self.currentEntry().employee(null);
  //  var config = configOptions;
  //  config.inputStream.target = document.querySelector('#employee-scanner');
  //  quagga.init(config);
  //  quagga.addHandler('detected', self.employeeBarcodeDetected);
  //}

  //setTimeout(self.initEmployeeScanner, 0);

  //const modes = {
  //  lookup: 'lookup',
  //  select: 'select'
  //};
  //var mode = ko.observable(modes.lookup);

  var isLookupMode = ko.observable(true);
  this.displayLookup = ko.pureComputed(function () {
    return isLookupMode();
  });
  this.displaySelectList = ko.pureComputed(function () {
    return !isLookupMode();
  });

  this.toggleModeCommand = ko.command({
    execute: function () {
      isLookupMode(!isLookupMode());
    }
  })

  this.ready = this.loadEmployees();

  return self;
}

EmployeeLookup.prototype.loadEmployees = function () {
  var employees = [];
  fetch('employees', { '$transformWith': 'Employees/Active' })
    .done((r) => {
      ko.utils.arrayPushAll(this.employees(), ko.utils.arrayMap(r, (d) => {
        return {
          name: d.LastName + ', ' + d.FirstName,
          id: d.Id
        }
      }));
      this.employees.notifySubscribers();
    })

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

module.exports = {
  viewModel: EmployeeLookup,
  template: require('./employee-lookup.html'),
  name: 'Employee Lookup',
  componentName: 'employee-lookup'
}