const hash = require('object-hash');
const fileCache = require('../middleware/fileCache');

function imagePersistence(req, res, next) {
  if(req.completed){
    next();
  }
  
  let queryHash = hash(req.query);
  // console.log('DEBUG: hash', req.query, queryHash);

    console.log('add image to cache', req.query, queryHash);
  fileCache.add(queryHash, req.query.format, req.image);

  res.set('Etag', queryHash);

  next();
}

module.exports = imagePersistence;
