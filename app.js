const express = require('express');
const path = require('path');
const morgan = require('morgan');
const logger = require('./controllers/logger');

const index = require('./routes/index');
const image = require('./routes/image');
const checkConfig = require('./controllers/checkConfig');

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

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
