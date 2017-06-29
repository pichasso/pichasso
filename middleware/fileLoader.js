const config = require('config');
const error = require('http-errors');
var request = require('request');
var gs = require('node-gs');

function fileLoader(req, res, next) {
  if (req.completed) {
    return next();
  }
  let quality = 'screen';
  // todo move to parameter test
  if (req.params.file.indexOf('://') === -1) {
    // assume id in url, create url with given id
    if (config.get('ImageSource.LoadById.Enabled') !== true) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }
    let sourcePath = config.get('ImageSource.LoadById.SourcePath');
    if (!sourcePath) {
      return next(new error.InternalServerError('ImageSource.LoadById.SourcePath not defined.'));
    }
    req.query.url = sourcePath.replace(/{id}/gi, req.params.file);
  } else {
    // assume we got an url, check for validity
    if (config.get('ImageSource.LoadExternalData.Enabled') !== true) {
      return next(new error.BadRequest('Loading external data has been disabled.'));
    }
    // check protocol filter
    let allowedProtocols = config.get('ImageSource.LoadExternalData.ProtocolsAllowed');
    if (!allowedProtocols) {
      return next(new error.InternalServerError('ImageSource.LoadExternalData.ProtocolsAllowed not defined.'));
    }
    let protocolAllowed = allowedProtocols.filter(function (protocol) {
      return req.params.file.indexOf(protocol) === 0;
    });
    if (!protocolAllowed) {
      return next(new error.BadRequest('Protocol not allowed.'));
    }
    // check url whitelist
    let whitelistRegex = config.get('ImageSource.LoadExternalData.WhitelistRegex');
    if (whitelistRegex.length) {
      let whitelisted = whitelistRegex.some(function (regex) {
        return req.params.file.match(regex);
      });
      if (!whitelisted) {
        return next(new error.BadRequest('Domain source not allowed.'));
      }
    }
    // check quality
    let qualities = ['printer', 'screen'];
    if (req.params.quality && qualities.indexOf(req.params.quality) !== -1) {
      quality = req.params.quality;
    }
    quality = '-dPDFSETTINGS=/' + quality;
  }
  request(
    {
      method: 'GET',
      encoding: null,
      url: req.params.file,
    },
    function (error, resp, body) {
      if (error) {
        console.log(error);
        return next(new error.NotFound());
      }
      gs()
        .batch()
        .output('-') // do only write to stdout
        .device('pdfwrite') // target writer / format
        .option(quality)
        .option('-q') // quite mode to write only file to stdout
        .exec(body, function (error, stdout /* ,stderr*/) {
          console.log('compressed', req.params.file, 'length', stdout ? stdout.length : 0, 'quality', quality);
          if (error) {
            console.log(' - failed:', error);
            return next(new error.NotFound());
          }
          req.compressedFile = stdout;
          return next();
        });
    });
}

module.exports = fileLoader;
