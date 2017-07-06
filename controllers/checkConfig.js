const config = require('config');

function checkConfig() {
  const loadExternalData = config.get('ImageSource.LoadExternalData.Enabled');
  const loadDataById = config.get('ImageSource.LoadById.Enabled');

  if (!loadExternalData && !loadDataById) {
    throw new Error('Invalid configuration.' +
      'Set either ImageSource.LoadExternalData.Enabled or ImageSource.LoadById.Enabled to true.');
  }

  if (loadExternalData && config.get('ImageSource.LoadExternalData.ProtocolsAllowed').length < 1) {
    throw new Error('ImageSource.LoadExternalData.ProtocolsAllowed not defined.');
  }

  if (loadDataById && !config.get('ImageSource.LoadById.SourcePath')) {
    throw new Error('ImageSource.LoadById.SourcePath is undefined.');
  }
}

module.exports = checkConfig;
