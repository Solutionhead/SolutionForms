import * as dataService from 'App/services/dataEntriesService';
ko.punches.enableAll();

function ActivitySelector(params) {
  if (!(this instanceof ActivitySelector)) {
    return new ActivitySelector(params);
  }

  const self = this;
  const distinctWellnessAreas = ko.observable({});
  const distinctCategories = ko.observable({});
  const activities = ko.observableArray([]);
  const activityQualifiers = ko.observable({});
  
  self.model = {
    wellnessArea: ko.observable(),
    category: ko.observable(),
    activity: ko.observable(),
    activityQualifier: ko.observable(),
  }

  self.wellnessAreas = activities
    .map((a) => a['Wellness Area'])
    .filter(distinctFilter(distinctWellnessAreas));

  self.filteredCategories = activities
    .filter((a) => a['Wellness Area'] === self.model.wellnessArea());

  self.filteredDistinctCategories = self.filteredCategories
    .map((a) => a.Category)
    .filter(distinctFilter(distinctCategories));

  self.filteredActivities = activities
    .filter((a) => a.Category === self.model.category());

  self.activityQualifiers = ko.pureComputed(function() {
    const activity = self.model.activity();
    const qualifiers = activityQualifiers() || {};
    return (qualifiers[activity] || [])
      .sort(function(a,b) { return Number(a.Points) - Number(b.Points) });
  });

  function loadActivities() {
    return dataService.getAllRecordsFromDataSourceAsync('activities', 200)
      .done((data) => activities(data));
  }
  function loadActivityQualifiers() {
    return dataService.getAllRecordsFromDataSourceAsync('activityqualifiers', 200)
      .done((data) => {
        var qualifiersByActivity = {};
        ko.utils.arrayForEach(data, (d) => {
          var activityId = d.Activity.Id;
          qualifiersByActivity[activityId] = qualifiersByActivity[activityId] || [];
          d.Points = d['Point Value'];
          qualifiersByActivity[activityId].push(d);
        });
        activityQualifiers(qualifiersByActivity);
      });
  }

  self.model.wellnessArea.subscribe(() => distinctCategories({}));

  const init = $.when([ loadActivities(), loadActivityQualifiers() ]);

  if (ko.isWritableObservable(params.exports)) {
    params.exports({
      selectedActivity: this.model.activityQualifier,
      resetActivity: resetActivity.bind(self),
    });
  }

  return self;
  
  function resetActivity() {
    self.model.activity(null);
  }
  function distinctFilter(cache) {
    return (val) => isDistinct(val, cache);
  }
  function isDistinct(val, cache) {
    cache = ko.unwrap(cache);
    if (cache[val] == null) {
      cache[val] = val;
      return true;
    } else {
      return false;
    }
  }
}

module.exports = {
  viewModel: ActivitySelector,
  template: require('./activity-selector.html'),
  name: 'Activity Selector',
  componentName: 'activity-selector'
}