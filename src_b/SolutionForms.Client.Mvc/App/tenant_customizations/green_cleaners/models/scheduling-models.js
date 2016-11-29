class Appointment {
  constructor (values) {
    this.id = values.id;
    this.recurrence = values.recurrence;
    this.date = values.date;
    this.startTime = values.startTime;
    this.endTime = values.endTime;
    this.title = values.title;
    this.location = values.location;
    this.notes = values.notes;
  }
}

export { Appointment as default }