const config = require('config');
const sharp = require('sharp');
const logger = require('../controllers/logger');
const logTag = '[Convert]';

function convert(req, res, next) {
  if (req.completed) {
    return next();
  }
  let sharpInstance = sharp(req.image);
  let format = req.query.format ? sharp.format[req.query.format] : undefined;
  let quality = req.query.quality;

  let options = {
    quality: quality ? quality : config.get('ImageConversion.DefaultQuality'), // used for webp, jpeg
    progressive: config.get('ImageConversion.Progressive'), // used for jpeg, png
  };

  // auto best format detection
  if (format === undefined) {
    // if webp is accepted, it is set before checking the cache
    if (req.imageProperties.hasAlpha) {
      format = sharp.format['png'];
    } else {
      format = sharp.format['jpeg'];
    }
    logger.info(logTag, 'Set format to', format.id);
  }

  // format conversion & set response type
  if (format.id !== req.imageProperties.format) {
    logger.info(logTag, 'Convert image from', req.imageProperties.format, 'to', format.id);
    sharpInstance
      .toFormat(format, options);
  }
  res.type(format.id);

  sharpInstance.toBuffer()
    .then((buffer) => {
      req.image = buffer;
      return next();
    })
    .catch(error => next(error));
}

module.exports = convert;
