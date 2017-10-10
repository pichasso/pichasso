const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const logger = require('../controllers/logger');
const logTag = '[CheckCache]';

function checkCache(req, res, next) {
  // generate hash and check if image exists in cache
  const queryHash = hash(req.query);
  req.fileHash = queryHash;

  try {
    if (cache.exists(queryHash)) {
      req.file = cache.load(queryHash);
      req.query = cache.metadata(queryHash);
      logger.debug(logTag, 'Metadata', req.query);
      res.set('Etag', `"${queryHash}"`);
      req.completed = true;
    }
  } catch (error) {
    logger.error(logTag, 'Unable to load cached file:', error);
  }


  return next();
}

module.exports = checkCache;
