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
  let attachment = 'inline';
  if (req.params.download) {
    attachment = 'attachment';
  }
  let filename = '';
  let regExp = /filename.?=.?\"(.*)\"/ig;
  if (req.get('Content-Disposition') && req.get('Content-Disposition').match(regExp)) {
    filename = regExp.exec(req.get('Content-Disposition'))[0];
  } else {
    let filepath = req.params.file.split('/');
    if (filepath.length) {
      filename = filepath[filepath.length - 1];
    }
  }
  if (!filename.match(/\.pdf/ig)) {
    filename += '.pdf';
  }
  res.setHeader('Content-Disposition', `${attachment}; filename="${filename}"`);
  res.end(req.compressedFile, 'binary');
});

module.exports = router;
