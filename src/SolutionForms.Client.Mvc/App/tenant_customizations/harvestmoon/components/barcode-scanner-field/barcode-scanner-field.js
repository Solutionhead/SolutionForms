import quaggaPlugin from 'plugins/quaggaBarcodeScannerPlugin';
import toastr from 'toastr';
import core from 'App/core';

const quagga = new quaggaPlugin();

function BarcodeScannerField(params) {
  if (!(this instanceof BarcodeScannerField)) {
    return new BarcodeScannerField(params);
  }

  const config = $.extend({}, BarcodeScannerField.prototype.DEFAULT_CONFIG, params.config);

  var timeout = null;
  var value = ko.observable();
  this.lastToteScanned = null;
  this.workingOnTote = false;
  this.isScannerActive = ko.observable(false);
  this.userResponse = value; 

  var self = core.FieldBase.call(this, config);
  
  this.config = {
    displayCapturedImage: config.displayCapturedImage,
    startScannerOnLoad: config.startScannerOnLoad,
    scannerTimeoutMS: config.scannerTimeoutMS,
  };
  this.viewState = {
    uniqueId: 'scanner_div',
    showScannerUI: ko.pureComputed(function () {
      return self.isScannerActive();
    }),
    showCapturedImage: ko.pureComputed(function () {
      return self.config.displayCapturedImage && self.model.scannedImageSource() != null;
    }),
    showActivationButton: ko.pureComputed(function () {
      return !self.isScannerActive() && self.model.scannedImageSource() == null;
    })
  };
  this.model = {
    scannedValue: value,
    scannedImageSource: ko.observable()
  }
  this.commands = {
    stopScannerCommand: ko.command({
      execute: function () {
        self.stopBarcodeScanner();
      },
      canExecute: function () {
        return self.isScannerActive();
      }
    }),
    activateScannerCommand: ko.command({
      execute: function () {
        var config = $.extend({}, scannerConfigOptions, params.fieldConfig.settings || {});
        config.inputStream.target = document.querySelector(`#${self.viewState.uniqueId}`);
        quagga.init(config);
        if (config.captureResultImages === true){
          var resultsCollector = quagga.buildResultsCollector({
            capture: true, // keep track of the image producing this result
            capacity: 20,  // maximum number of results to store
            filter: function (codeResult) {
              return true;
            }
          });
        }
        quagga.addHandler('detected', (r) => { self.barcodeDetected(r, resultsCollector); });
        self.model.scannedValue(null);
        self.model.scannedImageSource(null);
        self.isScannerActive(true);

        setScannerTimeout();
        setTimeoutListener();
      },
      canExecute: function () {
        return !self.isScannerActive();
      }
    })
  };

  if (self.config.startScannerOnLoad === true) {
    setTimeout(this.commands.activateScannerCommand.execute, 0);
  }

  if (ko.isObservable(params.exports)) {
    params.exports({
      startScanner: self.commands.activateScannerCommand.execute,
      stopScanner: self.commands.stopScannerCommand.execute,
      scannedValue: ko.pureComputed(function () {
        return value();
      }),
      setScannedValue: function (val) {
        value(val);
      }
    })
  }

  function setScannerTimeout() {
    if (self.config.scannerTimeoutMS > 0) {
      timeout = Date.now() + self.config.scannerTimeoutMS;
    } else {
      timeout = 0;
    }
  }
  function setTimeoutListener() {
    if (timeout > 0) {
      setTimeout(function () {
        if (Date.now() >= timeout) {
          self.commands.stopScannerCommand();
        } else {
          setTimeoutListener();
        }
      }, 1000);
    }
  }

  self.keepAlive = function () {
    setScannerTimeout();
  }

  self.barcodeDetected = function (result, resultsCollector) {
    setScannerTimeout();
    if (self.workingOnTote || result.codeResult.code === self.lastToteScanned) {
      return;
    }

    var code = result.codeResult.code;
    self.model.scannedValue(code);
    //self.stopBarcodeScanner();

    if (!self.config.displayCapturedImage || resultsCollector == null) {
      return;
    }

    self.lookingForCapturedImage = true;

    var results = resultsCollector.getResults();
    var match = ko.utils.arrayFirst(results, (r) => {
      return r.codeResult.code === code;
    }) || { frame: null }

    self.model.scannedImageSource(match.frame);
    self.workingOnTote = false;
  }

  return self;
}

BarcodeScannerField.prototype.stopBarcodeScanner = function () {
  quagga.stop();
  this.isScannerActive(false);
}

BarcodeScannerField.prototype.DEFAULT_CONFIG = {
  displayCapturedImage: true,
  startScannerOnLoad: false,
  scannerTimeoutMS: 30000
}

const scannerConfigOptions = {
  locate: true,
  inputStream: {
    name: "Live",
    type: "LiveStream",
    //target: document.querySelector('#scanner-container'),
    //size: 400,
    //area: {
    //  top: "10%",
    //  right: "10%",
    //  bottom: "30%",
    //  left: "10%"
    //},
    //constraints: {
    //  width: "330",
    //  height: "200"
    //}
  },
  decoder: {
    readers: ["code_39_reader"],
    debug: {
      drawBoundingBox: true,
      showFrequency: true,
      drawScanline: true,
      showPattern: true
    }
  },
  locator: {
    halfSample: true,
    patchSize: "medium"
  }
}

module.exports = {
  viewModel: BarcodeScannerField,
  template: require('./barcode-scanner-field.html'),
  name: 'Barcode Scanner',
  componentName: 'barcode-scanner'
}