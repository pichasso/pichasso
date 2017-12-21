const express = require('express');
const router = new express.Router();
const error = require('http-errors');
const config = require('config');
const logger = require('../controllers/logger');
const logTag = '[ThumbnailRoutet]';

const checkQueryParams = require('../middleware/checkQueryParams');
const onlyDevelopment = require('../middleware/onlyDevelopment');
const checkEtag = require('../middleware/checkEtag');
const checkCache = require('../middleware/checkCache');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');
const persist = require('../middleware/filePersistence');
const thumbnailCreator = require('../middleware/thumbnailCreator');
const authenticate = require('../middleware/authenticate');
const verification = require('../controllers/verification');

/* GET verification code */
router.get('/verify/:token/:file', (req, res, next) => {
  if (req.params.token && verification.isValidToken(req.params.token)) {
    const authCode = verification.createAuthCode(req.params.token, req.params.file);
    res.setHeader('content-type', 'text/plain');
    res.end(authCode, 'utf8');
  } else {
    next(new error.Forbidden());
  }
});

/* GET thumbnail. */
router.get('/', checkQueryParams,
  authenticate,
  checkEtag,
  checkCache,
  thumbnailCreator,
  resize,
  convert,
  persist,
  (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
    res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
    res.setHeader('Vary', 'Accept');
    if (req.query.filename) {
      if (!req.query.filename.endsWith('.' + req.query.format)) {
        req.query.filename += '.' + req.query.format;
      }
      res.setHeader('Content-Disposition', `inline; filename="${req.query.filename}"`);
    }
    res.type(req.query.format);
    logger.debug(logTag, 'Response headers:', res._headers);
    res.end(req.file, 'binary');
  });


module.exports = router;
