function loadParamsFromQuery(req, res, next) {
  if (Object.keys(req.query).length) {
    Object.assign(req.params, req.query);
  }
  return next();
}

module.exports = loadParamsFromQuery;
