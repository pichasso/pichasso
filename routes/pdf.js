const express = require('express');
const router = new express.Router();
const config = require('config');
// const checkEtag = require('../middleware/checkEtag');
// const checkCache = require('../middleware/checkCache');
// const persist = require('../middleware/imagePersistence');
const fileLoader = require('../middleware/fileLoader');
// const resize = require('../controllers/resize');
// const convert = require('../controllers/convert');
const error = require('http-errors');

/* GET pdf. */
router.get('/:file/:quality*?', fileLoader, function (req, res) {
  //res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  //res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  //res.render('pdf', { params: req.params });
  //res.download(req.pdf);
});

module.exports = router;
