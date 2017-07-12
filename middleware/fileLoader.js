const config = require('config');
const error = require('http-errors');
var request = require('request');
var gs = require('node-gs');

function fileLoader(req, res, next) {
  if (req.completed) {
    return next();
  }
  if (!req.params || !req.params.file) {
    return next(new error.NotFound('Missing file parameter.'));
  }
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
  }

  // check quality
  let quality = config.get('ImageSource.LoadExternalData.WhitelistRegex') || 'screen';
  let qualities = ['printer', 'screen'];
  if (req.params.quality && qualities.indexOf(req.params.quality) !== -1) {
    quality = req.params.quality;
  }
  quality = '-dPDFSETTINGS=/' + quality;

  console.log('downloading...', req.params.file);
  request(
    {
      method: 'GET',
      encoding: null,
      url: req.params.file,
    },
    function (err, resp, body) {
      if (err) {
        console.log('error downloding pdf file', req.params.file, err);
        return next(new error.NotFound('Could not load given file.'));
      } else {
        console.log('downloaded file... ok');
      }
      gs()
        .batch()
        // .nopause()
        .output('-') // do only write to stdout
        .device('pdfwrite') // target writer / format
        .option(quality)
        .option('-dCompatibilityLevel=1.4')
        .option('-q') // quite mode to write file only to stdout without log data
        .exec(body, function (err, data, stderr) {
          if (stderr) {
            console.log(stderr);
          }
          let sizeBefore = body ? body.length : 0;
          let sizeCompressed = data ? data.length : 0;
          if (err || sizeBefore === 0 || sizeCompressed === 0) {
            console.log('pdf compression failed:', err);
            return next(new error.InternalServerError('Compression failed.'));
          }
          let compressionRatio = sizeCompressed / sizeBefore;
          console.log('compressed', req.params.file, 'from size', sizeBefore, 'to', sizeCompressed,
            'with setting', quality, 'ratio', compressionRatio, '%');
          req.compressedFile = data;
          return next();
        });
    });
}

module.exports = fileLoader;
