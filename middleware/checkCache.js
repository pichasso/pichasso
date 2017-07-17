const cache = require('../middleware/fileCache');
const hash = require('object-hash');

function checkCache(req, res, next) {
  // generate hash and check if image exists in cache
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
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
    console.log('error loading cached file', error);
  }


  return next();
}

module.exports = checkCache;
