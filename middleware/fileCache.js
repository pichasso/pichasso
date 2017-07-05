const fs = require('fs');
const config = require('config');
const cron = require('cron');
const logger = require('../controllers/logger');

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
            logger.info('cache cleanup starts... with current cache size', fileCache.cache.size);
            fileCache.cleanup(expirationTimeSeconds);
          },
          function () {
            logger.info('cache cleanup finished... with current cache size', fileCache.cache.size);
          },
          true
        );
        fileCache.cleanupJob.start();
        logger.info('enabled removal of cached files on expiration after', expirationTimeSeconds,
          'seconds using cron filter ’', cleanupCronInterval, '’');
      } catch (ex) {
        logger.error('cleanup cron pattern ’', cleanupCronInterval, '’ not valid');
      }
    } else {
      logger.info('cache cleanup disabled, add Caching.CleanupCronInterval and Caching.Expires to configuration.');
    }
  }

  loadCache() {
    let cache = new Set();
    fs.readdirSync(this.filePath).forEach((file) => {
      cache.add(file);
    });
    logger.verbose('cache contains currently', cache.size, 'elements');
    return cache;
  }

  add(filename, format, data) {
    let cache = this.cache;
    fs.writeFile(this.filePath + filename, data, function (err) {
      if (err) {
        logger.error('cache add error', filename, err);
      } else {
        cache.add(filename);
        logger.verbose('cache successfully added file', filename);
      }
    });
  }

  load(hash) {
    logger.verbose('cache send cached file', hash);
    return fs.readFileSync(this.filePath + hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  remove(hash) {
    let cache = this.cache;
    fs.exists(this.filePath + hash, (exists) => {
      if (!exists) {
        logger.warn('cache could not delete file from filesystem, does not exist:', hash);
        return;
      }
      fs.unlink(this.filePath + hash, (err) => {
        if (err) {
          logger.error('cache could not delete file from filesystem:', err);
          return;
        }
        cache.delete(hash);
        logger.verbose('cache successfully removed file', hash);
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
    logger.verbose('remove files from cache, older than', new Date(expirationDate));
    this.cache.forEach((file) => {
      fs.stat(this.filePath + file, (err, stats) => {
        if (err) {
          logger.error('error reading file cache for cleanup', err);
        }
        if (stats.birthtime < expirationDate) {
          this.remove(file);
        }
      });
    });
  }
}

module.exports = new FileCache();
