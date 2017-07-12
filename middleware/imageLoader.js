const config = require('config');
const error = require('http-errors');
const request = require('request');
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
        return next(new error.BadRequest(`Request failed: ${err.message}`));
      }
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
    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('ImageSource.MaxFileSize');

    if (statusCode !== 200) {
      r.abort();
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !/^image\//.test(contentType)) {
      r.abort();
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      r.abort();
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }
  });
}

module.exports = imageLoader;
