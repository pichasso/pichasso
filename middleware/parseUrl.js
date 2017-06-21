const regExp = {
  width: /\/w(?:idth)?_(\w+)/,
  height: /\/h(?:eight)?_(\w+)/,
  crop: /\/c(?:rop)?_(\w+)/,
  gravity: /\/g(?:ravity)?_(\w+)/,
  quality: /\/q(?:uality)?_(\w+)/,
  format: /\/f(?:ormat)?_(\w+)/,
};


function parseUrl(req, res, next) {
  console.log('image', req.params.image);
  req.query.url = req.params.image;

  for (let param in regExp) {
    const match = req.path.match(regExp[param]);
    req.query[param] = match ? match[1] : undefined;
    console.log(param, req.query[param]);
  }

  next();
}

module.exports = parseUrl;
