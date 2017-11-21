const sha256 = require('sha256');

function createHash(token, url) {
  return sha256(token + url).substring(0, 6);
}

module.exports = createHash;
