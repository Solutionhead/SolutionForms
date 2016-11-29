import moment from 'moment';
ko.filters.relativeDate = function (val, format) {
    return moment(val, format).fromNow();
}
ko.filters.percent = function (val, precision) {
    var calc = (Number(val) * 100);
    const p = Number(precision) || 0;
    return `${ p > 1 ? calc.toPrecision(precision) : parseInt(calc) }%`;
}
ko.punches.enableAll();


function AllClientActivityOverview(params) {
  if (!(this instanceof AllClientActivityOverview)) {
    return new AllClientActivityOverview(params);
  }

  const self = this;
  //todo: dynamicaly get date of last monday
  self.dateStart = ko.observable('8/15/2016');
  self.clientSummaries = ko.observableArray([]);

  self.loadActivityForAllClients();

  return self;
}

AllClientActivityOverview.prototype.loadActivityForAllClients = function () {
  const self = this;

  var data = [
    {
      ClientName: 'Andrew Mills',
      TargetWeeklyPoints: 25,
      LastActivityDate: '2016-08-16T08:03:00.000',
      TotalPointsCompleted: 16,
      PointsCompletedToday: 4
    }, {
      ClientName: 'Anna Garza',
      TargetWeeklyPoints: 10,
      LastActivityDate: '2016-08-15T09:23:00.000',
      TotalPointsCompleted: 20,
      PointsCompletedToday: 2
    }, {
      ClientName: 'Michelle Austin',
      TargetWeeklyPoints: 10,
      LastActivityDate: '2016-08-15T19:23:00.000',
      TotalPointsCompleted: 8,
      PointsCompletedToday: 2
    }, {
      ClientName: 'Phillip Jackson',
      TargetWeeklyPoints: 65,
      LastActivityDate: '2016-08-16T12:36:00.000',
      TotalPointsCompleted: 35,
      PointsCompletedToday: 7
    }, {
      ClientName: 'Vinney Kelly',
      TargetWeeklyPoints: 25,
      LastActivityDate: '2016-08-01T09:36:00.000',
      TotalPointsCompleted: 0,
      PointsCompletedToday: 0
    }
  ];
  self.clientSummaries(ko.utils.arrayMap(data, (d) => {
    d.percentCompletedForWeek = d.TargetWeeklyPoints > 0 ?
      d.TotalPointsCompleted / d.TargetWeeklyPoints :
      d.TotalPointsCompleted > 0 ? 1 : 0;
    return d;
  }));

  return self;
}

module.exports = {
  viewModel: AllClientActivityOverview,
  template: require('./all-client-activity-overview.html'),
  name: 'All Client Overview',
  componentName: 'all-client-activity-overview'
}