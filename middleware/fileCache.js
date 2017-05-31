const fs = require('fs');
const config = require('config');

let filepath = config.get('Caching.Imagepath');

fileCache = {
  saveFile: function (filename, format, data, error) {
    fs.writeFile(filepath + filename + '.' + format, data, error);
  },
  // loadFile: function (hash, error) {
      // filepath
  // },
  exists: function (hash) {
    let extensions = ['webp', 'png', 'jpeg'];
    let found = extensions.filter(function (ext) {
      return fs.existsSync(filepath + hash + '.' + ext);
    });
    return found;
  },

};
module.exports = fileCache;
