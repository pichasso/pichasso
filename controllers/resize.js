const sharp = require('sharp');
const probe = require('probe-image-size');
const config = require('config');

function resize(req, res, next) {
  let width;
  let height;
  if (!req.query.width && !req.query.height) {
    const properties = probe.sync(req.image);
    width = properties.width;
    height = properties.height;
  } else if (!req.query.width) {
    height = Number(req.query.height);
    const properties = probe.sync(req.image);
    const aspectRatio = properties.width / properties.height;
    width = Math.ceil(Number(height) / aspectRatio);
  } else if (!req.query.height) {
    width = Number(req.query.width);
    const properties = probe.sync(req.image);
    const aspectRatio = properties.width / properties.height;
    height = Math.ceil(Number(width) / aspectRatio);
  } else {
    width = Number(req.query.width);
    height = Number(req.query.height);
  }

  if (width < 1 || height < 1) {
    return res.status(400).send(`invalid cropping size ${width}x${height}`);
  }

  const aspectRatio = width / height;
  const crop = req.query.crop || config.get('ImageConversion.DefaultCropping');

  let gravity;
  if (!req.query.gravity) {
    gravity = config.get('ImageConversion.DefaultGravity');
  } else if (sharp.gravity.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.gravity[req.query.gravity];
  } else if (sharp.strategy.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.strategy[req.query.gravity];
  } else {
    return res.status(400).send(`invalid gravity ${req.query.gravity}`);
  }

  let sharpInstance = sharp(req.image);

  switch (crop) {
    case 'fill':
      {
        const imgProperties = req.imageProperties;
        const imgAspectRatio = imgProperties.width / imgProperties.height;
        let fillWidth,
          fillHeight;
        if (imgAspectRatio >= aspectRatio) {
          fillWidth = Math.ceil(aspectRatio * height);
          fillHeight = height;
        } else {
          fillWidth = width;
          fillHeight = Math.ceil(width / imgAspectRatio);
        }
        sharpInstance
        .resize(fillWidth, fillHeight)
        .max()
        .resize(width, height)
        .crop(gravity);
        break;
      }
    case 'fit':
      {
        sharpInstance
        .resize(width, height)
        .max();
        break;
      }
    case 'scale':
      {
        sharpInstance
        .resize(width, height)
        .ignoreAspectRatio();
        break;
      }
    default:
      {
        return res.status(400).send(`invalid cropping method ${crop}`);
      }
  }

  sharpInstance.toBuffer()
    .then((buffer) => {
      req.image = buffer;
      next();
    })
    .catch(error => next(error));
}

module.exports = resize;
