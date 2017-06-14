const config = require('config');
const error = require('http-errors');
const faceDetection = require('./faceDetection');
const sharp = require('sharp');

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
    height = Number(req.query.height);
    const aspectRatio = req.imageProperties.width / req.imageProperties.height;
    width = Math.ceil(Number(height) / aspectRatio);
  } else if (!req.query.height) {
    width = Number(req.query.width);
    const aspectRatio = req.imageProperties.width / req.imageProperties.height;
    height = Math.ceil(Number(width) / aspectRatio);
  } else {
    width = Number(req.query.width);
    height = Number(req.query.height);
  }

  if (width < 1 || height < 1) {
    return next(new error.BadRequest(`Invalid cropping size ${width}x${height}`));
  }

  const aspectRatio = width / height;
  const crop = req.query.crop || config.get('ImageConversion.DefaultCropping');

  let gravity;
  if (!req.query.gravity) {
    gravity = config.get('ImageConversion.DefaultGravity');
  } else if (req.query.gravity === 'faces') {
    gravity = 'faces';
  } else if (sharp.gravity.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.gravity[req.query.gravity];
  } else if (sharp.strategy.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.strategy[req.query.gravity];
  } else {
    return next(new error.BadRequest(`Invalid gravity ${req.query.gravity}`));
  }

  return cropImage(req, width, height, aspectRatio, crop, gravity)
    .then(sharpInstance =>
      sharpInstance.toBuffer()
        .then((buffer) => {
          req.image = buffer;
          return next();
        })
    )
    .catch(error => next(error));
}

function cropImage(req, width, height, aspectRatio, crop, gravity) {
  return new Promise((resolve, reject) => {
    const sharpInstance = sharp(req.image);

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
          reject(new error.BadRequest(`Invalid cropping method ${crop}`));
        }
    }
  });
}

function cropFill(sharpInstance, req, width, height, aspectRatio, gravity) {
  if (gravity === 'faces') {
    return faceDetection(req.image, width, height)
      .then(region =>
        sharpInstance
          .extract(region)
          .resize(width, height)
      );
  }

  const imgAspectRatio = req.imageProperties.width / req.imageProperties.height;
  let fillWidth,
    fillHeight;
  if (imgAspectRatio >= aspectRatio) {
    fillWidth = Math.ceil(aspectRatio * height);
    fillHeight = height;
  } else {
    fillWidth = width;
    fillHeight = Math.ceil(width / imgAspectRatio);
  }

  return sharpInstance
    .resize(fillWidth, fillHeight)
    .max()
    .resize(width, height)
    .crop(gravity);
}

module.exports = resize;
