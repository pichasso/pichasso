const fs = require('fs');
const config = require('config');

let filepath = config.get('Caching.Imagepath');

fileCache = {
  init: function () {
    if (!fs.existsSync(filepath)) {
      fs.mkdir(filepath);
    }
  },
  add: function (filename, format, data) {
    fs.writeFile(filepath + filename, data, 'utf8', function (err) {
      if (err) throw err;
    });
  },
  load: function (hash) {
    return fs.readFileSync(filepath + hash, 'utf8');
  },
  exists: function (hash) {
    return fs.existsSync(filepath + hash);
  },

};
module.exports = fileCache;
