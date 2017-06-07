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
    fs.writeFile(filepath + filename, data, function (err) {
      if (err) throw err;
    });
  },
  load: function (hash) {
    return fs.readFileSync(filepath + hash);
  },
  exists: function (hash) {
    return fs.existsSync(filepath + hash);
  },
  remove: function (hash) {
    return true; // todo implement
  },
};
module.exports = fileCache;
