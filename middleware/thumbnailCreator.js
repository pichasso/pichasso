const error = require('http-errors');
const puppeteer = require('puppeteer');
const request = require('request');
const config = require('config');


function thumbnailCreator(req, res, next) {
  if (req.completed) {
    return next();
  }

  const isLandscape = req.query.landscape || config.get('Thumbnail.Browser.Landscape');
  const isTouch = req.query.touch || config.get('Thumbnail.Browser.Touch');
  const isMobile = req.query.mobile || config.get('Thumbnail.Browser.Mobile');
  const fullPage = req.query.fullpage || config.get('Thumbnail.Browser.FullPage');

  function calculateImageProperties(viewport) {
    const width = viewport.width * viewport.deviceScaleFactor;
    const height = viewport.height * viewport.deviceScaleFactor;
    return {
      width: parseInt(width),
      height: parseInt(height),
      aspectRatio: width / height,
      format: 'png',
    };
  }

  function checkContentType(err, response) {
    if (err) {
      if (err.code === 'ENOTFOUND') {
        return next(new error.NotFound('Could not resolve given hostname.'));
      }
      return next(new error.InternalServerError(err));
    }
    if ('content-type' in response.headers &&
      response.headers['content-type'].indexOf('html') !== -1) {
      createWebpageThumbnail();
    } else {
      createDocumentThumbnail();
      // return next(new error.UnsupportedMediaType('Response header content-type must contain html.'));
    }
  }

  function createThumbnail(url) {
    let options = {
      url: url,
      method: 'HEAD',
    };
    request(options, checkContentType);
  }

  function createDocumentThumbnail() {
    return next(new error.NotImplemented());
  }

  function createWebpageThumbnail() {
    // TODO puppeteer should run in sandbox for security reasons but currently not supported inside docker
    puppeteer.launch({
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium-browser'
    }).then(async (browser) => {
      // todo createIncognitoBrowserContext()
      const page = await browser.newPage();
      if (req.query.device) {
        await page.emulate(req.query.device);
        req.imageProperties = calculateImageProperties(req.query.device.viewport);
      } else {
        const properties = {
          'width': req.query.browserwidth,
          'height': req.query.browserheight,
          'deviceScaleFactor': req.query.browserscale,
          'isLandscape': isLandscape,
          'hasTouch': isTouch,
          'isMobile': isMobile,
        };
        await page.setViewport(properties);
        req.imageProperties = calculateImageProperties(properties);
      }
      await page.goto(req.query.file);
      return page.screenshot({
        'format': 'png',
        'fullPage': fullPage,
      }).then(async (buf) => {
        await browser.close();
        return buf;
      })
        .then((buf) => {
          req.file = buf;
          return next();
        })
        .catch(async err => {
          if (browser) { await browser.close(); }
          throw err;
        });
    }).catch(err => {
      next(new error.InternalServerError(err));
    });
  }

  createThumbnail(req.query.file);
}

module.exports = thumbnailCreator;
