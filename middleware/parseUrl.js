
function parseUrl(req, res, next) {
  console.log('image', req.originalUrl);

  if (req.query.url) {
    return next();
  }

  let path = req.originalUrl;

  req.query.url = decodeURIComponent(/^\/image\/([^\/]*)/g.exec(path)[1]);

  let params = {},
    rx = /(\w+)_(\w+)/g;

  let queries = path.substring(path.indexOf(req.query.url) + req.query.url.length, path.length);

  while ((M = rx.exec(queries)) != null) {
    params[M[1]] = M[2];
  }

  if (Object.keys(params).length) {
    Object.assign(req.query, params);
  }

  next();
}

module.exports = parseUrl;
