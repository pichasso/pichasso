const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const sharp = require('sharp');
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

  if (cache.exists(queryHash)) {
    req.image = cache.load(queryHash);
    return sharp(req.image)
      .metadata()
      .then((metadata) => {
        logger.info(logTag, 'Use file from cache', queryHash);
        req.imageProperties = metadata;
        res.type(metadata.format);
        res.set('Etag', queryHash);
        req.completed = true;
        return next();
      })
      .catch((error) => {
        logger.error(logTag, 'Unable to load file', queryHash, error);
        cache.remove(queryHash);
        return next();
      });
  }

  return next();
}

module.exports = checkCache;
