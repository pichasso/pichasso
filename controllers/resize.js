const sharp = require('sharp');
const probe = require('probe-image-size');

function resize(req, res, next) {
  if (!req.query.width && !req.query.height) {
    next();
  }

  const width = Number(req.query.width);
  const height = Number(req.query.height);
  const aspectRatio = width / height;
  const crop = req.query.crop || 'fill';

  let gravity;
  if (!req.query.gravity) {
    gravity = sharp.gravity.center;
  } else if (sharp.gravity.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.gravity[req.query.gravity];
  } else if (sharp.strategy.hasOwnProperty(req.query.gravity)) {
    gravity = sharp.strategy[req.query.gravity];
  } else {
    res.render(
      'error',
      {error: new Error(`invalid gravity ${req.query.gravity}`)}
    );
    return;
  }

  let sharpInstance = sharp(req.image);

  switch (crop) {
    case 'fill': {
      const imgProperties = probe.sync(req.image);
      const imgAspectRatio = imgProperties.width / imgProperties.height;
      let fillWidth, fillHeight;
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
    case 'fit': {
      sharpInstance
        .resize(width, height)
        .max();
      break;
    }
    case 'scale': {
      sharpInstance
        .resize(width, height)
        .ignoreAspectRatio();
      break;
    }
    default: {
      res.render(
        'error',
        {error: new Error(`invalid cropping method ${crop}`)}
      );
      return;
    }
  }

  sharpInstance.toBuffer()
    .then((buffer) => {
      req.image = buffer;
      next();
    })
    .catch((error) => {
      res.render('error', {error: error});
    });
}

module.exports = resize;
