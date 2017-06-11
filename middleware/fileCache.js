const fs = require('fs');
const config = require('config');

class FileCache {
  constructor() {
    this.filePath = config.get('Caching.Imagepath');
    if (!fs.existsSync(this.filePath)) {
      fs.mkdir(this.filePath);
    }
  }

  add(filename, format, data) {
    fs.writeFile(this.filePath + filename, data, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }

  load(hash) {
    return fs.readFileSync(this.filePath + hash);
  }

  exists(hash) {
    return fs.existsSync(this.filePath + hash);
  }

  remove(hash) {
    if (fs.existsSync(this.filePath + hash)) {
      return fs.unlinkSync(this.filePath + hash);
    }
    return false;
  }

  clear() {
    fs.readdir(this.filePath, (err, files) => {
      files.forEach(each => this.remove(each));
    });
  }
}

module.exports = new FileCache();
