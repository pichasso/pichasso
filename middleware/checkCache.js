const cache = require('../middleware/fileCache');
const hash = require('object-hash');
const probe = require('probe-image-size');

function checkCache(req, res, next) {
  console.log('check cache')
  // generate hash and check if image exists
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
    req.query.format = 'webp';
  }

  let queryHash = hash(req.query);
    console.log('check cache for', req.query, queryHash);

  if (cache.exists(queryHash)) {
    req.image = cache.load(queryHash);
    req.imageProperties = probe.sync(req.image);
    if (!req.imageProperties) {
        return res.status(400).send('The requested file is not an image.');
      }
        res.type(req.imageProperties.type);
      res.set('Etag', queryHash);
    req.completed = true;
  } 
    next();
  
}

module.exports = checkCache;
