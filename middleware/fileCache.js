const fs = require('fs');
const config = require('config');
const cron = require('cron');
const logger = require('../controllers/logger');
const logTag = '[FileCache]';

class FileCache {
  constructor() {
    this.filePath = config.get('Caching.Directory');
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
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
            logger.info(logTag, 'Cleanup started. Current size', fileCache.cache.size);
            fileCache.cleanup(expirationTimeSeconds);
          },
          function () {
            logger.info(logTag, 'Cleanup finished. Current size', fileCache.cache.size);
          },
          true
        );
        fileCache.cleanupJob.start();
        logger.info(logTag, 'Files will be deleted after', expirationTimeSeconds,
          'seconds using cron pattern ’', cleanupCronInterval, '’');
      } catch (ex) {
        logger.error(logTag, 'Cleanup cron pattern ’', cleanupCronInterval, '’ invalid');
      }
    } else {
      logger.info(logTag, 'Cleanup disabled, set Caching.CleanupCronInterval and Caching.Expires in configuration to enable it.');
    }
  }

  loadCache() {
    let cache = new Set();
    fs.readdirSync(this.filePath).forEach((file) => {
      cache.add(file);
    });
    logger.verbose(logTag, 'Loaded cached files. Current size', cache.size);
    return cache;
  }

  add(filename, format, data) {
    let cache = this.cache;
    fs.writeFile(this.filePath + filename, data, function (err) {
      if (err) {
        logger.error(logTag, 'Unable to write file', filename, err);
      } else {
        cache.add(filename);
        logger.verbose(logTag, 'Successfully added file', filename);
      }
    });
  }

  load(hash) {
    logger.verbose(logTag, 'Load file', hash);
    return fs.readFileSync(this.filePath + hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  remove(hash) {
    let cache = this.cache;
    fs.exists(this.filePath + hash, (exists) => {
      if (!exists) {
        logger.warn(logTag, 'Could not delete file. Unable to find', hash);
        return;
      }
      fs.unlink(this.filePath + hash, (err) => {
        if (err) {
          logger.error(logTag, 'Unable to delete file.', err);
          return;
        }
        cache.delete(hash);
        logger.verbose(logTag, 'Removed file', hash);
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
    logger.verbose(logTag, 'Removing files older than', new Date(expirationDate));
    this.cache.forEach((file) => {
      fs.stat(this.filePath + file, (err, stats) => {
        if (err) {
          logger.error(logTag, 'Error reading file during cleanup', err);
        }
        if (stats.birthtime < expirationDate) {
          this.remove(file);
        }
      });
    });
  }
}

module.exports = new FileCache();
