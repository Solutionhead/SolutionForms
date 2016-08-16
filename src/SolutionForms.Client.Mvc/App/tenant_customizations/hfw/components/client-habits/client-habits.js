import toastr from 'toastr';
import * as dataService from 'App/services/dataEntriesService';
import 'bindings/ko.bindings.bs-modal';
const clientHabitsDataSourceName = 'ClientHabits';
ko.components.register('habit-assignment', require('../client-habit-assignment/client-habit-assignment'));

/*
 * @param 
 */
function ClientHabits(params) {
  if (!(this instanceof ClientHabits)) {
    return new ClientHabits(params);
  }

  const self = this;
  const clientName = ko.observable();
  var controlBreaks = {};

  this.clientHabits = ko.observableArray([]);
  this.client = ko.computed(() => {
    var form = params.parentContext;
    var context = form.getFieldContextByName( 'Client' );
    const client = ko.unwrap( context );
    if (client == null) {
      clientName( null );
      this.clientHabits([]);
      controlBreaks = {};
      return null;
    }

    self.loadHabitsForClient( client.Id );
    clientName( client.Name );
    return client;
  });
  this.clientName = ko.pureComputed( clientName );
  this.showAssignmentUI = ko.observable( false );
  this.habitAssignmentVm = ko.observable();

  // behaviors
  this.initNewHabit = ko.command({
    execute: function() {
      self.showAssignmentUI(true);
    },
    canExecute: function() {
      return self.client() != null;
    }
  });
  this.createClientHabitAsync = ko.asyncCommand({
    execute: function(complete) {
      const vm = self.habitAssignmentVm();
      vm.commitAsync()
        .done(() => {
          toastr.success('Habit created successfully');
          self.loadHabitsForClient( self.client().Id );
        })
        .fail(() => toastr.error(':( Failed to create habit'))
        .always(complete);
    },
    canExecute: function(canExecute) {
      return self.habitAssignmentVm() != null && self.client() != null;
    }
  });
  this.controlBreak = function(level, value) {
    return controlBreak( level, value, controlBreaks );
  }

  function loadHabitsForSelectedClient() {
    self.loadHabitsForClient( client.Id );
  }

  this.clientHabits.subscribe(() => {
    controlBreaks = {};
  });
}

ClientHabits.prototype.loadHabitsForClient = function(id) {
  const self = this;
  if (!id) {
    this.clientHabits([]);
    return $.Deferred().resolve([]);
  }

  const options = {
    filter: `clientId:${ id }`,
    transformWith: 'ClientActivities/Details'
  }
  return dataService.getAllRecordsFromDataSourceAsync( clientHabitsDataSourceName, options )
    .done((data) => self.clientHabits(data));
}

function controlBreak(breakLevel, value, controlBreaks) {
  const lBreak = controlBreaks[breakLevel] = controlBreaks[breakLevel] || {};
  if ( lBreak === value) {
    return false;
  }

  if (lBreak != null) {
    resetBreaks(breakLevel);
  }
  controlBreaks[breakLevel] = value;
  return true;
}

function resetBreaks(level, controlBreaks) {
  for(var p in controlBreaks) {
    if (controlBreaks.hasOwnProperty(p)) {
      if (p > level) {
        controlBreaks[p] = null;
      }
    }
  }
}


module.exports = {
  viewModel: ClientHabits,
  template: require('./client-habits.html'),
  name: 'Client Habits List',
  componentName: 'client-habits-list'
}