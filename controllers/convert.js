const sharp = require('sharp');

function convert(req, res, next) {
  let sharpInstance = sharp(req.image);
  let format = req.query.format ? sharp.format[req.query.format] : undefined;
  let quality = Number(req.query.quality); // used for webp, jpeg
  let progressive = true; // used for jpeg, png
  let options = {
    quality: quality > 0 ? quality : 80, // todo default from config
    progressive: progressive // todo from config
  };

  // auto best format detection
  if (format === undefined) {
    if (req.accepts('image/webp')) {
      format = sharp.format['webp'];
    } else {
      if (sharpInstance.hasAlpha) {
        format = sharp.format['png'];
      } else {
        format = sharp.format['jpeg'];
      }
    }
  }

  // format conversion & set response type
  if (format.id !== req.imageProperties.type) {
    sharpInstance
      .toFormat(format, options);
    res.type(format.id);
  } else {
    res.type(req.imageProperties.mime);
  }

  sharpInstance.toBuffer()
    .then((buffer) => {
      req.image = buffer;
      next();
    })
    .catch((error) => {
      res.render('error', {
        error: error
      });
    });
}

module.exports = convert;
