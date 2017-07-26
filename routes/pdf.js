const express = require('express');
const router = new express.Router();
const config = require('config');
const logger = require('../controllers/logger');
const logTag = '[PdfRoute]';

const pdfLoader = require('../middleware/pdfLoader');
const checkQueryParams = require('../middleware/checkQueryParams');
const onlyDevelopment = require('../middleware/onlyDevelopment');
const checkEtag = require('../middleware/checkEtag');
const checkCache = require('../middleware/checkCache');
const persist = require('../middleware/filePersistence');

/* GET pdf. */
router.get('/', checkQueryParams, checkEtag, checkCache, pdfLoader, persist, (req, res) => {
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
    if (!req.query.filename.endsWith('.pdf')) {
      req.query.filename += '.pdf';
    }
    res.setHeader('Content-Disposition', `${attachment}; filename="${req.query.filename}"`);
  }
  res.end(req.file, 'binary');
  logger.debug(logTag, 'Response headers:', res.getHeaders());
});

router.get('/test', onlyDevelopment, function (req, res) {
  res.render('pdf');
});

module.exports = router;
