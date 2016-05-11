export default class PaymentInfo {
  constructor(values) {
    values = values || {};
    
    this.cardNumber = ko.observable(values.cardNumber);
    this.cardCvc = ko.observable(values.cardCvc);
    this.expDate = ko.observable(values.expDate);
    this.firstName = ko.observable(values.firstName);
    this.lastName = ko.observable(values.lastName);
    this.addressLine1 = ko.observable(values.addressLine1);
    this.addressLine2 = ko.observable(values.addressLine2);
    this.city = ko.observable(values.city);
    this.state = ko.observable(values.state);
    this.zip = ko.observable(values.zip);
    this.country = ko.observable(values.country);
    this.areaCode = ko.observable(values.areaCode);
    this.phone = ko.observable(values.phone);
    this.email = ko.observable(values.email);
  }
}