const config = require('config');
const error = require('http-errors');
const request = require('request');
const spawn = require('child_process').spawn;

function fileLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  const quality = req.query.quality ? req.query.quality : config.get('PDFConversion.DefaultQuality');

  request({
    url: req.query.file,
    encoding: 'binary',
  }, (err, response, body) => {
    if (!body) {
      return next(new error.InternalServerError('Request failed. Received empty response.'));
    }
    let filename = '';
    let regExp = /filename.?=.?\"(.*)\"/ig;
    if (response.headers['content-disposition'] && response.headers['content-disposition'].match(regExp)) {
      filename = regExp.exec(response.headers['content-disposition'])[0];
    } else {
      let filepath = req.query.file.split('/');
      if (filepath.length) {
        filename = filepath[filepath.length - 1];
      }
    }
    if (!filename.match(/\.pdf/ig)) {
      filename += '.pdf';
    }
    if (filename) {
      req.query.filename = filename;
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
    const gs = spawn('gs', args, {stdio: ['pipe']});

    gs.on('error', err => next(err));
    gs.on('close', (code) => {
      console.log('Close', code);
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
      console.log('Data', pdfData.length);
    });
    gs.stdout.on('error', err => next(err));
    gs.stderr.on('error', err => next(err));
    gs.stdin.on('error', err => next(err));

    gs.stdin.end(body, 'binary');
  });
}

module.exports = fileLoader;
