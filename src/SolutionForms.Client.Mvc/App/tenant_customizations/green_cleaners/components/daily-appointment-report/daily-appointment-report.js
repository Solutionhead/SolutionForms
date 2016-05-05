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


//  //createOrSetObservableArrayProp(propname, value, fallbackValue) {
//  //  createOrSetObservableProp(propname, value, () => { return ko.observableArray(value); }, fallbackValue || []);
//  //}
//  //createOrSetObservableProp(propname, value, propInitFn, fallbackValue) {
//  //  const val = value == undefined ? value : fallbackValue; 

//  //  if (typeof propInitFn !== "function") {
//  //    propInitFn = (valToSet) => { return ko.observable(valToSet); }
//  //  }

//  //  if (this.hasOwnProperty(propname) && ko.isObservable(this[propname])) {
//  //    this[propname](val);
//  //  } else {
//  //    this[propname] = propInitFn(val);
//  //  }
//  }
//}