const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const probe = require('probe-image-size');

function checkCache(req, res, next) {
  // generate hash and check if image exists in cache
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
    req.query.format = 'webp';
  }

  let queryHash = hash(req.query);

  if (cache.exists(queryHash)) {
    req.image = cache.load(queryHash);
    req.imageProperties = probe.sync(req.image);
    if (!req.imageProperties) {
      console.log('error loading file from cache', queryHash);
      cache.remove(queryHash);
      return next();
    }
    res.type(req.imageProperties.type);
    res.set('Etag', queryHash);
    req.completed = true;
  }
  return next();
}

module.exports = checkCache;
