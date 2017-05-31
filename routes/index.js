const express = require('express');
const router = new express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {title: 'Pichasso'});
});

module.exports = router;
