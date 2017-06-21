const error = require('http-errors');
const constants = require('../constants.json');

function checkParams(req, res, next) {
  // console.log("Request: ", req);
  console.log("Request: ", req.query);

  if(req.query.hasOwnProperty('width')) {

      if(req.query.width < 1){
          console.log("Invalid width value");
          return next(new error.BadRequest('Invalid width value'));
      }
  }

  if(req.query.hasOwnProperty('height')) {

        if(req.query.height < 1){
            console.log("Invalid height value");
            return next(new error.BadRequest('Invalid height value'));
        }
    }

    console.log("Here", constants.crop);
    if(req.query.hasOwnProperty('crop')) {
        console.log("Crop is set");
        if(constants.crop.indexOf(req.query.crop)  <= 0 ){
            console.log("Invalid Cropping value");
            return next(new error.BadRequest('Invalid Cropping value'));
        }
    }
  console.log("Leaving paramater check");
  return next();
}

module.exports = checkParams;
