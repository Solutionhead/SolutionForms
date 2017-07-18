import Quagga from 'quagga';
import toastr from 'toastr';

class QuaggaBarcodeScannerPlugin {
  constructor() {
    //this.isInit = false;
    //this.handlers = {}
  }
  isInit = false;
  handlers = {};

  //get init(config) { return this.initQuagga(config); }
  stop() { Quagga.stop(); }
  start() { Quagga.start(); }

  init(config) {
    if (typeof config === "string") {
      try {
        config = JSON.parse(config);
      }
      catch (ex) {
        console.log(`Failed to parse configuration as JSON. Received config argument as string which contained invalid JSON. Initializing without configuration.`);
      }
    }

    if (this.isInit) {
      this.dispose();
    }

    var me = this;

    Quagga.init(config, function (err) {
      if (err) {
        toastr.error(err.message, "Barcode Scanner Failed")
        console.log(err);
        return;
      }

      me.start();
      me.isInit = true;
      console.log("Quagga initialized.");
      return me;
    });
  }
  buildResultsCollector(config) {
    var resultCollector = Quagga.ResultCollector.create(config);
    Quagga.registerResultCollector(resultCollector);
    return resultCollector;
  }
  addHandler(eventName, callback) {
    this.handlers[eventName] = this.handlers[eventName] || [];
    if (ko.utils.arrayIndexOf(this.handlers[eventName], callback) > -1) {
      return;
    }

    switch (eventName.toLowerCase()) {
      case 'processed':
        Quagga.onProcessed(callback);
        break;
      case 'detected':
        Quagga.onDetected(callback);
        break;
      default:
        return;
    }

    this.handlers[eventName].push(callback);
  }
  removeQuaggaHandler(eventName, callback) {
    this.handlers[eventName] = this.handlers[eventName] || [];
    ko.utils.arrayRemoveItem(this.handlers[eventName], callback);

    switch (eventName.toLowerCase()) {
      case 'processed':
        Quagga.offProcessed(callback);
        break;
      case 'detected':
        Quagga.offDetected(callback);
        break;
    }
  }

  dispose() {
    if (!this.isInit) { return; }
    var self = this;

    Quagga.stop();
    removeAllHandlersByEvent('processed');
    removeAllHandlersByEvent('detected');

    this.isInit = false;

    function removeAllHandlersByEvent(event) {
      if (self.handlers[event] && self.handlers[event].length) {
        ko.utils.arrayForEach(self.handlers[event], (h) => { self.removeQuaggaHandler(event, h); })
      }
    }
  }
}

module.exports = QuaggaBarcodeScannerPlugin;