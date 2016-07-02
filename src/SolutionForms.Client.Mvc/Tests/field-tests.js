import test from 'tape';
var core = require('App/core');
var ko = require('ko');
//import core from '../App/core';

test('Knockout component is registered.', function(t) {
  t.plan(2);
  
  t.false(ko.components.isRegistered('test-input'), "Component name is not registered prior to field registration.");
  
  core.Field.register('test-input', {
    name: 'Test Inupt',
    viewModel: TestInputType,
    template: '<div>Hello test!</div>',
  });

  t.ok(ko.components.isRegistered('test-input'), "Component name value is registered");
  core.Field.unregister('test-input');
});

test('Registered field types inherit from FieldBase.', function(t) {
  core.Field.register('test-input', {
    name: 'Test Inupt',
    viewModel: TestInputType,
    template: '<div>Hello test!</div>',
  });

  const parent = document.createElement("div");
  const comp = parent.appendChild(document.createElement("test-input"));
  ko.applyBindings({
    parent: true
  }, parent);

  var raw = new TestInputType();
  t.true(raw.userResponse == null, "Model does not define userResponse member.");

  window.setTimeout(() => {
    const context = ko.contextFor(comp.children[0]);
    t.ok(context.$data.userResponse, "userResponse member is inherited from base.");
    core.Field.unregister('test-input');
    t.end();
  }, 0);
});

test('Registered field types with defined userResponse overrides member on FieldBase.', function(t) {
  core.Field.register('test-input', {
    name: 'Test Inupt',
    viewModel: TestInputTypeWithUserResponse,
    template: '<div>Hello test!</div>',
  });

  const parent = document.createElement("div");
  const comp = parent.appendChild(document.createElement("test-input"));
  ko.applyBindings({
    parent: true
  }, parent);

  window.setTimeout(() => {
    const context = ko.contextFor(comp.children[0]);
    t.ok(context.$data.userResponse && typeof context.$data.userResponse.splice === "function", 
      "userResponse member overrides base.");

    t.ok(typeof context.$data.helloYou === "function", "Prototype members are intact");
    t.ok(context.$data.helloYou("beautiful") === "Hello beautiful!", "Prototype member is as expected.");
    t.ok(context.$data instanceof core.FieldBase, "Custom field type is instance of FieldBase.");

    //cleanup
    core.Field.unregister('test-input');
    t.end();
  }, 0);
});

test('Registered field types with are instances of FieldBase.', function(t) {
  core.Field.register('test-input', {
    name: 'Test Inupt',
    viewModel: TestInputTypeWithUserResponse,
    template: '<div>Hello test!</div>',
  });

  const parent = document.createElement("div");
  const comp = parent.appendChild(document.createElement("test-input"));
  ko.applyBindings({
    parent: true
  }, parent);

  window.setTimeout(() => {
    const context = ko.contextFor(comp.children[0]);
    t.ok(context.$data.userResponse && typeof context.$data.userResponse.splice === "function", 
      "userResponse member overrides base.");

    t.ok(context.$data instanceof core.FieldBase, "Custom field type is instance of FieldBase.");

    //cleanup
    core.Field.unregister('test-input');
    t.end();
  }, 0);
});

function TestInputType() {
  if(!(this instanceof TestInputType)) { return new TestInputType(); }

  this.testInputType = true;
}

function TestInputTypeWithUserResponse() {
  if(!(this instanceof TestInputTypeWithUserResponse)) { return new TestInputTypeWithUserResponse(); }

  this.userResponse = ko.observableArray([]);
}

TestInputTypeWithUserResponse.prototype.helloYou = function(name) {
  return `Hello ${name}!`;
}