const error = require('http-errors');
const constants = require('../constants.json');

function checkParams(req, res, next) {
  // console.log("Request: ", req.query);

  if(req.query.hasOwnProperty('width')) {

      if(req.query.width < 1){
          return next(new error.BadRequest('Invalid width value'));
      }
  }

  if(req.query.hasOwnProperty('height')) {

        if(req.query.height < 1){
            console.log("Invalid height value");
            return next(new error.BadRequest('Invalid height value'));
        }
  }

    if(req.query.hasOwnProperty('crop')) {
        console.log("Crop is set");
        if(constants.crop.indexOf(req.query.crop) < 0 ) {
            console.log("Invalid Cropping value");
            return next(new error.BadRequest('Invalid Cropping value'));
        }
    }

    if(req.query.hasOwnProperty('gravity')) {
      if (constants.crop.indexOf(req.query.gravity) < 0 && !(req.query.gravity === '')) {
          return next(new error.BadRequest('Invalid gravity value'));
      }
    }
  if (req.query.hasOwnProperty('format')) {
    if (constants.format.indexOf(req.query.format) < 0 && !(req.query.format === '')) {
      return next(new error.BadRequest('Invalid format value'));
    }
  }

  if (req.query.hasOwnProperty('quality')) {
      if (req.query.quality < 0 || req.query.quality > 100) {
          return next(new error.BadRequest('Invalid quality value'));
      }
  }
  console.log("Leaving paramater check");
  return next();
}

module.exports = checkParams;
