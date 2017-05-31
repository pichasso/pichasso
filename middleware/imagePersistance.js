const hash = require('object-hash');
const fileCache = require('../middleware/fileCache');

function imagePersistance(req, res, next) {
  let queryHash = hash(req.query);
  // console.log('DEBUG: hash', req.query, queryHash);

  fileCache.saveFile(queryHash, req.query.format);

  res.set('Etag', queryHash);

  next();
}

module.exports = imagePersistance;
