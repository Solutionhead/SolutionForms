"use strict";

import PaymentInfo from 'App/models/PaymentInfo';
import 'App/bindings/ko.bindings.jq-payment';
import toastr from 'toastr';

ko.validation.rules['creditcardNum'] = {
  validator: (val) => {
    return Stripe.card.validateCardNumber(val); 
  },
  message: 'Invalid card number'
};

ko.validation.rules['cardExpDate'] = {
  validator: (val) => {
    return Stripe.card.validateExpiry(val);
  },
  message: 'Expiration date is invalid'
};
ko.validation.rules['cardCVC'] = {
  validator: Stripe.card.validateCVC,
  message: 'CVC is invalid'
};
ko.validation.registerExtenders();

const options = {
    showCountry: false,
    showPhone: false
};

var vm = {
  paymentInfo: new PaymentInfo({}),

  displayAddress: ko.pureComputed(() => {
    return options.displayAddress == undefined ? true : ko.unwrap(options.displayAddress);
  }),
  displayCountry: ko.pureComputed(() => {
    return options.displayCountry == undefined ? true : ko.unwrap(options.displayCountry);
  }),
  displayPhone: ko.pureComputed(() => {
    return options.displayPhone == undefined ? true : ko.unwrap(options.displayPhone);
  }),

  createCardAsync: ko.asyncCommand({
    execute: function (done) {
      if (!vm.isValid()) {
        done();
        return;
      }

      var payment = vm.paymentInfo;
      Stripe.card.createToken({
        name: payment.nameOnCard(),
        number: payment.cardNumber(),
        cvc: payment.cardCvc(),
        exp: payment.expDate(),
        address_line1: payment.addressLine1(),
        address_line2: payment.addressLine2(),
        address_state: payment.state(),
        address_zip: payment.zip(),
        address_country: payment.country()
      }, (status, response) => {
        stripeResponseHandlerAsync(status, response).always(done);
      });
    },
    canExecute: function (isExecuting) {
      return !isExecuting;
    }
  })
}

var cardIcons = {
  'visa': 'fa-cc-visa',
  'discover': 'fa-cc-discover',
  'mastercard': 'fa-cc-mastercard',
  'amex': 'fa-cc-amex'
};

vm.paymentInfo.cardNumber.extend({ creditcardNum: true, required: true });
vm.paymentInfo.expDate.extend({ 'cardExpDate': true, 'required': true });
vm.paymentInfo.cardCvc.extend({ 'cardCVC': true, 'required': true });
vm.paymentInfo.nameOnCard.extend({ 'required': true });
vm.paymentInfo.addressLine1.extend({ 'required': true });
vm.paymentInfo.city.extend({ 'required': true });
vm.paymentInfo.state.extend({ 'required': true });
vm.paymentInfo.zip.extend({ 'required': true });

vm.paymentInfo.cardType = ko.pureComputed(() => {
  var number = vm.paymentInfo.cardNumber();
  return $.payment.cardType(number);
});

vm.paymentInfo.cardIcon = ko.pureComputed(() => {
  const type = vm.paymentInfo.cardType();
  return cardIcons[type] || 'fa-credit-card';
});

vm.isValid = function() {
  const result = ko.validation.group(vm.paymentInfo);
  const errors = result();
  if (errors && errors.length) {
    result.showAllMessages();
    toastr.error('Please correct the validation errors.');
    return false;
  }

  return true;
};

ko.applyBindings(vm);

function stripeResponseHandlerAsync(status, response) {
  if (response.error) {
    toastr.error(response.error.message, 'Save Failed');
    const dfd = $.Deferred();
    dfd.reject();
    return dfd;
  }

  const requestBody = ko.toJSON({
    paymentToken: response.id,
    emailAddress: vm.paymentInfo.email //todo: add email
  });

  return $.ajax("/api/payments", {
    data: requestBody,
    dataType: 'json',
    contentType: 'application/json',
    method: 'POST'
  }).done(() => {
    toastr.success(`We'll use your your new payment preferences on your next billing cycle.`, 'Payment Saved Successfully');
  }).fail(() => {
    toastr.error('Something went wrong as we were trying to save your payment settings. Please try again later.', 'Save failed');
  });
}