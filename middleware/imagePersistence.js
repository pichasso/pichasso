const hash = require('object-hash');
const fileCache = require('../middleware/fileCache');

function imagePersistence(req, res, next) {
  if (req.completed) {
    return next();
  }

  let queryHash = req.fileHash;

  fileCache.add(queryHash, req.image, req.query);

  res.set('Etag', queryHash);

  return next();
}

module.exports = imagePersistence;
