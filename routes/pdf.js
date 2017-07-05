const express = require('express');
const router = new express.Router();
const config = require('config');
const fileLoader = require('../middleware/fileLoader');
const loadParamsFromQuery = require('../middleware/loadParamsFromQuery');

/* GET pdf. */
router.get('/', loadParamsFromQuery, fileLoader, (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  if (req.get('Content-Type')) {
    res.setHeader('Content-Type', req.get('Content-Type') || 'application/pdf');
  } else {
    res.setHeader('Content-Type', 'application/pdf');
  }
  if (req.get('Content-Disposition')) {
    res.setHeader('Content-Disposition', req.get('Content-Disposition'));
  } else {
    let filepath = req.params.file.split('/');
    if (filepath.length) {
      let filename = filepath[filepath.length - 1];
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }
  }
  res.end(req.compressedFile, 'binary');
});

module.exports = router;
