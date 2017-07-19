const config = require('config');
const error = require('http-errors');
const request = require('request');
const PDFCompressor = require('./pdfCompressor');

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

    if (!req.query.filename) {
      req.query.filename = extractFilename(response, req.query.file);
    }

    const compressor = new PDFCompressor();
    compressor
      .dpi(dpi)
      .exec(body, (err, data) => {
        if (err) {
          return next(`Compression failed: ${err.message}`);
        }
        req.compressedFile = data;
        next();
      });
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

function extractFilename(response, fileParam) {
  const filenameRegExp = /filename=\"(.+)\"/ig;
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition && contentDisposition.search(filenameRegExp)) {
    return filenameRegExp.exec(contentDisposition)[1];
  }

  while (fileParam.endsWith('/')) {
    fileParam = fileParam.substr(0, fileParam.length - 1);
  }

  let filename = '';
  const delimiterIndex = fileParam.lastIndexOf('/');
  if (delimiterIndex !== -1) {
    filename = fileParam.substr(delimiterIndex + 1);
  }
  if (!filename.endsWith('.pdf')) {
    filename += '.pdf';
  }

  return filename;
}

module.exports = pdfLoader;
