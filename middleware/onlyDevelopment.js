const error = require('http-errors');

function onlyDevelopment(req, res, next) {
  if (req.app.get('env') !== 'development') {
    return next(new error.Forbidden());
  }
  return next();
}

module.exports = onlyDevelopment;
