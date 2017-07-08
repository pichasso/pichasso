const express = require('express');
const router = new express.Router();
const onlyDevelopment = require('../middleware/onlyDevelopment');

/* GET home page. */
router.get('/', onlyDevelopment, function (req, res) {
  res.render('index', {title: 'Pichasso'});
});

module.exports = router;
