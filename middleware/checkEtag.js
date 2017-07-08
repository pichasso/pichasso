const logger = require('../controllers/logger');
const logTag = '[CheckEtag]';

function checkEtag(req, res, next) {
  let etag = req.get('If-None-Match');
  if (etag) {
    logger.verbose(logTag, 'Respond with etag');
    res.set('Etag', etag);
    res.status(304);
    res.end();
  } else {
    next();
  }
}

module.exports = checkEtag;
