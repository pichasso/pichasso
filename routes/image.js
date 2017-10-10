const express = require('express');
const router = new express.Router();
const logger = require('../controllers/logger');
const logTag = '[ImageRoute]';
const config = require('config');
const checkQueryParams = require('../middleware/checkQueryParams');
const checkEtag = require('../middleware/checkEtag');
const checkCache = require('../middleware/checkCache');
const persist = require('../middleware/filePersistence');
const imageLoader = require('../middleware/imageLoader');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');
const onlyDevelopment = require('../middleware/onlyDevelopment');

/* GET image. */
router.get('/', checkQueryParams, checkEtag, checkCache, imageLoader, resize, convert, persist, function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  res.setHeader('Content-Disposition', 'inline;');
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

router.get('/test', onlyDevelopment, function (req, res) {
  res.render('image');
});


module.exports = router;
