const config = require('config');
const error = require('http-errors');
const request = require('request');
const puppeteer = require('puppeteer');


function thumbnailCreator(req, res, next) {
  if (req.completed) {
    return next();
  }

  puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await page.goto(req.query.file);
    await page.screenshot({ path: 'screenshot.png' })
      .then(buf => {
        await browser.close();
        return buf;
      })
      .then(buf => {
        req.file = buf;
        next();
      }).catch(err => {
        return next(new error.InternalServerError(err));
      });
  });
}

module.exports = thumbnailCreator;
