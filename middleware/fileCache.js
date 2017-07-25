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
    let filePath = this.filePath;
    fs.accessSync(filePath, fs.W_OK, function (err) {
      if (err) {
        logger.error(logTag, 'Require write access for cache folder', filePath);
        process.exit(1);
      }
    });
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
      logger.info(logTag, 'Cleanup disabled, set Caching.CleanupCronInterval ' +
        'and Caching.Expires in configuration to enable it.');
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
            logger.error(logTag, 'Cache error loading metadata file', file, err);
          } else if (data) {
            cache.set(file, JSON.parse(data));
            logger.verbose(logTag, 'Cache added file from disk', file, 'currently', cache.size, 'cached files');
          }
        });
      }
    });
    return cache;
  }

  add(hash, data, query) {
    if (!hash || !data || !query) {
      logger.warn(logTag, 'Invalid data was not added to cache.');
      return;
    }
    let cache = this.cache;
    let file = this.filePath + hash;
    query.createdAt = Date.now();
    fs.writeFile(file, data, function (err) {
      if (err) {
        logger.error(logTag, 'Unable to write file', file, err);
      } else {
        fs.writeFile(file + '.json', JSON.stringify(query), {
          encoding: 'utf8',
        }, function (err) {
          if (err) {
            logger.error(logTag, 'Cache add metadata error', hash, err);
          } else {
            cache.set(hash, query);
            logger.verbose(logTag, 'Successfully added file and metadata', file);
          }
        });
      }
    });
  }

  load(hash) {
    logger.verbose(logTag, 'Load file data', hash);
    return fs.readFileSync(this.filePath + hash);
  }

  metadata(hash) {
    logger.verbose(logTag, 'Return metadata', hash);
    return this.cache.get(hash);
  }

  exists(hash) {
    return this.cache.has(hash);
  }

  valid(hash) {
    let validFrom = Date.now() - config.get('Caching.Expires');
    if (this.exists(hash)
      && this.metadata(hash).createdAt > validFrom) {
      return true;
    } else {
      return false;
    }
  }

  remove(hash) {
    let cache = this.cache;
    cache.delete(hash);
    fs.exists(this.filePath + hash, (exists) => {
      if (!exists) {
        logger.warn(logTag, 'Could not delete file. Unable to find', hash);
        return;
      }
      fs.unlink(this.filePath + hash, (err) => {
        if (err) {
          logger.error(logTag, 'Could not delete data from filesystem:', err);
          return;
        }
        fs.exists(this.filePath + hash + '.json', (exists) => {
          if (!exists) {
            logger.error(logTag, 'Could not delete metadata from filesystem, does not exist:', hash);
            return;
          }
          fs.unlink(this.filePath + hash + '.json', (err) => {
            if (err) {
              logger.error(logTag, 'Could not delete metadata from filesystem:', err);
              return;
            }
            logger.info(logTag, 'Successfully removed file', hash);
          });
        });
      });
    });
  }

  clear() {
    this.cache.forEach((metadata, hash) => this.remove(hash));
  }

  cleanup(expirationTimeSeconds) {
    let expirationDate = new Date();
    expirationDate = expirationDate - expirationTimeSeconds;
    logger.verbose(logTag, 'Removing files older than', new Date(expirationDate));
    this.cache.forEach((query, file) => {
      if (query.createdAt < expirationDate) {
        this.remove(file);
      }
    });
  }
}

module.exports = new FileCache();
