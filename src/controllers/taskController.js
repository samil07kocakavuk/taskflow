const taskService = require('../services/taskService');

async function listTasks(req, res) {
  const result = await taskService.list(req.query);
  res.json({ success: true, ...result });
}

async function searchTasks(req, res) {
  const raw =
    typeof req.query.keyword === 'string'
      ? req.query.keyword
      : typeof req.query.q === 'string'
        ? req.query.q
        : '';

  const keyword = raw.trim();

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: 'keyword parametresi gerekli',
    });
  }

  const result = await taskService.list({ ...req.query, keyword });
  res.json({ success: true, keyword, ...result });
}

async function getTasksByAssignee(req, res) {
  const result = await taskService.list({
    ...req.query,
    assignee: req.params.assignee,
  });

  res.json({ success: true, assignee: req.params.assignee, ...result });
}

async function getTask(req, res) {
  const task = await taskService.getById(req.params.id);
  res.json({ success: true, data: task });
}

async function createTask(req, res) {
  const task = await taskService.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Gorev olusturuldu.',
    data: task,
  });
}

async function updateTask(req, res) {
  const task = await taskService.update(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Gorev guncellendi.',
    data: task,
  });
}

async function deleteTask(req, res) {
  const task = await taskService.remove(req.params.id);
  res.json({
    success: true,
    message: 'Gorev silindi.',
    data: task,
  });
}

module.exports = {
  listTasks,
  searchTasks,
  getTasksByAssignee,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
