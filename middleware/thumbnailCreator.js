const error = require('http-errors');
const puppeteer = require('puppeteer');


function thumbnailCreator(req, res, next) {
  if (req.completed) {
    return next();
  }


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

  puppeteer.launch().then(async (browser) => {
    const page = await browser.newPage();
    if (req.query.device) {
      await page.emulate(req.query.device);
      req.imageProperties = calculateImageProperties(req.query.device.viewport);
    } else {
      const properties = {
        width: req.query.browserwidth,
        height: req.query.browserheight,
        deviceScaleFactor: req.query.browserscale,
      };
      await page.setViewport(properties);
      req.imageProperties = calculateImageProperties(properties);
    }
    await page.goto(req.query.file);
    return page.screenshot({
      format: 'png',
    }).then(async (buf) => {
      await browser.close();
      return buf;
    })
      .then((buf) => {
        req.file = buf;
        return next();
      }).catch(err => next(new error.InternalServerError(err))).catch(err => next(new error.InternalServerError(err)));
  });
}

module.exports = thumbnailCreator;
