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
        console.log('enabled removal of cached files on expiration after', expirationTimeSeconds,
          'seconds using cron filter ’', cleanupCronInterval, '’');
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
    let cache = this.cache;
    fs.writeFile(this.filePath + filename, data, function (err) {
      if (err) {
        console.log('cache add error', filename, err);
      } else {
        cache.add(filename);
        console.log('cache successfully added file', filename);
      }
    });
  }

  load(hash) {
    console.log('cache send cached file', hash);
    return fs.readFileSync(this.filePath + hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  remove(hash) {
    let cache = this.cache;
    fs.exists(this.filePath + hash, (exists) => {
      if (!exists) {
        console.log('cache could not delete file from filesystem, does not exist:', hash);
        return;
      }
      fs.unlink(this.filePath + hash, (err) => {
        if (err) {
          console.log('cache could not delete file from filesystem:', err);
          return;
        }
        cache.delete(hash);
        console.log('cache successfully removed file', hash);
      });
    });
  }

  clear() {
    fs.readdir(this.filePath, (err, files) => {
      files.forEach(file => this.remove(file));
    });
  }

  cleanup(expirationTimeSeconds) {
    let expirationDate = new Date();
    expirationDate = expirationDate - expirationTimeSeconds;
    console.log('remove files from cache, older than', new Date(expirationDate));
    this.cache.forEach((file) => {
      fs.stat(this.filePath + file, (err, stats) => {
        if (err) {
          console.log('error reading file cache for cleanup', err);
        }
        if (stats.birthtime < expirationDate) {
          this.remove(file);
        }
      });
    });
  }
}

module.exports = new FileCache();
