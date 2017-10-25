const fileCache = require('../middleware/fileCache');
const logger = require('../controllers/logger');
const logTag = '[FilePersistence]';

function filePersistence(req, res, next) {
  if (req.completed) {
    return next();
  }

  fileCache.add(req.fileHash, req.file, req.query);
  logger.info(logTag, 'Save request', JSON.stringify(req.query), 'with hash', req.fileHash);

  res.set('Etag', `"${req.fileHash}"`);

  return next();
}

module.exports = filePersistence;
