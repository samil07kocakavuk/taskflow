const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  dataFile:
    process.env.DATA_FILE ||
    path.join(__dirname, '..', '..', 'data', 'tasks.json'),
  usersFile:
    process.env.USERS_FILE ||
    path.join(__dirname, '..', '..', 'data', 'users.json'),
  logFile:
    process.env.LOG_FILE ||
    path.join(__dirname, '..', '..', 'logs', 'access.log'),
  sessionSecret: process.env.SESSION_SECRET || 'taskflow-dev-secret',
  api: {
    name: 'TaskFlow',
    version: '1.0.0',
  },
};
