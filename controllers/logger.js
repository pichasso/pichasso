const config = require('config');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const winston = require('winston');

const dir = config.get('Logging.Directory');
const tsFormat = () => (new Date()).toLocaleTimeString();

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const transports = [];

if (config.get('Logging.Console.Enabled')) {
  transports.push(new (winston.transports.Console)({
    timestamp: tsFormat,
    colorize: true,
    level: config.get('Logging.Console.Level'),
  }));
}

if (config.get('Logging.File.Enabled')) {
  transports.push(new (DailyRotateFile)({
    filename: `${dir}-pichasso.log`,
    timestamp: tsFormat,
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    level: config.get('Logging.File.Level'),
    json: false,
  }));
}

const logger = new (winston.Logger)({
  transports: transports,
});

module.exports = logger;
