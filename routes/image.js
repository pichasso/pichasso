const express = require('express');
const router = express.Router();
const imageLoader = require('../middleware/imageLoader');
const resize = require('../controllers/resize');

/* GET home page. */
router.get('/', imageLoader, resize, (req, res) => {
  res.end(req.image, 'binary');
});

router.get('/test', function(req, res, next){
  res.render('test');
});


module.exports = router;
