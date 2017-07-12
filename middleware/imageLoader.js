const config = require('config');
const error = require('http-errors');
const request = require('request');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  request(req.query.file, (err, response) => {
    if (err) {
      return next(new error.BadRequest(`Request failed: ${err.message}`));
    }

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
    response.on('error', err => next(err));
  }).on('error', err => next(new error.NotFound(`Request failed: ${err.message}`)));
}

module.exports = imageLoader;
