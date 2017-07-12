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
  let quality = config.get('ImageSource.LoadExternalData.WhitelistRegex') || 'screen';
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
    console.log('Download success.', body.length);
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
    const gs = spawn('gs', args, {stdio: ['pipe']});

    gs.on('error', err => next(err));
    gs.on('close', () => {
      console.log('Close', pdfData.length);
      req.compressedFile = pdfData;
      next();
    });

    gs.stdout.on('data', (data) => {
      if (!pdfData) {
        console.log('Init buffer');
        pdfData = data;
      } else {
        console.log('Copy buffer');
        const newData = Buffer.alloc(pdfData.length + data.length);
        newData.fill(pdfData);
        newData.fill(data, pdfData.length);
        pdfData = newData;
      }
      console.log(pdfData.length);
    });
    gs.stdout.on('error', (err) => {
      console.log('stdout error');
      next(err);
    });

    gs.stderr.on('data', (data) => {
      console.log(data.toString());
    });
    gs.stderr.on('error', (err) => {
      console.log('stderr error');
      next(err);
    });

    gs.stdin.end(body, 'binary');
    gs.stdin.on('error', (err) => {
      console.log('stdin error');
      next(err);
    });
  });
}

module.exports = fileLoader;
