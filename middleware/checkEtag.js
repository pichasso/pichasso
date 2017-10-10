const logger = require('../controllers/logger');
const logTag = '[CheckEtag]';
const cache = require('../middleware/fileCache');

function checkEtag(req, res, next) {
  let etag = req.get('If-None-Match');
  const hash = etag ? etag.substr(1, etag.length - 2) : null;
  if (hash && cache.valid(hash)) {
    logger.verbose(logTag, 'Respond with etag');
    res.set('Etag', `"${hash}"`);
    res.status(304);
    res.end();
  } else {
    next();
  }
}

module.exports = checkEtag;
