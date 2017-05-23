const sharp = require('sharp');

function resize(req, res, next) {
  if (!req.query.width && !req.query.height) {
    next();
  }

  const width = Number(req.query.width);
  const height = Number(req.query.height);

  sharp(req.image)
    .resize(width, height)
    .max()
    .toBuffer()
    .then((buffer) => {
      req.image = buffer;
      next();
    })
    .catch((error) => {
      res.render('error', {error: error});
    });
}

module.exports.resize = resize;
