const config = require('config');
const error = require('http-errors');
const request = require('request');
const spawn = require('child_process').spawn;

function pdfLoader(req, res, next) {
  if (req.completed) {
    return next();
  }

  const quality = req.query.quality ? req.query.quality : config.get('PDFConversion.DefaultQuality');
  const dpi = quality === 'screen' ? 72 : 300;

  let r = request({
    url: req.query.file,
    encoding: 'binary',
  }, (err, response, body) => {
    if (err) {
      if (err.code === 'ENOTFOUND') {
        return next(new error.NotFound('Request failed.'));
      } else {
        return next(new error.BadRequest(`Request failed: ${err.message}`));
      }
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
    // https://stackoverflow.com/questions/10450120/optimize-pdf-files-with-ghostscript-or-other#10453202
    const args = [
      '-dQUIET',
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=pdfwrite',
      '-dCompabilityLevel=1.4',
      '-dCompressFonts=true',
      '-dConvertCMYKImagesToRGB=true',
      '-dDetectDuplicateImages=true',
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      `-dColorImageResolution=${dpi}`,
      `-dGrayImageResolution=${dpi}`,
      `-dMonoImageResolution=${dpi}`,
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
    gs.stdout.on('error', err => next(new error.InternalServerError(`Compression failed: ${err.message}`)));
    gs.stderr.on('error', err => next(new error.InternalServerError(`Compression failed: ${err.message}`)));
    gs.stdin.on('error', err => next(new error.InternalServerError(`Compression failed: ${err.message}`)));

    gs.stdin.end(body, 'binary');
  }).on('response', (response) => {
    const statusCode = response.statusCode;
    const contentLength = Number(response.headers['content-length']);
    const contentType = response.headers['content-type'];
    const sizeLimit = config.get('PDFConversion.MaxFileSize');

    if (statusCode !== 200) {
      r.abort();
      return next(new error.NotFound('Request failed.'));
    } else if (contentType && !/^application\/pdf/i.test(contentType)) {
      r.abort();
      return next(new error.BadRequest(`Invalid content-type. Expected pdf, but received ${contentType}.`));
    } else if (sizeLimit && contentLength && contentLength / 1024 >= sizeLimit) {
      r.abort();
      return next(new error.BadRequest(`File exceeds size limit of ${sizeLimit} KB.`));
    }
  });
}

module.exports = pdfLoader;
