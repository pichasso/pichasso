const sharp = require('sharp');

function convert(req, res, next) {
  let sharpInstance = sharp(req.image);
  let format = req.query.format ? sharp.format[req.query.format] : undefined;
  if (format !== undefined && format.id !== req.imageProperties.type) {
    sharpInstance
      .toFormat(format);
    sharpInstance.toBuffer()
      .then((buffer) => {
        req.image = buffer;
        res.type(format.id);
        next();
      })
      .catch((error) => {
        res.render('error', {
          error: error
        });
      });
  } else {
    res.type(req.imageProperties.mime);
    next();
  }
}

module.exports = convert;
