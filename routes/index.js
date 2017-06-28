const express = require('express');
const router = new express.Router();
const error = require('http-errors');

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.app.get('env') === 'development') {
    res.render('index', {title: 'Pichasso'});
  } else {
    return next(new error.Forbidden());
  }
});

module.exports = router;
