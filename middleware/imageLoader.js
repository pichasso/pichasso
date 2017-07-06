const config = require('config');
const error = require('http-errors');
const http = require('http');
const https = require('https');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  let protocol = http;
  if (/^https/.test(req.query.url)) {
    protocol = https;
  }
  protocol.get(req.query.url, (response) => {
    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (statusCode !== 200) {
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !/^image\//.test(contentType)) {
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }

    let imageBuffer = Buffer.alloc(contentLength);
    let bufPosition = 0;
    response.on('data', (chunk) => {
      if (!contentLength) {
        const extendedLength = bufPosition + chunk.length;
        if (sizeLimit && extendedLength / 1024 >= sizeLimit) {
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
      req.image = imageBuffer;
      sharp(imageBuffer)
        .metadata()
        .then((metadata) => {
          req.imageProperties = metadata;
          req.imageProperties.aspectRatio = metadata.width / metadata.height;
          next();
        })
        .catch(err => next(new error.BadRequest(`Request failed: ${err.message}`)));
    });
    response.on('error', error => next(error));
  }).on('error', e => next(new error.NotFound(`Request failed: ${e.message}`)));
}

module.exports = imageLoader;
