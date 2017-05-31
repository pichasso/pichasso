const cache = require('../middleware/fileCache');

function checkCache(req, res, next) {
  let etag = req.get('If-None-Match');
  console.log('etag received', etag);

  if (etag && cache.exists(etag)) {
    // respond with 403 if file exist and has not been changed
    res.set('Etag', etag);
    res.status(304).end();
  } else {
    // check file already has been created

  }
  // otherwise create image
  next();
}

module.exports = checkCache;
