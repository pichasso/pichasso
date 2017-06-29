const express = require('express');
const router = new express.Router();
// const config = require('config');
const fileLoader = require('../middleware/fileLoader');
// const error = require('http-errors');

/* GET pdf. */
router.get('/:file/:quality*?', fileLoader, (req, res) => {
  // res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  // res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  res.setHeader('Content-Type', 'application/pdf');
  // res.render('pdf', { params: req.params });
  res.end(req.compressedFile, 'binary');
});

module.exports = router;
