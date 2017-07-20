import toastr from 'toastr';
import { getAllRecordsFromDataSourceAsync as fetch } from 'App/services/dataEntriesService';
import { createAsync as create } from 'App/services/dataEntriesService';
import core from 'App/core';

if (!ko.components.isRegistered('form-field')) {
  ko.components.register('form-field', require('components/form-field/form-field'));
}

ko.filters.formattedDate = function (value) {
  return value.toLocaleDateString();
};

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
    exports: ko.observable(),
    fieldContext: ko.observable(),
  };
  this.ticketScannerConfig = {
    label: '',
    inputType: 'barcode-scanner',
    config: {
      "FieldContainerType": "container",
      "captureResultImages": false,
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
        var employee = self.employeeLookupField.exports().userResponse();
        if (employee == null) {
          toastr.error("Please select an employee.", "Validation error");
          done();
          return $.Deferred();
        }

        if (self.employeeTickets().length < 1) {
          toastr.error("Please scan tickets to be assigned.", "Validation error");
          done();
          return $.Deferred();
        }
        

        var tickets = ko.utils.arrayFilter(self.employeeTickets(), (t) => {
          return !t.isSaved;
        });

        var itemsToSave = ko.utils.arrayFilter(self.employeeTickets(), (t) => { return !t.isSaved; });
        ko.utils.arrayMap(itemsToSave, (t) => {
          var dto = ko.toJS({
            employee: employee,
            ticketNumber: t.id,
            productionDate: t.productionDate.toISOString().substring(0, 10),
            fieldCode: t.fieldCode, //todo: lookup field?
          });

          return create('EmployeeTickets', dto, true)
            .then(function () {
              toastr.success(`Ticket ${dto.ticketId} has been assigned to ${dto.employee.name}.`, 'Ticket Assigned Successfully.');
            });
        });

        $.when.apply($, tickets)
          .done(function () {
            self.employeeTickets([]);
            self.employeeLookupField.fieldContext().setValue(null);
          })
          .always(function () {
            done();
          });
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
  this.addTicket = function (scannedValue, isSaved) {
    scannedValue = scannedValue || '';
    var parts = scannedValue.split('+');
    if (parts.length != 3) { return; }

    var vals = {
      ticketNum: parts[2],
      productionDate: parts[0],
      fieldCode: parts[1]
    };

    var d = vals.productionDate + '';
    var year = Number(d.substring(0, 2));
    year = "20" + year;
    var dayOfYear = Number(d.substring(2));
    d = new Date(`${year}-01-01`);
    d.setDate(d.getDate() + dayOfYear);
    vals.productionDate = d;
        
    if (ticketCache[vals.ticketNum] != null) {
      return;
    }

    t = new Ticket(vals, isSaved || false);
    t.removeTicketCommand = ko.command({
      execute: function (t) {
        self.removeTicket(t);
      },
      parent: self
    })
    ticketCache[vals.ticketNum] = t;
    self.employeeTickets.push(t);
  }

  var subs = [];
  subs.push(barcodeScannerVm.subscribe(employeeTicketScannerListener));

  setTimeout(function () {
    if (!self.viewState.displayTicketAssignmentUI()) {
      self.commands.toggleTicketAssignmentUIState();
    }
  },0)

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
  fetch('EmployeeTickets', { '$transformWith': 'EmployeesTickets/Active' })
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

function Ticket(vals, isSaved) {
  this.id = vals.ticketNum;
  this.productionDate = vals.productionDate; //todo: convert from julian
  this.fieldCode = vals.fieldCode; 
  this.isSaved = isSaved || false;
}