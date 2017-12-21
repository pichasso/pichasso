const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const logger = require('../controllers/logger');
const logTag = '[CheckCache]';

function checkCache(req, res, next) {
  // generate hash and check if file exists in cache
  // remove authentication information, if exists
  let cleanQuery = {};
  Object.assign(cleanQuery, req.query);
  if (cleanQuery['auth']) {
    delete cleanQuery.auth;
  }
  const queryHash = hash(cleanQuery);
  req.fileHash = queryHash;

  try {
    if (!req.query.nocache && cache.exists(queryHash)) {
      logger.debug(logTag, 'Load data from cache...', queryHash);
      req.file = cache.load(queryHash);
      req.query = cache.metadata(queryHash);
      logger.debug(logTag, 'Metadata', req.query);
      res.set('Etag', `"${queryHash}"`);
      req.completed = true;
    } else {
      logger.debug(logTag, 'Ignore cache because of',
        req.query.nocache ? 'nocache was set' : 'cache miss', 'for',
        queryHash);
    }
  } catch (error) {
    logger.error(logTag, 'Unable to load cached file:', error);
  }


  return next();
}

module.exports = checkCache;
