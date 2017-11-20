const express = require('express');
const router = new express.Router();
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

/* GET thumbnail. */
router.get('/', checkQueryParams,
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

router.get('/test', onlyDevelopment, function (req, res) {
  res.render('pdf');
});

module.exports = router;
