const spawn = require('child_process').spawn;
const logger = require('../controllers/logger');
const logTag = '[PDF Compressor]';


class PDFCompressor {
  constructor() {
    this._dpi = 300;
    this._outputDevice = 'pdfwrite';
    this._resolution = null;
    this._downScaleFactor = null;
    this._pageList = null;
  }

  _initArgs() {
    // https://stackoverflow.com/questions/10450120/optimize-pdf-files-with-ghostscript-or-other#10453202
    let retValue = [
      '-dQUIET',
      '-dBATCH',
      '-dNOPAUSE',
      `-sDEVICE=${this._outputDevice}`,
      '-dCompabilityLevel=1.4',
      '-dCompressFonts=true',
      '-dDetectDuplicateImages=true',
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      `-dColorImageResolution=${this._dpi}`,
      `-dGrayImageResolution=${this._dpi}`,
      `-dMonoImageResolution=${this._dpi}`,
    ];

    if (this._resolution != null) {
      retValue.push(`-r${this._resolution}`);
    }

    if (this._downScaleFactor != null) {
      retValue.push(`-downScaleFactor=${this._downScaleFactor}`);
    }

    if (this._pageList != null) {
      retValue.push(`-sPageList=${this._pageList}`);
    }

    retValue.push('-sOutputFile=-');
    retValue.push('-');

    return retValue;
  }

  dpi(value) {
    if (!Number.isInteger(value)) {
      throw new Error('Expected value to be of type Integer.');
    }
    this._dpi = value;
    return this;
  }

  outputDevice(device) {
    this._outputDevice = device;
    return this;
  }

  pageList(value) {
    this._pageList = value;
    return this;
  }

  resolution(dpi) {
    this._resolution = dpi;
    return this;
  }

  downScaleFactor(factor) {
    this._downScaleFactor = factor;
    return this;
  }

  exec(input, callback) {
    if (Buffer.isBuffer(input)) {
      throw new Error('Expected input to be of type Buffer.');
    }
    if (!isFunction(callback)) {
      throw new Error('Expected callback to be of type function.');
    }

    let pdfBuffer;
    const args = this._initArgs();
    const gs = spawn('gs', args, {stdio: ['pipe']});
    logger.debug(logTag, 'GS', ...args);

    gs.on('error', callback);
    gs.on('close', (code) => {
      if (code === 0) {
        return callback(null, pdfBuffer);
      }
      callback(new Error('Closed with code ' + code));
    });

    gs.stdout.on('error', callback);
    gs.stdout.on('data', (data) => {
      if (!pdfBuffer) {
        pdfBuffer = data;
      } else {
        const extendedBuffer = Buffer.alloc(pdfBuffer.length + data.length);
        extendedBuffer.fill(pdfBuffer);
        extendedBuffer.fill(data, pdfBuffer.length);
        pdfBuffer = extendedBuffer;
      }
    });

    gs.stderr.on('error', callback);
    gs.stdin.on('error', callback);

    gs.stdin.write(input, 'binary');
    gs.stdin.end();
  }
}

function isFunction(object) {
  return (!!object && ({}.toString.call(object) === '[object Function]'));
}

module.exports = PDFCompressor;
