const config = require('config');
const fs = require('fs');
const winston = require('winston');

const env = process.env.NODE_ENV || 'development';
const dir = config.get('Logging.Directory');
const tsFormat = () => (new Date()).toLocaleTimeString();

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: env === 'development' ? 'verbose' : 'none',
    }),
    new (require('winston-daily-rotate-file'))({
      filename: `${dir}-pichasso.log`,
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      level: env === 'development' ? 'verbose' : 'info',
      json: false,
    }),
  ],
});

module.exports = logger;
