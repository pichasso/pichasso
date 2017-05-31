const cache = require('../middleware/fileCache');

function checkEtag(req, res, next) {
  let etag = req.get('If-None-Match');
  // console.log('DEBUG: Etag received', etag);

  if (etag && cache.exists(etag)) {
    // respond with 304 if file exist and has not been changed
    res.set('Etag', etag);
    res.status(304);
    res.end();
  } else {
    next();
  }
}

module.exports = checkEtag;
