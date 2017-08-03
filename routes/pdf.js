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
  const attachment = req.query.download ? 'attachment' : config.get('PDFConversion.Attachment');

  res.setHeader('Cache-Control', 'public, max-age=' + config.get('Caching.Expires'));
  res.setHeader('Expires', new Date(Date.now() + config.get('Caching.Expires')).toUTCString());
  res.setHeader('Content-Type', 'application/pdf');
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
