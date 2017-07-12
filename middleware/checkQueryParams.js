const config = require('config');
const constants = require('../constants.json');
const error = require('http-errors');

function checkQueryParams(req, res, next) {
  if (!req.query.file) {
    return next(new error.BadRequest('Undefined file.'));
  }

  /**
   * Check resource parameter
   */

  if (req.query.file.match(/:\/\//)) {
    // assume we got an url, check for validity
    if (!config.get('ImageSource.LoadExternalData.Enabled')) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }

    const allowedProtocols = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (!allowedProtocols.some(each => req.query.file.match(`^${each}:\/\/`))) {
      return next(new error.BadRequest('Protocol not allowed.'));
    }

    const whitelistRegex = config.get('ImageSource.LoadExternalData.WhitelistRegex');
    if (whitelistRegex.length > 0) {
      const whitelisted = whitelistRegex.some(regex => req.query.file.match(regex));
      if (!whitelisted) {
        return next(new error.BadRequest('Domain source not allowed.'));
      }
    }
  } else {
    // assume id in file, create url with given id
    if (!config.get('ImageSource.LoadById.Enabled')) {
      return next(new error.BadRequest('Loading data by id has been disabled.'));
    }

    const sourcePath = config.get('ImageSource.LoadById.SourcePath');
    req.query.file = sourcePath.replace(/{id}/gi, req.query.file);
  }

  /**
   * Check image specific params
   */

  if (/^\/image/.test(req.baseUrl)) {
    const maxEdgeLength = config.get('ImageConversion.MaxEdgeLength') > 0 ?
    config.get('ImageConversion.MaxEdgeLength') : Number.MAX_SAFE_INTEGER;

    if (req.query.width) {
      const width = parseIntWithLimits(req.query.width, 1, maxEdgeLength);
      if (isNaN(width)) {
        return next(new error.BadRequest(`Invalid width. Expected integer between 1 and ${maxEdgeLength}, ` +
          `but received ${req.query.width}.`));
      }
      req.query.width = width;
    }

    if (req.query.height) {
      const height = parseIntWithLimits(req.query.height, 1, maxEdgeLength);
      if (isNaN(height)) {
        return next(new error.BadRequest(`Invalid height. Expected integer between 1 and ${maxEdgeLength}, ` +
          `but received ${req.query.height}.`));
      }
      req.query.height = height;
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

    if (req.query.crop && !constants.crop.includes(req.query.crop)) {
      return next(new error.BadRequest(`Invalid cropping method, received ${req.query.crop}.`));
    }

    if (req.query.gravity && !constants.gravity.includes(req.query.gravity)) {
      return next(new error.BadRequest(`Invalid gravity, received ${req.query.gravity}.`));
    }

    if (req.query.format && !constants.format.includes(req.query.format)) {
      return next(new error.BadRequest(`Invalid format, received ${req.query.format}.`));
    }
  }

  /**
   * Check PDF specific params
   */

  if (/^\/pdf/.test(req.baseUrl)) {
    if (req.query.quality) {
      const acceptedQualities = ['printer', 'screen'];
      if (!acceptedQualities.includes(req.query.quality)) {
        return next(new error.BadRequest(`Invalid quality. Expected one of ${acceptedQualites.join(', ')}, ` +
          `but received ${req.query.quality}.`));
      }
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

module.exports = checkQueryParams;
