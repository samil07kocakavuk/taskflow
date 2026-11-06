const fs = require('fs');
const path = require('path');
const config = require('../config');

function stamp(date) {
  const pad = (n) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

module.exports = function logger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${stamp(new Date())}  ${req.method.padEnd(6)} ${
      req.originalUrl
    }  ${res.statusCode}  ${Math.round(ms)}ms`;

    console.log(line);

    try {
      fs.mkdirSync(path.dirname(config.logFile), { recursive: true });
      fs.appendFile(config.logFile, line + '\n', () => {});
    } catch {
    }
  });

  next();
};
