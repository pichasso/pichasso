const config = require('config');
const error = require('http-errors');
const request = require('request');
const spawn = require('child_process').spawn;

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
  let quality = config.get('PDFConversion.DefaultQuality') || 'screen';
  let qualities = ['printer', 'screen'];
  if (req.params.quality && qualities.indexOf(req.params.quality) !== -1) {
    quality = req.params.quality;
  } 

  request({
    url: req.params.file,
    encoding: 'binary',
  }, (err, response, body) => {
    if (!body) {
      return next(new error.InternalServerError('Request failed.'));
    }
    let filename = '';
    let regExp = /filename.?=.?\"(.*)\"/ig;
    if (response.headers['content-disposition'] && response.headers['content-disposition'].match(regExp)) {
      filename = regExp.exec(response.headers['content-disposition'])[0];
    } else {
      let filepath = req.params.file.split('/');
      if (filepath.length) {
        filename = filepath[filepath.length - 1];
      }
    }
    if (!filename.match(/\.pdf/ig)) {
      filename += '.pdf';
    }
    if (filename) {
      req.params.filename = filename;
    }
    let pdfData;
    const args = [
      '-q',
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=pdfwrite',
      `-dPDFSETTINGS=/${quality}`,
      '-dCompabilityLevel=1.4',
      '-sOutputFile=-',
      '-',
    ];
    const gs = spawn('gs', args, { stdio: ['pipe'] });

    gs.on('error', err => next(err));
    gs.on('close', () => {
      req.compressedFile = pdfData;
      next();
    });

    gs.stdout.on('data', (data) => {
      if (!pdfData) {
        pdfData = data;
      } else {
        const newData = Buffer.alloc(pdfData.length + data.length);
        newData.fill(pdfData);
        newData.fill(data, pdfData.length);
        pdfData = newData;
      }
    });
    gs.stdout.on('error', err => next(err));
    gs.stderr.on('error', err => next(err));
    gs.stdin.on('error', err => next(err));

    gs.stdin.end(body, 'binary');
  });
}

module.exports = fileLoader;
