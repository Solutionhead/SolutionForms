import _keys from 'lodash/keys';
import core from 'App/core';
const regEx = /^\.\/(.*)[^\/]+\.js|html$/i;
//const tennant = core.getTennantId();
//require(`customizations/${tennant}/components`);
//System.import('customizations/' + core.getTennantId() + '/components');

/// Loads field types located within the "controls" aliased directory.
export function registerLocalFieldTypes(loadConfig) {
  //var req = require.context(
  //  'controls',
  //  true,
  //  regEx);
  var req = require.context(
    'controls',
    true,
    /^\.\/(.*)[^\/]+\.js|html$/i);
  registerFieldTypesByDirectory(req, loadConfig);
}

//export function registerTennantCustomComponents(tryLoadConfig) {
//  var r = require('customizations/' + core.getTenantId())
//  //const tennant = core.getTennantId();
//  //var req = require.context(
//  //  'customizations/' + tennant + '/components',
//  //  //`customizations/${tennant}/components`,
//  //  true,
//  //  regEx);
//  //registerFieldTypesByDirectory(req, tryLoadConfig);
//}

function registerFieldTypesByDirectory(req, loadConfig) {
  const isTemplateRegEx = /\.html$/i;
  const isConfigRegEx = /-config\.(js|html)$/i;
  const configRegEx = /((-?\w)+?)(-config)?\.(js|html)/i;

  var fields = {};
  ko.utils.arrayMap(req.keys(), function (key) {
    const name = key.match(configRegEx)[1];
    const isConfig = isConfigRegEx.test(key);
    const isTemplate = isTemplateRegEx.test(key);

    if (isConfig === true) {
      loadConfig && setFieldSetting(name, isTemplate ? 'configTemplate' : 'configViewModel', key);
    } else if (isTemplate) {
      setFieldSetting(name, 'template', key);
    } else {
      setFieldSetting(name, 'viewModel', key);
    }
  });

  ko.utils.arrayForEach(_keys(fields), (key) => {
    const field = fields[key];
    const f = req(field.viewModel);

    if (f.name == null) {
      console.log(`Unable to register field due to missing "name" property.`);
      return;
    }

    if (field.template == null && f.template == null) {
      console.log('Unable to register field due to missing "template" property.');
      return;
    }

    core.Field.register(key, {
      viewModel: f.viewModel,
      template: field.template != null ? req(field.template) : f.template,
      name: f.name
    });

    if (loadConfig) {
      let config = field.configViewModel != null ? req(field.configViewModel) : null;
      if (typeof config === "function") {
        config = {
          viewModel: config,
          template: req(field.configTemplate)
        }
      }

      core.Field.registerFieldConfig(key, config);
    }
  });

  function setFieldSetting(fieldName, key, value) {
    fields[fieldName] = fields[fieldName] || {};
    fields[fieldName][key] = value;
  }
}