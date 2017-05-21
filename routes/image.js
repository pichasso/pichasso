const express = require('express');
const router = express.Router();
const imageLoader = require('../middleware/imageLoader');
const sharp = require('sharp');

/* GET home page. */
router.get('/', imageLoader, function(req, res, next) {
  const width = Number(req.query.width);
  const height = Number(req.query.height);

  sharp(req.image)
    .resize(width, height)
    .jpeg()
    .toBuffer()
    .then((buffer) => {
      res.write(buffer, 'binary');
      res.end(null, 'binary');
    })
    .catch((error) => {
      res.status(500).render('error', {error: error});
    });
});

router.get('/test', function(req, res, next){
  res.render('test');
});


module.exports = router;
