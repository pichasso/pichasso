const express = require('express');
const router = new express.Router();
const config = require('config');
const pdfLoader = require('../middleware/pdfLoader');
const checkQueryParams = require('../middleware/checkQueryParams');

/* GET pdf. */
router.get('/', checkQueryParams, pdfLoader, (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  if (req.get('Content-Type')) {
    res.setHeader('Content-Type', req.get('Content-Type') || 'application/pdf');
  } else {
    res.setHeader('Content-Type', 'application/pdf');
  }
  let attachment = config.get('PDFConversion.Attachment');
  if (req.query.download) {
    attachment = 'attachment';
  }
  if (req.query.filename) {
    res.setHeader('Content-Disposition', `${attachment}; filename="${req.query.filename}"`);
  }
  res.end(req.compressedFile, 'binary');
});

module.exports = router;
