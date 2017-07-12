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
  let attachment = config.get('PDFConversion.Attachment');
  if (req.params.download) {
    attachment = 'attachment';
  }
  if (req.params.filename) {
    res.setHeader('Content-Disposition', `${attachment}; filename="${req.parms.filename}"`);
  }
  res.end(req.compressedFile, 'binary');
});

module.exports = router;
