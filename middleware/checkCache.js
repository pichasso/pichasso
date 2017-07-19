const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const logger = require('../controllers/logger');
const logTag = '[CheckCache]';

function checkCache(req, res, next) {
  // generate hash and check if image exists in cache
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
    logger.verbose(logTag, 'Client accepts webp');
    req.query.format = 'webp';
  }

  const queryHash = hash(req.query);
  req.fileHash = queryHash;

  try {
    if (cache.exists(queryHash)) {
      req.image = cache.load(queryHash);
      req.query = cache.metadata(queryHash);
      res.type(req.query.format);
      res.set('Etag', queryHash);
      req.completed = true;
    }
  } catch (error) {
    logger.error(logTag, 'error loading cached file', error);
  }


  return next();
}

module.exports = checkCache;
