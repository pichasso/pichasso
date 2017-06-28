const fs = require('fs');
const config = require('config');
const cron = require('cron');

class FileCache {
  constructor() {
    this.filePath = config.get('Caching.Imagepath');
    if (!fs.existsSync(this.filePath)) {
      fs.mkdir(this.filePath);
    }
    this.cache = this.loadCache();
    let cleanupCronInterval = config.get('Caching.CleanupCronInterval');
    let expirationTimeSeconds = config.get('Caching.Expires');
    let fileCache = this;
    if (cleanupCronInterval && expirationTimeSeconds) {
      try {
        this.cleanupJob = new cron.CronJob(
          cleanupCronInterval,
          function () {
            console.log('cache cleanup starts... with current cache size', fileCache.cache.size);
            fileCache.cleanup(expirationTimeSeconds);
          },
          function () {
            console.log('cache cleanup finished... with current cache size', fileCache.cache.size);
          },
          true
        );
        fileCache.cleanupJob.start();
        console.log('enabled removal of cached files on expiration after', expirationTimeSeconds, 'seconds using cron filter ’', cleanupCronInterval, '’');
      } catch (ex) {
        console.log('cleanup cron pattern ’', cleanupCronInterval, '’ not valid');
      }
    } else {
      console.log('cache cleanup disabled, add Caching.CleanupCronInterval and Caching.Expires to configuration.');
    }
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
      this.cache.delete(hash);
      fs.unlinkSync(this.filePath + hash);
      console.log('removed cached file', hash);
      return true;
    }
    return false;
  }

  clear() {
    fs.readdir(this.filePath, (err, files) => {
      files.forEach(file => this.remove(file));
    });
  }

  cleanup(expirationTimeSeconds) {
    let expirationDate = new Date();
    expirationDate = expirationDate - expirationTimeSeconds;
    console.log('remove files from cache, older than', expirationDate);
    this.cache.forEach((file) => {
      fs.stat(this.filePath + file, (err, stats) => {
        if (stats.birthtime < expirationDate) {
          this.remove(file);
        }
      });
    });
  }
}

module.exports = new FileCache();
