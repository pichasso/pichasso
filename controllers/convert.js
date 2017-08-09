const config = require('config');
const sharp = require('sharp');
const logger = require('../controllers/logger');
const logTag = '[Convert]';

function convert(req, res, next) {
  if (req.completed) {
    return next();
  }
  let sharpInstance = sharp(req.file);
  let format = req.query.format ? sharp.format[req.query.format] : undefined;
  let quality = req.query.quality;

  let options = {
    quality: quality ? quality : config.get('ImageConversion.DefaultQuality'), // used for webp, jpeg
    progressive: config.get('ImageConversion.Progressive'), // used for jpeg, png
  };

  // auto best format detection
  if (format === undefined) {
    // if webp is accepted, it is set during the parameter check
    if (req.imageProperties.hasAlpha) {
      req.query.format = 'png';
      format = sharp.format['png'];
    } else {
      req.query.format = 'jpeg';
      format = sharp.format['jpeg'];
    }
    logger.info(logTag, 'Set format to', format.id);
  }

  // format conversion
  if (format.id !== req.imageProperties.format
    || config.get('ImageConversion.Progressive')) {
    logger.info(logTag, 'Convert image from', req.imageProperties.format, 'to', format.id);
    return sharpInstance
      .toFormat(format, options)
      .toBuffer()
      .then((buffer) => {
        req.file = buffer;
        return next();
      })
      .catch(error => next(error));
  }

  next();
}

module.exports = convert;
