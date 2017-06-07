function checkEtag(req, res, next) {
  let etag = req.get('If-None-Match');
  if (etag) {
    res.set('Etag', etag);
    res.status(304);
    res.end();
  } else {
    next();
  }
}

module.exports = checkEtag;
