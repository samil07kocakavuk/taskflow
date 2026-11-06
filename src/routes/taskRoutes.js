const router = require('express').Router();

const taskController = require('../controllers/taskController');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validateTask');
const asyncHandler = require('../utils/asyncHandler');

router.get('/search', asyncHandler(taskController.searchTasks));
router.get('/assignee/:assignee', asyncHandler(taskController.getTasksByAssignee));

router.get('/', asyncHandler(taskController.listTasks));
router.post('/', validateCreateTask, asyncHandler(taskController.createTask));
router.get('/:id', asyncHandler(taskController.getTask));
router.put('/:id', validateUpdateTask, asyncHandler(taskController.updateTask));
router.patch('/:id', validateUpdateTask, asyncHandler(taskController.updateTask));
router.delete('/:id', asyncHandler(taskController.deleteTask));

module.exports = router;
