var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(501).send('This Route is not yet implemented.');
});

router.get('/test', function(req, res, next){
  res.render('test');
})


module.exports = router;
