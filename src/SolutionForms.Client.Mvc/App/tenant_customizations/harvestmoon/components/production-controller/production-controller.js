import core from 'App/core';
import toastr from 'toastr';

if (!ko.components.isRegistered('dynamic-form')) {
  ko.components.register('dynamic-form', require('components/dynamic-form-ui/dynamic-form-ui'));
}

//if (!ko.components.isRegistered('form-field')) {
//  ko.components.register('form-field', require('components/form-field/form-field'));
//}

function ProductionController(params) {
  if (!(this instanceof ProductionController)) {
    return new ProductionController(params);
  }

  var self = this;
  this.enterpriseVm = ko.observable();
  this.scannerVm = ko.observable();

  this.showEnterprise = ko.observable(true);
  this.productionEntries = ko.observableArray([]);
    
  this.enterpriseCodeComplete = ko.pureComputed(function () {
    var vm = self.enterpriseVm();
    if (!vm || !vm.isReady()) return false;

    return vm.isReady()
      && vm.getFieldValue('ProductionDate')
      && vm.getFieldValue('Field')
      && vm.getFieldValue('Mode')
      && true;
  })

  this.enterprise = ko.computed(function () {
    var vm = self.enterpriseVm();
    if (!vm || !vm.isReady()) return null;

    var field = vm.getFieldValue('Field') || { Farm: { } };
    var mode = vm.getFieldValue('Mode') || { };
    
    return {
      fieldCode: field.FieldCode || '',
      productionDate: vm.getFieldValue('ProductionDate') || '',
      activity: mode.Activity || '',
      farmName: field.Farm['Farm Name'] || '',
      field: field
    }
  });
  this.productionDate = ko.observable();

  this.acceptEnterpriseCodeCommand = ko.command({
    execute: function () {
      self.showEnterprise(false);
    },
    canExecute: function () {
      return self.enterpriseCodeComplete();
    }
  });
  this.changeEnterpriseCodeCommand = ko.command({
    execute: function () {
      self.showEnterprise(true);
    },
    canExecute: function () {
      return !self.showEnterprise();
    }
  });

  this.saveProductionEntryCommand = ko.asyncCommand({
    execute: function (complete) {
      var scanData = ko.toJS(self.scannerVm().data);
      var enterpriseData = ko.toJS(self.enterprise());
      var production = {
        mode: enterpriseData.activity,
        productionDate: enterpriseData.productionDate,
        field: enterpriseData.field,
        employee: scanData.employee,
        productionItem: {
          unitKey: scanData.tote.toteKey,
          scannedImageData: scanData.tote.imageData
        }
      };

      return $.ajax("/api/d/productionResults", {
        data: ko.toJSON(production),
        dataType: 'json',
        contentType: 'application/json',
        method: 'POST'
      }).done((response) => {
        toastr.success(`Employee: <strong>${scanData.employee.name}</strong>, Tote: <strong>${scanData.tote.toteKey}</strong>`, 'Saved Successfully', { timeOut: 5000 });
        self.scannerVm().reset();
      }).fail(() => {
        console.log(arguments);
        toastr.fail(`An error occurred when attempting to save.`, 'Save failed');
        }).always(() => {
          complete();
        });
    },
    canExecute: function (isExecuting) {
      return !isExecuting && self.enterpriseCodeComplete()
        && self.scannerVm() && self.scannerVm().isValid()
    }
  });

  return self;
}

module.exports = {
  viewModel: ProductionController,
  template: require('./production-controller.html'),
  name: 'Production Controller',
  componentName: 'production-controller'
}