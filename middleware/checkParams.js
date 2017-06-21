const error = require('http-errors');

function checkParams(req, res, next) {
  // console.log("Request: ", req);
  console.log("Request: ", req.query);

  if(req.hasOwnProperty('query.width')) {

      if(req.query.width < 1){
          console.log("Invalid width value");
          return next(new error.BadRequest('Invalid width value'));
      }
  }

  if(req.hasOwnProperty('query.height')) {

        if(req.query.height < 1){
            console.log("Invalid height value");
            return next(new error.BadRequest('Invalid height value'));
        }
    }


  // console.log("Result: ", res);
  return next();
}

module.exports = checkParams;
