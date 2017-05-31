const express = require('express');
const router = new express.Router();
const config = require('config');
const imageLoader = require('../middleware/imageLoader');
const persist = require('../middleware/imagePersistance');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');

/* GET image. */
router.get('/', imageLoader, resize, convert, persist (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=" + config.get('Caching.Expires'));
  res.setHeader("Expires", new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  res.end(req.image, 'binary');
});

router.get('/test', function (req, res) {
  res.render('test');
});

module.exports = router;
