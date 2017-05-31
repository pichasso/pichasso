const fs = require('fs');
const config = require('config');

let filepath = config.get('Caching.Imagepath');

fileCache = {
  createCacheFolder: function () {
    if (!fs.existsSync(filepath)) {
      fs.mkdir(filepath);
    }
  },
  saveFile: function (filename, format, data) {
    fs.writeFile(filepath + filename + '.' + format, data, 'utf8', function (err) {
      if (err) throw err;
      // console.log('DEBUG: The file has been saved!');
    });
  },
  // loadFile: function (hash, error) {
      // filepath
  // },
  exists: function (hash) {
    let extensions = ['webp', 'png', 'jpeg'];
    return extensions.filter(function (ext) {
      return fs.existsSync(filepath + hash + '.' + ext);
    });
  },

};
module.exports = fileCache;
