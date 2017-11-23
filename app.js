const config = require('config');
const express = require('express');
const logger = require('./controllers/logger');
const logTag = '[App]';
const morgan = require('morgan');
const path = require('path');

const index = require('./routes/index');
const image = require('./routes/image');
const pdf = require('./routes/pdf');
const thumbnail = require('./routes/thumbnail');

const checkConfig = require('./controllers/checkConfig');
const errorImage = require('./middleware/errorImage');

const app = express();

// check configuration before starting server
checkConfig();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// setup request logging
logger.stream = {
  // eslint-disable-next-line no-unused-vars
  write: function (message, encoding) {
    logger.info('[HTTP]', message.trim());
  },
};
app.use(morgan('tiny', {'stream': logger.stream}));

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/image', image);
app.use('/pdf', pdf);
app.use('/thumbnail', thumbnail);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  if (!config.get('Logging.EnableErrorImages')) {
    res.render('error');
    return;
  }

  errorImage(err)
    .then((imageBuffer) => {
      res.setHeader('content-type', 'image/png');
      res.end(imageBuffer);
    }).catch((imageError) => {
      logger.error(logTag, 'Unable to generate error image:', imageError);
      res.render('error');
    });
});

module.exports = app;
