const hash = require('object-hash');
const fileCache = require('../middleware/fileCache');
const logger = require('../controllers/logger');
const logTag = '[ImagePersistence]';

function imagePersistence(req, res, next) {
  if (req.completed) {
    return next();
  }

  let queryHash = hash(req.query);
  logger.info(logTag, 'Save request', JSON.stringify(req.query), 'with hash', queryHash);
  fileCache.add(queryHash, req.query.format, req.image);
  res.set('Etag', queryHash);

  return next();
}

module.exports = imagePersistence;
