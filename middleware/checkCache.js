const cache = require('../middleware/fileCache');
const hash = require('object-hash');

function checkCache(req, res, next) {
  console.log('check cache')
  // generate hash and check if image exists
  let accept = req.get('accept');
  if (!req.query.format && /image\/webp/.test(accept)) {
    req.query.format = 'webp';
  }

  let queryHash = hash(req.query);

  if (cache.exists(queryHash)) {
    req.image = cache.load(queryHash, function(err){
      next(err);
    });
      res.set('Etag', queryHash);
    req.completed = true;
  } 
    next();
  
}

module.exports = checkCache;
