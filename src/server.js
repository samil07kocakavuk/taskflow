require('dotenv').config();

const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`TaskFlow calisiyor -> http://localhost:${config.port}`);
  console.log(`log: ${config.logFile}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`${config.port} portu dolu. Baska port dene: PORT=4000`);
  } else {
    console.error('Sunucu baslatilamadi:', err);
  }

  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} alindi, kapatiliyor...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Islenmeyen promise hatasi:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Yakalanmayan hata:', err);
});

module.exports = server;
