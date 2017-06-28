const error = require('http-errors');
const constants = require('../constants.json');

function checkParams(req, res, next) {
  // console.log("Request: ", req.query);

  if (req.query.hasOwnProperty('width')) {
    let width = parseInt(req.query.width, 1, constants.max-width);
    if (width < 1) {
      return next(new error.BadRequest('Invalid width value. Please insert an integer greater 1'));
    }
    else {
      req.query.width = width;
    }
  }

  if (req.query.hasOwnProperty('height')) {
    let height = parseInt(req.query.height, 1, constants.max-height);
    if (height < 1) {
        return next(new error.BadRequest('Invalid height value. Please insert an integer greater 1'));
    }
    else {
        req.query.height = height;
    }
  }

  if (req.query.hasOwnProperty('crop')) {
    if (constants.crop.indexOf(req.query.crop) === -1) {
      return next(new error.BadRequest('Invalid Cropping value'));
    }
  }

  if (req.query.hasOwnProperty('gravity')) {
    if (constants.crop.indexOf(req.query.gravity) === -1 && !(req.query.gravity === '')) {
      return next(new error.BadRequest('Invalid gravity value'));
    }
  }
  if (req.query.hasOwnProperty('format')) {
    if (constants.format.indexOf(req.query.format) === -1 && !(req.query.format === '')) {
      return next(new error.BadRequest('Invalid format value'));
    }
  }

  if (req.query.hasOwnProperty('quality')) {
    let quality = parseInt(req.query.quality, 0, 100);
    if(quality === -1) {
        return next(new error.BadRequest(`invalid quality ${req.query.quality}, has to be between 1 and 100`));
    }
    else {
      req.query.quality = quality;
    }
  }
  // console.log('Leaving parameter check');
  return next();
}

function parseInt(value, minValue, maxValue) {
  if(!isNaN(value)) {
    let number = parseInt(value);
    if(number > minValue) {
      return (number > maxValue ? number :maxValue);
    }
  }
  return -1;
}

module.exports = checkParams;
