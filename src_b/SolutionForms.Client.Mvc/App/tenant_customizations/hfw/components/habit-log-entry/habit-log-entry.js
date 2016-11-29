import toastr from 'toastr';
import * as dataService from 'App/services/dataEntriesService';
import 'bindings/ko.bindings.bs-modal';
import moment from 'moment';
const clientHabitsDataSourceName = 'ClientHabits';
const activityLogsDataSourceName = 'ClientActivityLogs';

ko.punches.enableAll();

/*
 * @param 
 */
function HabitLogEntry(params) {
  if (!(this instanceof HabitLogEntry)) {
    return new HabitLogEntry(params);
  }

  const self = this;
  var controlBreaks = {};

  this.clientHabits = ko.observableArray([]);
  this.TotalPointsCompleted = ko.observable(0);
  this.client = ko.observable();

  this.clientName = ko.pureComputed(() => {
    var client = self.client();
    return (client && client.FirstName) || '';
  });
  this.clientId = ko.pureComputed(() => {
    var client = self.client();
    return (client && client.Id) || '';
  });
  this.targetPoints = ko.pureComputed(() => {
    var clientHabit = self.clientHabits() || [];
    
  });

  // behaviors
  this.controlBreak = function(level, value) {
    return controlBreak( level, value, controlBreaks );
  }

  this.clientHabits.subscribe(() => {
    controlBreaks = {};
  });


  //initialize 
  const init = self.getCurrentUser();
}

HabitLogEntry.prototype.getCurrentUser = function() {
  const self = this;
  return dataService.getDataByDataSourceName('clients/clients-2128')
    .done((data) => {
      self.client(data);
      return self.loadHabitsForClient(data.Id);
    });
}
HabitLogEntry.prototype.loadHabitsForClient = function(clientId) {
  const self = this;
  const date = moment().format('YYYY-MM-DD');
  
  if (!clientId) {
    this.clientHabits([]);
    return $.Deferred().resolve([]);
  }

  const options = {
    filter: `clientId:${ clientId }`,
    transformWith: 'ClientActivities/Details'
  }
  const logFilters = {
    filter: `ClientId:${ clientId } AND Date:${ date }`
  }

  return dataService.getAllRecordsFromDataSourceAsync(`${activityLogsDataSourceName}`, logFilters)
    .done((logs) => {
      dataService.getAllRecordsFromDataSourceAsync(clientHabitsDataSourceName, options)
        .done((data) => {
          const mapped = ko.utils.arrayMap(data, (d) => {
            const initComplete = ko.utils.arrayFirst(logs, (l) => l.QualifiedActivityId === d.qualifier.Id) != null;
            d.completed = ko.observable(initComplete);
            d.completeAsync = ko.asyncCommand({
              execute: (done) => {
                var newVal = !d.completed();
                self.updateCompletionForHabitAsync(self.client().Id, d.qualifier.Id, newVal)
                  .always(done)
                  .done(() => {
                    d.completed(newVal);
                  })
                  .fail(() => {
                  });
              },
              canExecute: (isExecuting) => {
                return !isExecuting && self.client() != null;
              }
            });
            return d;
          });
          self.clientHabits(mapped);
        });

      //note: points need to be included in projection
      //var pointsCompleted = 0;
      //ko.utils.arrrayForEach(logs, (l) => {
        
      //});
    });
}

HabitLogEntry.prototype.updateCompletionForHabitAsync = function(clientId, id, isComplete) {
  const date = moment().format('YYYY-MM-DD');
  const dto = {
    ClientId: clientId,
    QualifiedActivityId: id,
    Date: date
  }

  if (isComplete) {
    return dataService.createAsync(activityLogsDataSourceName, dto);
  }

  return dataService.getDataByDataSourceName(activityLogsDataSourceName, {
    filter: `ClientId:${ clientId } AND QualifiedActivityId:${ id } AND Date:${ date }`
  }).done((data) => {
    return $.when( 
      ko.utils.arrayMap( data || [], (d) => dataService.deleteAsync(`${activityLogsDataSourceName}/${d.Id}`))
    );
  });
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
  viewModel: HabitLogEntry,
  template: require('./habit-log-entry.html'),
  name: 'Habit Log',
  componentName: 'client-habit-log'
}