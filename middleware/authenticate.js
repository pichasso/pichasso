const config = require('config');
const logger = require('../controllers/logger');
const logTag = '[Authentication]';
const error = require('http-errors');
const verification = require('../controllers/verification');


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

  verification.verify(req.query.auth, req.query.file)
    .then(() => next())
    .catch(err => next(new error.Forbidden(err)));
}
module.exports = verifyAuthentication;
