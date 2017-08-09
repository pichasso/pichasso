const express = require('express');
const router = new express.Router();
const config = require('config');
const error = require('http-errors');
const cache = require('../middleware/fileCache');
const onlyDevelopment = require('../middleware/onlyDevelopment');

/* test */
router.head('/', function (req, res) {
  res.status(200).end();
});

/* GET home page. */
router.get('/', onlyDevelopment, function (req, res) {
  res.render('index', {title: 'Pichasso'});
});

router.get('/clear/:hash', function (req, res, next) {
  let configHash = config.get('Caching.ClearHash');
  if (configHash && req.params.hash && configHash === req.params.hash) {
    cache.clear();
    res.status(200).end('OK');
  } else {
    return next(new error.Forbidden());
  }
});

module.exports = router;
