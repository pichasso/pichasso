const config = require('config');
const constants = require('../constants.json');
const error = require('http-errors');

function checkParams(req, res, next) {
  if (!req.query.url) {
    return next(new error.BadRequest('Undefined resource location.'));
  }

  if (req.query.url.match(/:\/\//)) {
    // assume we got an url, check for validity
    if (!config.get('ImageSource.LoadExternalData.Enabled')) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }

    const allowedProtocols = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (!allowedProtocols.some(each => req.query.url.match(`^${each}:\/\/`))) {
      return next(new error.BadRequest('Protocol not allowed.'));
    }

    const whitelistRegex = config.get('ImageSource.LoadExternalData.WhitelistRegex');
    if (whitelistRegex.length > 0) {
      const whitelisted = whitelistRegex.some(req.query.url.match);
      if (!whitelisted) {
        return next(new error.BadRequest('Domain source not allowed.'));
      }
    }
  } else {
    // assume id in url, create url with given id
    if (!config.get('ImageSource.LoadById.Enabled')) {
      return next(new error.BadRequest('Loading data by has been disabled.'));
    }

    const sourcePath = config.get('ImageSource.LoadById.SourcePath');
    req.query.url = sourcePath.replace(/{id}/gi, req.query.url);
  }

  if (req.query.width) {
    const maxWidth = config.get('ImageConversion.MaxWidth') > 0 ?
      config.get('ImageConversion.MaxWidth') : Number.MAX_SAFE_INTEGER;
    const width = parseIntWithLimits(req.query.width, 1, maxWidth);
    if (isNaN(width)) {
      return next(new error.BadRequest(`Invalid width. Expected integer between 1 and ${maxWidth}, ` +
        `but received ${req.query.width}.`));
    }
    req.query.width = width;
  }

  if (req.query.height) {
    const maxHeight = config.get('ImageConversion.MaxHeight') > 0 ?
      config.get('ImageConversion.MaxHeight') : Number.MAX_SAFE_INTEGER;
    const height = parseIntWithLimits(req.query.height, 1, maxHeight);
    if (isNaN(height)) {
      return next(new error.BadRequest(`Invalid height. Expected integer between 1 and ${maxHeight}, ` +
        `but received ${req.query.height}.`));
    }
    req.query.height = height;
  }

  if (req.query.crop && !constants.crop.includes(req.query.crop)) {
    return next(new error.BadRequest(`Invalid cropping method, received ${req.query.crop}.`));
  }

  if (req.query.gravity && !constants.gravity.includes(req.query.gravity)) {
    return next(new error.BadRequest(`Invalid gravity, received ${req.query.gravity}.`));
  }

  if (req.query.format && !constants.format.includes(req.query.format)) {
    return next(new error.BadRequest(`Invalid format, received ${req.query.format}.`));
  }

  if (req.query.quality) {
    const quality = parseIntWithLimits(req.query.quality, 1, 100);
    if (isNaN(quality)) {
      return next(new error.BadRequest('Invalid quality. Expected integer between 1 and 100, ' +
        `but received ${req.query.quality}.`));
    } else {
      req.query.quality = quality;
    }
  }

  return next();
}

function parseIntWithLimits(value, min, max) {
  const integer = Number(value);
  if (integer < min || integer > max) {
    return NaN;
  }
  return integer;
}

module.exports = checkParams;
