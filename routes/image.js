const express = require('express');
const router = express.Router();
const imageLoader = require('../middleware/imageLoader');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');

/* GET image. */
router.get('/', imageLoader, resize, convert, (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=2592000");
  res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
  res.end(req.image, 'binary');
});

router.get('/test', function (req, res, next) {
  res.render('test');
});

module.exports = router;