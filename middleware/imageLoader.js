const config = require('config');
const error = require('http-errors');
const request = require('request');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  request({
    url: req.query.file,
    encoding: 'binary',
  }, (err, response, body) => {
    if (err) {
      return next(new error.BadRequest(`Request failed: ${err.message}`));
    }

    req.image = Buffer.alloc(body.length, body, 'binary');
    sharp(req.image)
      .metadata()
      .then((metadata) => {
        req.imageProperties = metadata;
        req.imageProperties.aspectRatio = metadata.width / metadata.height;
        next();
      })
      .catch(err => next(new error.BadRequest(`Request failed: ${err.message}`)));
  }).on('response', (response) => {
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (contentType && !/^image\//.test(contentType)) {
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }
  });
}

module.exports = imageLoader;
