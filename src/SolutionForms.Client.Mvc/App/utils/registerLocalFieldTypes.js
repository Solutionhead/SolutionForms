import _keys from 'lodash/keys';
import core from 'App/core';

/// Loads field types located within the "controls" aliased directory.
export function registerLocalFieldTypes(loadConfig) {
  var req = require.context(
    "controls",
    true,
    /^\.\/(.*)[^\/]+\.js|html$/i);

  const isTemplateRegEx = /\.html$/i;
  const isConfigRegEx = /-config\.(js|html)$/i;
  const configRegEx = /((-?\w)+?)(-config)?\.(js|html)/i;

  var fields = {};
  ko.utils.arrayMap(req.keys(), function(key) {
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

  const defaultFieldName = 'text-field';
  var defaultField = fields[defaultFieldName];
  if (defaultField == null) {
    throw new Error(`Default field type, '${defaultFieldName}' was not found.`);
  } else {
    core.defaultFieldName = defaultFieldName;
  }

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
      isDefaultFieldType: key === defaultFieldName,
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