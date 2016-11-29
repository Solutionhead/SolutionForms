import _groupBy from 'lodash/groupBy';
import _keys from 'lodash/keys';
import view from './daily-appointment-report.html';

class DailyAppointmentsReport {
  constructor(params) {
    var appointmentsByTeam = ko.pureComputed(function() {
      var data = ko.unwrap(params.appointments) || [];
      //todo: filter by appointment date
      return _groupBy(data, (d) => { return d.teamName; });
    });
    var teamsInReport = ko.pureComputed(function() {
      return _keys(appointmentsByTeam());
    });

    this.reportDate = params.reportDate;
    this.appointmentsByTeam = ko.pureComputed(() => {
      return ko.utils.arrayMap(teamsInReport(), (t) => {
        return {
          teamName: t,
          appointments: appointmentsByTeam()[t] || []
        };
      });
    });
  }
}

module.exports = {
  template: view,
  viewModel: DailyAppointmentsReport
}