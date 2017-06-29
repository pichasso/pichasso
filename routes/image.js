const express = require('express');
const router = new express.Router();
const config = require('config');
const checkEtag = require('../middleware/checkEtag');
const checkCache = require('../middleware/checkCache');
const persist = require('../middleware/imagePersistence');
const imageLoader = require('../middleware/imageLoader');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');
const onlyDevelopment = require('../middleware/onlyDevelopment');

/* GET image. */
router.get('/', checkEtag, checkCache, imageLoader, resize, convert, persist, function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  res.end(req.image, 'binary');
});

router.get('/test', onlyDevelopment, function (req, res) {
  res.render('test');
});


module.exports = router;
