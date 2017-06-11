const config = require('config');
const error = require('http-errors');
const http = require('http');
const https = require('https');
const sharp = require('sharp');

function imageLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  if (req.query.url.indexOf('://') === -1) {
        // assume id in url, create url with given id
    if (config.get('ImageSource.LoadById.Enabled') !== true) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }
    let sourcePath = config.get('ImageSource.LoadById.SourcePath');
    if (!sourcePath) {
      return next(new error.InternalServerError('ImageSource.LoadById.SourcePath not defined.'));
    }
    req.query.url = sourcePath.replace(/{id}/gi, req.query.url);
  } else {
        // assume we got an url, check for validity
    if (config.get('ImageSource.LoadExternalData.Enabled') !== true) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }
        // check protocol filter
    let allowedProtocols = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (!allowedProtocols) {
      return next(new error.InternalServerError('ImageSource.LoadExternalData.ProtocolsAllowed not defined.'));
    }
    let protocolAllowed = allowedProtocols.filter(function (protocol) {
      return req.query.url.indexOf(protocol) === 0;
    });
    if (!protocolAllowed) {
      return next(new error.BadRequest('Protocol not allowed.'));
    }
        // check url whitelist
    let whitelistRegex = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (whitelistRegex) {
      let whitelisted = whitelistRegex.filter(function (regex) {
        return req.query.url.match(regex);
      });
      if (!whitelisted) {
        return next(new error.BadRequest('Domain source not allowed.'));
      }
    }
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
    } else if (!/^image\//.test(contentType)) {
      return next(new error.BadRequest(`Invalid content-type. Expected image, but received ${contentType}.`));
    } else if (sizeLimit && contentLength / 1024 >= sizeLimit) {
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
          next();
        })
        .catch(err => next(new error.BadRequest(`Request failed: ${err.message}`)));
    });
    response.on('error', error => next(error));
  }).on('error', e => next(new error.NotFound(`Request failed: ${e.message}`)));
}

module.exports = imageLoader;
