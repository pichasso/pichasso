const sha256 = require('sha256');
const {URL} = require('url');

function createHash(token, url, hostnameOnly) {
  if (hostnameOnly) {
    return sha256(token + new URL(url).hostname).substring(0, 6);
  } else {
    return sha256(token + url).substring(0, 6);
  }
}

module.exports = createHash;
