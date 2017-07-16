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
    let cache = new Map();
    let filePath = this.filePath;
    fs.readdirSync(this.filePath).forEach((file) => {
      if (file.indexOf('.') === -1) {
        fs.readFile(filePath + file + '.json', {
          encoding: 'utf8',
        }, (err, data) => {
          if (err) {
            console.log('cache error loading file', file, err);
          } else {
            cache.set(file, JSON.parse(data));
            console.log('cache added file from disk', file, 'currently', cache.size, 'cached files');
          }
        });
      }
    });
    return cache;
  }

  add(hash, data, query) {
    let cache = this.cache;
    let file = this.filePath + hash;
    query.createdAt = Date.now();
    fs.writeFile(file, data, function (err) {
      if (err) {
        console.log('cache add data error', hash, err);
      } else {
        fs.writeFile(file + '.json', JSON.stringify(query), {
          encoding: 'utf8',
        }, function (err) {
          if (err) {
            console.log('cache add metadata error', hash, err);
          } else {
            cache.set(hash, query);
            console.log('cache successfully added file data and metadata', hash);
          }
        });
      }
    });
  }

  load(hash) {
    console.log('cache send cached file', hash);
    return fs.readFileSync(this.filePath + hash);
  }

  metadata(hash) {
    console.log('cache send metadata', hash);
    return this.cache.get(hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  remove(hash) {
    let cache = this.cache;
    cache.delete(hash);
    fs.exists(this.filePath + hash, (exists) => {
      if (!exists) {
        console.log('cache could not delete data from filesystem, does not exist:', hash);
        return;
      }
      fs.unlink(this.filePath + hash, (err) => {
        if (err) {
          console.log('cache could not delete data from filesystem:', err);
          return;
        }
        fs.exists(this.filePath + hash + '.json', (exists) => {
          if (!exists) {
            console.log('cache could not delete metadata from filesystem, does not exist:', hash);
            return;
          }
          fs.unlink(this.filePath + hash + '.json', (err) => {
            if (err) {
              console.log('cache could not delete metadata from filesystem:', err);
              return;
            }
            console.log('cache successfully removed file', hash);
          });
        });
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
    this.cache.forEach((query, file) => {
      if (query.createdAt < expirationDate) {
        this.remove(file);
      }
    });
  }
}

module.exports = new FileCache();
