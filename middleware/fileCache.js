const fs = require('fs');
const config = require('config');

class FileCache {
  constructor() {
    this.filePath = config.get('Caching.Imagepath');
    if (!fs.existsSync(this.filePath)) {
      fs.mkdir(this.filePath);
    }
    this.cache = this.loadCache();
  }

  loadCache() {
    let cache = new Set();
    fs.readdirSync(this.filePath).forEach((file) => {
      cache.add(file);
    });
    console.log('cache contains currently', cache.size, 'elements');
    return cache;
  }

  add(filename, format, data) {
    this.cache.add(filename);
    fs.writeFile(this.filePath + filename, data, function (err) {
      if (err) {
        this.cache.remove(filename);
        console.log('cache add error', filename, err);
      }
    });
  }

  load(hash) {
    return fs.readFileSync(this.filePath + hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  remove(hash) {
    if (fs.existsSync(this.filePath + hash)) {
      this.cache.remove(filename);
      fs.unlinkSync(this.filePath + hash);
      return true;
    }
    return false;
  }

  clear() {
    fs.readdir(this.filePath, (err, files) => {
      files.forEach(file => this.remove(file));
    });
  }
}

module.exports = new FileCache();
