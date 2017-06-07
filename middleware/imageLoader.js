const http = require('http');
const https = require('https');
const probe = require('probe-image-size');
const config = require('config');

function imageLoader(req, res, next) {
  let error;

  if (req.query.url.indexOf('://') === -1) {
        // assume id in url, create url with given id
    if (config.get('ImageSource.LoadById.Enabled') !== true) {
      error = new Error('Loading external data has been disabled.');
    }
    let sourcePath = config.get('ImageSource.LoadById.SourcePath');
    if (!sourcePath) {
      error = new Error('ImageSource.LoadById.SourcePath not defined.');
    }
    req.query.url = sourcePath.replace(/{id}/gi, req.query.url);
  } else {
        // assume we got an url, check for validity
    if (config.get('ImageSource.LoadExternalData.Enabled') !== true) {
      error = new Error('Loading external data has been disabled.');
    }
        // check protocol filter
    let allowedProtocols = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (!allowedProtocols) {
      error = new Error('ImageSource.LoadExternalData.ProtocolsAllowed not defined.');
    }
    let protocolAllowed = allowedProtocols.filter(function (protocol) {
      return req.query.url.indexOf(protocol) === 0;
    });
    if (!protocolAllowed) {
      error = new Error('Protocol not allowed.');
    }
        // check url whitelist
    let whitelistRegex = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (whitelistRegex) {
      let whitelisted = whitelistRegex.filter(function (regex) {
        return req.query.url.match(regex);
      });
      if (!whitelisted) {
        error = new Error('Domain source not allowed.');
      }
    }
  }

  if (error !== undefined) {
    return next(error);
  }

  let protocol = http;
  if (/^https/.test(req.query.url)) {
    protocol = https;
  }
  protocol.get(req.query.url, (response) => {

    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);

    if (statusCode !== 200) {
      return res.status(404).send(`Request failed.\nStatus Code: ${statusCode}`);
    } else if (contentLength / 1024 >= config.get('ImageSource.MaxFileSize')) {
      const sizeLimit = config.get('ImageSource.MaxFileSize');
      return res.status(400).send(`File exceeds size limit of ${sizeLimit} KB.`);
    }

    const imageBuffer = Buffer.alloc(contentLength);
    let bufPosition = 0;
    response.on('data', (chunk) => {
      chunk.copy(imageBuffer, bufPosition);
      bufPosition += chunk.length;
    });
    response.on('end', () => {
      req.image = imageBuffer;
      req.imageProperties = probe.sync(req.image);
      if (!req.imageProperties) {
        return res.status(400).send('The requested file is not an image.');
      }
      next();
    });
    response.on('error', error => next(error));
  }).on('error', e => res.status(404).send(`Request failed: ${e.message}`));
}

module.exports = imageLoader;
