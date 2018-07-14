const config = require('config');
const error = require('http-errors');
const logger = require('../controllers/logger');
const logTag = '[ImageLoader]';
const request = require('request');

const extractFilename = require('./extractFilename');
const PDFCompressor = require('./pdfCompressor');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  const r = request({
    url: req.query.file,
    encoding: 'binary',
    headers: {
      'Connection': 'keep-alive',
    },
  }, (err, response, body) => {
    if (err) {
      if (err.code === 'ENOTFOUND') {
        return next(new error.NotFound('Request failed.'));
      } else {
        logger.error(logTag, 'Request failed', err);
        return next(new error.BadRequest(`Request failed: ${err.message}`));
      }
    }

    const statusCode = response.statusCode;
    const contentLength = body ? body.length : Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (statusCode !== 200) {
      r.abort();
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !(contentType.startsWith('image/') || contentType.endsWith('application/pdf'))) {
      r.abort();
      return next(new error.BadRequest(`Invalid content-type. Expected image or pdf, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      r.abort();
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }

    if (!req.query.filename) {
      req.query.filename = extractFilename(response, req.query.file);
    }

    function loadImage() {
      sharp(req.file)
        .metadata()
        .then((metadata) => {
          req.imageProperties = metadata;
          req.imageProperties.aspectRatio = metadata.width / metadata.height;
          next();
        })
        .catch((err) => {
          logger.error(logTag, 'Sharp is unable to load image', err);
          return next(new error.BadRequest(`Request failed: ${err.message}`));
        });
    }

    if (contentType === 'application/pdf') {
      const compressor = new PDFCompressor();
      compressor 
        .outputDevice('png16m')   
        .resolution('300') 
        .pageList('1')
        .exec(body, (err, data) => {
          if (err) {
            return next(`PDF Compression failed: ${err.message}`);
          }
          req.file = data;
          loadImage();
        });
    } else {
      req.file = Buffer.alloc(body.length, body, 'binary');
      loadImage();
    }

  });
}

module.exports = imageLoader;
