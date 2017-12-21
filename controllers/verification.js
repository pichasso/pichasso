const sha256 = require('sha256');
const config = require('config');
const {
  URL
} = require('url');

class Verification {

  createHash(token, url) {
    if (this.isHostNameToken(token)) {
      return sha256(token + new URL(url).hostname).substring(0, 6);
    } else {
      return sha256(token + url).substring(0, 6);
    }
  }

  isValidToken(token) {
    const tokens = config.get('Thumbnail.Verification.Accounts')
      .filter(account => account.Enabled)
      .map(account => account.Token);
    return tokens.indexOf(token) !== -1;
  }

  isHostNameToken(token) {
    const hostnameTokens = config.get('Thumbnail.Verification.Accounts')
      .filter(account => account.Enabled && account.Type === 'hostname')
      .map(account => account.Token);
    return hostnameTokens.indexOf(token) !== -1;
  }

  createAuthCode(token, url) {
    return this.createHash(token, url);
  }

  getTokens(hostname) {
    if (hostname && hostname === true) {
      return config.get('Thumbnail.Verification.Accounts')
        .filter(account => account.Enabled && account.Type === 'hostname')
        .map(account => account.Token);
    } else if (hostname && hostname === false) {
      return config.get('Thumbnail.Verification.Accounts')
        .filter(account => account.Enabled && account.Type !== 'hostname')
        .map(account => account.Token);
    } else {
      return config.get('Thumbnail.Verification.Accounts')
        .filter(account => account.Enabled)
        .map(account => account.Token);
    }
  }

  verify(authorizationKey, url) {
    const tokens = this.getTokens();
    return new Promise((resolve, reject) => {
      if (!authorizationKey) {
        reject('authorization key missing');
      }
      tokens.forEach((token) => {
        const hash = this.createHash(token, url);
        if (hash === authorizationKey) {
          resolve(token);
        }
      });
      reject('authorization failed');
    });
  }

}

module.exports = new Verification();
