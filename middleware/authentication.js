const config = require('config');
const logger = require('../controllers/logger');
const logTag = '[Authentication]';
const error = require('http-errors');
const createHash = require('../middleware/createHash');


function verifyAuthentication(req, res, next) {
  if (req.completed) {
    return next();
  }

  if (config.get('Thumbnail.Verification.Enabled') === false) {
    logger.debug(logTag, 'Thumbnail authentication disabled');
    return next();
  } else {
    logger.debug(logTag, 'Thumbnail authentication enabled');
  }

  const authorizationKey = req.query.auth;
  const url = req.query.file;
  const tokens = config.get('Thumbnail.Verification.Accounts')
    .filter(account => account.Enabled)
    .map(account => account.Token);

  function verify() {
    return new Promise((resolve, reject) => {
      if (!authorizationKey) {
        reject('authorization key missing');
      }
      tokens.forEach((token) => {
        const hash = createHash(token, url);
        if (hash === authorizationKey) {
          resolve(token);
        }
      });
      reject('authorization failed');
    });
  }

  verify()
    .then(() => next()).catch(err => next(new error.Forbidden(err)));
}
module.exports = verifyAuthentication;
