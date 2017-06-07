const fs = require('fs');
const config = require('config');

let filepath = config.get('Caching.Imagepath');

fileCache = {
  init: function () {
    if (!fs.existsSync(filepath)) {
      fs.mkdir(filepath);
    }
  },
  saveFile: function (filename, format, data) {
    fs.writeFile(filepath + filename, data, 'utf8', function (err) {
      if (err) throw err;
      // console.log('DEBUG: The file has been saved!');
    });
  },
 load: function (hash, error) {
      return fs.readFileSync(filepath+hash,error);
  },
  exists: function (hash) {
    return fs.existsSync(filepath + hash);
  },

};
module.exports = fileCache;
