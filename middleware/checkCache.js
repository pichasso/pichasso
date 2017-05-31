const cache = require('../middleware/fileCache');
const hash = require('object-hash');

function checkCache(req, res, next) {
  // generate hash and check if image exists
  // FIXME: req.accepts('image/webp') does not work
  if (!!req.accepts('image/webp') && !req.query.format) {
    req.query.format = 'webp';
  }

  let queryHash = hash(req.query);
  // console.log('DEBUG: hash', req.query, queryHash);

  // FIXME: cache.exists() does not work
  if (cache.exists(queryHash)) {
    next(); // TODO: return image instead
  } else {
    // otherwise create image
    next();
  }
}

module.exports = checkCache;
