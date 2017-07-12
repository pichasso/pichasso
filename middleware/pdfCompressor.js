const spawn = require('child_process').spawn;

class PDFCompressor {
  constructor() {
    this._dpi = 300;
  }

  _initArgs() {
    // https://stackoverflow.com/questions/10450120/optimize-pdf-files-with-ghostscript-or-other#10453202
    return [
      '-dQUIET',
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=pdfwrite',
      '-dCompabilityLevel=1.4',
      '-dCompressFonts=true',
      '-dDetectDuplicateImages=true',
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      `-dColorImageResolution=${this._dpi}`,
      `-dGrayImageResolution=${this._dpi}`,
      `-dMonoImageResolution=${this._dpi}`,
      '-sOutputFile=-',
      '-',
    ];
  }

  dpi(value) {
    if (!Number.isInteger(value)) {
      throw new Error('Expected value to be of type Integer.');
    }
    this._dpi = value;
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

    gs.on('error', callback);
    gs.on('close', (code) => {
      console.log('Close', code);
      callback(null, pdfBuffer);
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
      console.log('Data', pdfBuffer.length);
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
