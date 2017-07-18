import toastr from 'toastr';
import { getAllRecordsFromDataSourceAsync as fetch } from 'App/services/dataEntriesService';
import { createAsync as create } from 'App/services/dataEntriesService';
import core from 'App/core';

if (!ko.components.isRegistered('form-field')) {
  ko.components.register('form-field', require('components/form-field/form-field'));
}

function EmployeeTicketAssignment(params) {
  if (!(this instanceof EmployeeTicketAssignment)) {
    return new EmployeeTicketAssignment(params);
  }

  var barcodeScannerVm = ko.observable();
  
  var self = core.FieldBase.call(this, params);

  var ticketCache = {};
  this.employeeTickets = ko.observableArray([]);

  this.employeeLookupField = {
    label: 'Employee',
    inputType: 'employee-lookup',
    exports: ko.observable()
  };
  this.ticketScannerConfig = {
    label: '',
    inputType: 'barcode-scanner',
    //context: scannedBarcodeVm,
    config: {
      "FieldContainerType": "container",
      "captureResultImages": false,
      //"locator": {
      //  "halfSample": false,
      //  "patchSize": "small",
      //  "debug": {
      //    showCanvas: true,
      //    showPatches: true,
      //    showFoundPatches: true,
      //    showSkeleton: true,
      //    showLabels: true,
      //    boxFromPatches: {
      //      showTransformed: true,
      //      showTransformedBox: true,
      //      showBB: true
      //    }
      //  }
      //}
    },
    exports: barcodeScannerVm
  }

  this.viewState = {
    displayTicketAssignmentUI: ko.observable(false)
  };
  //todo: add validation
  this.commands = {
    toggleTicketAssignmentUIState: ko.command({
      execute: function () {
        var state = !self.viewState.displayTicketAssignmentUI();
        self.viewState.displayTicketAssignmentUI(state);
        state === true ?
          barcodeScannerVm().startScanner() :
          barcodeScannerVm().stopScanner();         
      },
      canExecute: function () {
        return barcodeScannerVm() != null;
      }
    }),
    saveTicketAssignmentCommand: ko.asyncCommand({
      execute: function (done) {
        var tickets = ko.utils.arrayFilter(self.employeeTickets(), (t) => {
          return !t.isSaved;
        });

        self.employeeTickets.filter((t) => { return !t.isSaved; })
          .map((t) => {
            var dto = ko.toJS({
              employee: self.employeeLookupField.exports().userResponse,
              ticketId: barcodeScannerVm().scannedValue,
              field: {}, //todo: get field
              activity: '' //todo: get activity
            });

            return create('employee-tickets', dto, true)
              .then(function () {
                toastr.success(`Ticket ${dto.ticketId} has been assigned to ${dto.employee.name}.`, 'Saved successfully.');
              });
          });

        $.when.apply($, tickets)
          .always(function () {
            //todo: reset form
            done()
          });
        //ko.utils.arrayForEach(tickets, (t) => {

        //});
        //var dto = ko.toJS({
        //  employee: self.employeeLookupField.exports().userResponse,
        //  ticketId: barcodeScannerVm().scannedValue,
        //  field: {}, //todo: get field
        //  activity: '' //todo: get activity
        //});
        //create('employee-tickets', dto, true)
        //  .then(function () {
        //    toastr.success(`Ticket ${dto.ticketId} has been assigned to ${dto.employee.name}.`, 'Saved successfully.');
        //    //todo: reset form
        //  })
        //  .always(function () {
        //    done();
        //  });
      }
    })
  }

  //todo: load currently assigned employee tickets (for today?)
  //this.ready = this.loadEmployeeTickets();

  this.removeTicket = function (ticketToRemove) {
    self.employeeTickets.remove(ticketToRemove);
    delete ticketCache[ticketToRemove.id];
  }

  var t = null;
  this.addTicket = function (ticketId, isSaved) {
    if (ticketCache[ticketId] != null) {
      return;
    }

    t = new Ticket(ticketId, isSaved || false);
    t.removeTicketCommand = ko.command({
      execute: function (t) {
        self.removeTicket(t);
      },
      parent: self
    })
    ticketCache[ticketId] = t;
    self.employeeTickets.push(t);
  }

  var subs = [];
  subs.push(barcodeScannerVm.subscribe(employeeTicketScannerListener));
  
  function employeeTicketScannerListener(scannerVm) {
    if (!scannerVm || !scannerVm.scannedValue) return;

    var t = null;
    scannerVm.scannedValue.subscribe((val) => {
      if (val) {
        self.addTicket(val);
      }
    });
  }

  self.dispose = function () {
    self.employeeTickets([]);
    ko.utils.arrayForEach(subs, function (s) {
      s.dispose && s.dispose();
      ko.utils.arrayRemove(s);
    })
  };

  return self;
}

EmployeeTicketAssignment.prototype.loadEmployeeTickets = function () {
  var employees = [];
  fetch('employee-tickets', { '$transformWith': 'EmployeesTickets/Active' })
    .done((r) => {
      ko.utils.arrayPushAll(this.employeeTickets(), ko.utils.arrayMap(r, (d) => {
        return d;
      }));
      this.employeeTickets.notifySubscribers();
    })
}
EmployeeTicketAssignment.prototype.verifyTicket = function (value) {
  //todo: implement verification
  return true;
}

module.exports = {
  viewModel: EmployeeTicketAssignment,
  template: require('./employee-ticket-assignment.html'),
  name: 'Employee Ticket Assignment',
  componentName: 'employee-ticket-assignment'
}

function Ticket(id, isSaved) {
  this.id = id;
  this.isSaved = isSaved || false;
}