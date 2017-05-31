const express = require('express');
const router = new express.Router();
const imageLoader = require('../middleware/imageLoader');
const resize = require('../controllers/resize');
const convert = require('../controllers/convert');

/* GET image. */
router.get('/', imageLoader, resize, convert, (req, res) => {
  res.end(req.image, 'binary');
});

router.get('/test', function(req, res){
  res.render('test');
});

module.exports = router;
