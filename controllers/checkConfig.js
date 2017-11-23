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

  const thumbnailVerificationEnabled = config.get('Thumbnail.Verification.Enabled');
  if (!(thumbnailVerificationEnabled === true || thumbnailVerificationEnabled === false)) {
    throw new Error('Thumbnail.Verification.Enabled must be true or false');
  }
  if (thumbnailVerificationEnabled === true) {
    const accounts = config.get('Thumbnail.Verification.Accounts');
    console.log(accounts);
    if (!(accounts instanceof Array)) {
      throw new Error('Thumbnail.Verification.Accounts must be an Array');
    }
    accounts.forEach((account) => {
      if (account['Description'] === undefined || !(typeof account['Description'] === 'string') ||
        (account['Enabled'] === undefined || !(typeof account['Enabled'] === 'boolean')) ||
        account['Token'] === undefined || !(typeof account['Token'] === 'string')) {
        throw new Error('Accounts have to be an object like { \
          "Description": "sampledescription", "Enabled": true, "Token": "sampletoken"\
         }');
      }
    });
    if (accounts.length === 0 || accounts.filter(account => account['Enabled'] === true).length === 0) {
      throw new Error('If verification enabled, there must be at least one account enabled.');
    }
  }
}

module.exports = checkConfig;
