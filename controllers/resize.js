const config = require('config');
const error = require('http-errors');
const faceDetection = require('./faceDetection');
const sharp = require('sharp');
const logger = require('../controllers/logger');
const logTag = '[Resize]';

function resize(req, res, next) {
  if (req.completed) {
    return next();
  }

  let width;
  let height;
  if (!req.query.width && !req.query.height) {
    width = req.imageProperties.width;
    height = req.imageProperties.height;
  } else if (!req.query.width) {
    height = req.query.height;
    width = Math.ceil(height * req.imageProperties.aspectRatio);
  } else if (!req.query.height) {
    width = req.query.width;
    height = Math.ceil(width / req.imageProperties.aspectRatio);
  } else {
    width = req.query.width;
    height = req.query.height;
  }

  let defaultCropping = config.get('ImageConversion.DefaultCropping');
  let defaultGravity = config.get('ImageConversion.DefaultGravity');
  // override image conversion configuration defaults if thumbnail
  if (req.baseUrl.startsWith('/thumbnail')) {
    if (config.has('Thumbnail.OverrideImageConversion.DefaultCropping')) {
      defaultCropping = config.get('Thumbnail.OverrideImageConversion.DefaultCropping');
    }
    if (config.has('Thumbnail.OverrideImageConversion.DefaultGravity')) {
      defaultGravity = config.get('Thumbnail.OverrideImageConversion.DefaultGravity');
    }
  }

  const aspectRatio = width / height;
  const crop = req.query.crop || defaultCropping;

  let gravity;
  if (!req.query.gravity) {
    gravity = defaultGravity;
    logger.debug(logTag, 'Use default gravity', gravity);
  } else if (sharp.gravity[req.query.gravity]) {
    gravity = sharp.gravity[req.query.gravity];
  } else if (sharp.strategy[req.query.gravity]) {
    gravity = sharp.strategy[req.query.gravity];
  } else {
    gravity = req.query.gravity;
  }

  logger.debug(logTag, 'Resize dimensions', width, height);
  logger.debug(logTag, 'Gravity', gravity);
  logger.debug(logTag, 'Cropping method', crop);

  return cropImage(req, width, height, aspectRatio, crop, gravity)
    .then((sharpInstance) => {
      req.sharpInstance = sharpInstance;
      return next();
    }).catch(error => next(error));
}

function cropImage(req, width, height, aspectRatio, crop, gravity) {
  return new Promise((resolve, reject) => {
    const sharpInstance = req.sharpInstance || sharp(req.file);

    switch (crop) {
      case 'fill':
      {
        resolve(cropFill(sharpInstance, req, width, height, aspectRatio, gravity));
        break;
      }
      case 'fit':
      {
        resolve(sharpInstance
          .resize(width, height)
          .max()
        );
        break;
      }
      case 'scale':
      {
        resolve(sharpInstance
          .resize(width, height)
          .ignoreAspectRatio()
        );
        break;
      }
      default:
      {
        logger.error(logTag, 'Invalid cropping method', gravity);
        reject(new error.BadRequest(`Invalid cropping method ${crop}`));
      }
    }
  });
}

function cropFill(sharpInstance, req, width, height, aspectRatio, gravity) {
  if (gravity === 'faces') {
    return faceDetection(req.file, width, height)
      .then((result) => {
        if (result.detectedFaces) {
          return sharpInstance
            .extract(result.region)
            .resize(width, height);
        } else {
          // fallback to shannon entropy
          gravity = sharp.strategy['entropy'];
          logger.verbose(logTag, 'Fallback to Gravity', gravity);
          return fillImage(sharpInstance, req, width, height, aspectRatio, gravity);
        }
      });
  } else {
    return fillImage(sharpInstance, req, width, height, aspectRatio, gravity);
  }
}

function fillImage(sharpInstance, req, width, height, aspectRatio, gravity) {
  let fillWidth,
    fillHeight;
  if (req.imageProperties.aspectRatio >= aspectRatio) {
    fillWidth = Math.ceil(aspectRatio * height);
    fillHeight = height;
  } else {
    fillWidth = width;
    fillHeight = Math.ceil(width / req.imageProperties.aspectRatio);
  }

  return sharpInstance
    .resize(fillWidth, fillHeight)
    .max()
    .resize(width, height)
    .crop(gravity);
}

module.exports = resize;
