const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const sharp = require('sharp');

function checkCache(req, res, next) {
  // generate hash and check if image exists in cache
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
    req.query.format = 'webp';
  }

  const queryHash = hash(req.query);

  if (cache.exists(queryHash)) {
    req.image = cache.load(queryHash);
    return sharp(req.image)
      .metadata()
      .then((metadata) => {
        req.imageProperties = metadata;
        res.type(metadata.type);
        res.set('Etag', queryHash);
        req.completed = true;
        return next();
      })
      .catch(() => {
        console.error('error loading file from cache', queryHash);
        cache.remove(queryHash);
        return next();
      });
  }

  return next();
}

module.exports = checkCache;
