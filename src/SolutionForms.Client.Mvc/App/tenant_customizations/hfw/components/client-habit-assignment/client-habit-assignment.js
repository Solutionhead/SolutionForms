import * as service from 'App/services/dataEntriesService';
ko.components.register('activity-selector', require('../activity-selector/activity-selector'));

function ClientHabitAssignment(params) {
  if (!(this instanceof ClientHabitAssignment)) {
    return new ClientHabitAssignment(params);
  }

  const self = this;

  this.client = params.client;
  this.activitySelectorVm = ko.observable();
  
  this.model = ko.validatedObservable({
    clientId: ko.pureComputed(function () {
       const client = ko.unwrap( params.client );
      return client && client.Id;
    }).extend({ required: true }),
    weeklyGoal: ko.observable().extend({ required: true }),
    qualifiedActivityId: ko.pureComputed(function() {
      const vm = self.activitySelectorVm();
      return vm && vm.selectedActivity();
    })
  });

  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      commitAsync: self.commitAsync.bind(self)
    });
  }

  return self;
}

ClientHabitAssignment.prototype.commitAsync = function() {
  const self = this;
  const model = this.model;
  if (!model.isValid()) {
    model.errors.showAllMessages();
    return $.Deferred().reject();
  }

  return service.createAsync('ClientHabits', ko.toJSON(model), true)
    .done(() => {
      self.model().weeklyGoal(null);
      self.activitySelectorVm().resetActivity();
    });
}

module.exports = {
  viewModel: ClientHabitAssignment,
  template: require('./client-habit-assignment.html'),
  name: 'Client Habit Assignment',
  componentName: 'client-habit-assignment'
}