import moment from 'moment';

export default class EventInstance {
  constructor(values) {
    const fDate = moment(values.date, 'MM/DD/YYYY').format('MM/DD/YYYY');

    this.id = values.id;
    this.date = fDate;
    this.start = moment(fDate + ' ' + values.startTime, 'MM/DD/YYYY hh:mm a');
    this.end = moment(fDate + ' ' + values.endTime,'MM/DD/YYYY hh:mm a');
    this.startTime = this.start.format('h:mma');
    this.endTime = this.end.format('h:mma');
    this.label = values.label;
    this.location = values.location;
    this.teamName = values.teamName;
    this.notes = values.notes,
    this.clientNotes = values.clientNotes,
    this.isRecurring = values.isRecurring || false;
  }
}
EventInstance.prototype.DEFAULTS = {
  isRecurring: false
}
