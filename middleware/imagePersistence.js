const fileCache = require('../middleware/fileCache');
const logger = require('../controllers/logger');
const logTag = '[ImagePersistence]';

function imagePersistence(req, res, next) {
  if (req.completed) {
    return next();
  }

  let queryHash = req.fileHash;

  fileCache.add(queryHash, req.image, req.query);
  logger.info(logTag, 'Save request', JSON.stringify(req.query), 'with hash', queryHash);

  res.set('Etag', queryHash);

  return next();
}

module.exports = imagePersistence;
