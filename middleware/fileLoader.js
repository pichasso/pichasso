const config = require('config');
const error = require('http-errors');
var request = require('request');
var gs = require('node-gs');
var fs = require('fs');

function fileLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

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
  }
  request({ method: 'GET', encoding: null, url: req.params.file }, function (err, resp, body) {
    gs()
      // .option('-sDEVICE=pdfwrite')
      // .option('-dPDFSETTINGS=/printer') // other options: /printer /ebook /screen
      .batch()
      .output('-')
      .device('pdfwrite') // target writer / format
      .option('-dPDFSETTINGS=/printer') // other basic compression options: /printer /ebook /screen
      //.option('-r150') // image resolution
      .option('-q') // quite mode to write only file to stdout
      //.option('-o')
      .on('data', function (data) {
        //console.log('[sg] Data:', data.toString());
      })
      .exec(body, function (error, stdout, stderr) {
        if (error) {
          console.log(error);
          return next(error)
        } else {
          console.log('done piping', req.params.file);
          console.log('size of pdf', stdout.length);
          req.compressedFile = stdout;
          return next();
        }
      });
  });
}

module.exports = fileLoader;
