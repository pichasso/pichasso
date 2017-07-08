const config = require('config');
const error = require('http-errors');
const http = require('http');
const https = require('https');
const sharp = require('sharp');
const logger = require('../controllers/logger');
const logTag = '[ImageLoader]';

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  let protocol = http;
  if (/^https/.test(req.query.url)) {
    protocol = https;
    logger.verbose(logTag, 'Use https');
  }
  protocol.get(req.query.url, (response) => {
    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (statusCode !== 200) {
      logger.warn(logTag, 'Server responded with', statusCode);
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !/^image\//.test(contentType)) {
      logger.info(logTag, 'Invalid content-type', contentType);
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      logger.info(logTag, 'Size limit exceeded', contentLength);
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }

    let imageBuffer = Buffer.alloc(contentLength);
    let bufPosition = 0;
    response.on('data', (chunk) => {
      if (!contentLength) {
        const extendedLength = bufPosition + chunk.length;
        if (sizeLimit && extendedLength / 1024 >= sizeLimit) {
          logger.info(logTag, 'Size limit exceeded', contentLength);
          return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
        }
        let extendedBuffer = Buffer.alloc(extendedLength);
        if (imageBuffer.length) extendedBuffer.fill(imageBuffer);
        imageBuffer = extendedBuffer;
      }
      imageBuffer.fill(chunk, bufPosition);
      bufPosition += chunk.length;
    });
    response.on('end', () => {
      logger.info(logTag, 'Downloaded file successfully', req.query.url);
      req.image = imageBuffer;
      sharp(imageBuffer)
        .metadata()
        .then((metadata) => {
          req.imageProperties = metadata;
          req.imageProperties.aspectRatio = metadata.width / metadata.height;
          if (req.imageProperties.hasAlpha) logger.debug(logTag, 'Image has alpha channel');
          next();
        })
        .catch((err) => {
          logger.error(logTag, 'Unable to read file', err.message);
          next(new error.BadRequest(`Request failed: ${err.message}`));
        });
    });
    response.on('error', (error) => {
      logger.error(logTag, 'Error while downloading file', error.message);
      next(error);
    });
  }).on('error', (err) => {
    logger.error(logTag, 'Request failed', req.query.url, err.message);
    next(new error.NotFound(`Request failed: ${err.message}`));
  });
}

module.exports = imageLoader;
