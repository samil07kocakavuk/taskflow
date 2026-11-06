const router = require('express').Router();

const config = require('../config');
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');
const reportRoutes = require('./reportRoutes');
const requireAuth = require('../middleware/requireAuth');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    name: config.api.name,
    version: config.api.version,
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);

router.use('/tasks', requireAuth, taskRoutes);
router.use('/reports', requireAuth, reportRoutes);

module.exports = router;
