import quaggaPlugin from 'plugins/quaggaBarcodeScannerPlugin';
import toastr from 'toastr';
import core from 'App/core';

const quagga = new quaggaPlugin();

ko.bindingHandlers.fileUpload = {
  init: function (element, valueAccessor) {
    $(element).change(function () {
      valueAccessor()(element.files[0]);
    });
  },
  update: function (element, valueAccessor) {
    if (ko.unwrap(valueAccessor()) === null) {
      $(element).wrap('<form>').closest('form').get(0).reset();
      $(element).unwrap();
    }
  }
};

function BarcodeScannerField(params) {
  if (!(this instanceof BarcodeScannerField)) {
    return new BarcodeScannerField(params);
  }

  const settings = $.extend({}, BarcodeScannerField.prototype.DEFAULT_CONFIG, params.fieldConfig.settings);

  var timeout = null;
  var value = ko.observable();
  this.lastToteScanned = null;
  this.workingOnTote = false;
  this.isScannerActive = ko.observable(false);
  
  this.userResponse = value; 
  var resultsCollector = null;

  var self = core.FieldBase.call(this, settings);
  
  this.config = {
    displayCapturedImage: settings.displayCapturedImage,
    startScannerOnLoad: settings.startScannerOnLoad,
    scannerTimeoutMS: settings.scannerTimeoutMS,
  };

  var liveStreamRequested = ko.observable();
  var liveStreamSupported = ko.observable();

  this.viewState = {
    uniqueId: `scanner_div_${crypto.getRandomValues(new Uint32Array(1))[0]}`,
    showScannerUI: ko.pureComputed(function () {
      return self.isScannerActive();
    }),
    showCapturedImage: ko.pureComputed(function () {
      return self.config.displayCapturedImage && self.model.scannedImageSource() != null;
    }),
    showActivationButton: ko.pureComputed(function () {
      return !self.isScannerActive() && self.model.scannedImageSource() == null;
    }),
    liveStreamMode: ko.pureComputed(function () {
      return liveStreamRequested() && liveStreamSupported() && true;
    }),
    imageStreamMode: ko.pureComputed(function () {
      return !self.viewState.liveStreamMode();
    })
  };
  this.model = {
    scannedValue: value,
    scannedImageSource: ko.observable(),
    uploadImageSource: ko.observable()
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
        var config = getQuaggaConfig();
        
        if (config.captureResultImages !== false) {
          resultsCollector = quagga.buildResultsCollector({
            capture: true, // keep track of the image producing this result
            capacity: 20,  // maximum number of results to store
            filter: function (codeResult) {
              return true;
            }
          });
        }

        self.model.scannedValue(null);
        self.model.scannedImageSource(null);
        self.model.uploadImageSource(null)
        self.isScannerActive(true);
        
        quagga.init(config);
        
        quagga.addHandler('detected', (r) => { self.barcodeDetected(r, resultsCollector); });

        setScannerTimeout();
        setTimeoutListener();
      },
      canExecute: function () {
        return !self.isScannerActive();
      }
    }),
    decodeSingleImageCommand: ko.command({
      execute: function () {
        var fileSource = self.model.uploadImageSource();
        if(fileSource != null) {
          var config = getQuaggaConfig();
          config.src = URL.createObjectURL(fileSource);
          tryDecodeImage(config);
        }
      },
      canExecute: function () {
        return self.viewState.imageStreamMode();
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

  self.model.uploadImageSource.subscribe(function (val) {
    if (val) {
      var config = getQuaggaConfig();
      config.src = URL.createObjectURL(val);
      tryDecodeImage(config);
    }
  });

  function getQuaggaConfig() {
    var config = $.extend(true, {}, scannerConfigOptions, params.fieldConfig.settings.scannerConfig);
    config.inputStream.target = document.querySelector(`#${self.viewState.uniqueId} .scanner-viewport`);

    navigator.getUserMedia = null; //todo: remove
    if (config.inputStream.type.toLowerCase() === "livestream") {
      liveStreamRequested(true);
      if (!navigator.getUserMedia) {
        liveStreamSupported(false);
        config.inputStream.type = "ImageStream";
      }
    }

    return config;
  }

  var resolutionOptions = [320, 640, 800, 1280, 1600, 1920];
  function tryDecodeImage(config) {
    quagga.decodeSingle(config, function (result) {
      if (!result || !result.codeResult) {
        toastr.warning('Unable to detect barcode in this image. Please try a different image.');
      }

      // progressive retry if barcode reco fails
      //if (!result || !result.codeResult) {
      //  var index = ko.utils.arrayIndexOf(resolutionOptions, config.inputStream.size) + 1;
      //  if (index >= resolutionOptions.length) {
      //    if (config.locator.halfSample === true) {
      //      config.locator.halfSample = false;
      //      config.inputStream.size = resolutionOptions[0];
      //      return tryDecodeImage(config);
      //    }
      //    toastr.warning('Unable to detect barcode in this image. Please try a different image.');
      //    return;
      //  }

      //  config.inputStream.size = resolutionOptions[index];
      //  tryDecodeImage(config);
      //}
    });
  }
  function setScannerTimeout() {
    if (self.config.scannerTimeoutMS > 0 && self.viewState.liveStreamMode()) {
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
    if (!self.isScannerActive() || self.workingOnTote || result.codeResult.code === self.lastToteScanned) {
      return;
    }

    var code = result.codeResult.code;
    self.model.scannedValue(code);

    if (settings.onBarcodeDetected) {
      settings.onBarcodeDetected(result.codeResult.code, resultsCollector);
    }

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
  quagga.removeAllHandlers();
  
  var viewPortNode = document.querySelector(`#${this.viewState.uniqueId} .scanner-viewport`);
  while (viewPortNode.firstChild) {
    viewPortNode.removeChild(viewPortNode.firstChild);
  }
}

BarcodeScannerField.prototype.DEFAULT_CONFIG = {
  displayCapturedImage: true,
  startScannerOnLoad: false,
  scannerTimeoutMS: 30000,
  scannerConfig: {}
}

const scannerConfigOptions = {
  numOfWorkers: navigator.hardwareConcurrency,
  locate: true,
  inputStream: {
    name: "Live",
    type: "LiveStream",
    size: 800,
  },
  decoder: {
    readers: ["code_39_reader"]
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