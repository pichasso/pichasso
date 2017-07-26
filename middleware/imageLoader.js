const config = require('config');
const error = require('http-errors');
const logger = require('../controllers/logger');
const logTag = '[ImageLoader]';
const request = require('request');

const extractFilename = require('./extractFilename');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  const r = request({
    url: req.query.file,
    encoding: 'binary',
  }, (err, response, body) => {
    if (err) {
      if (err.code === 'ENOTFOUND') {
        return next(new error.NotFound('Request failed.'));
      } else {
        logger.error(logTag, 'Request failed', err);
        return next(new error.BadRequest(`Request failed: ${err.message}`));
      }
    }

    if (!req.query.filename) {
      req.query.filename = extractFilename(response, req.query.file);
    }

    req.file = Buffer.alloc(body.length, body, 'binary');
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
  }).on('response', (response) => {
    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (statusCode !== 200) {
      r.abort();
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !contentType.startsWith('image/')) {
      r.abort();
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      r.abort();
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }
  });
}

module.exports = imageLoader;
