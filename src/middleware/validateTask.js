const ALLOWED_STATUS = ['todo', 'in-progress', 'completed'];
const ALLOWED_PRIORITY = ['low', 'medium', 'high'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

function check(field, value, errors, required = false) {
  switch (field) {
    case 'title':
      if (value === undefined || value === null || value === '') {
        if (required) errors.push('title zorunlu');
      } else if (!isText(value)) {
        errors.push('title metin olmali');
      } else if (value.trim().length > 100) {
        errors.push('title en fazla 100 karakter');
      }
      break;

    case 'description':
      if (value === undefined || value === null) break;
      if (typeof value !== 'string') errors.push('description metin olmali');
      else if (value.length > 500) errors.push('description en fazla 500 karakter');
      break;

    case 'priority':
      if (value !== undefined && (value === null || !ALLOWED_PRIORITY.includes(value))) {
        errors.push('priority low, medium veya high olmali');
      }
      break;

    case 'status':
      if (value !== undefined && (value === null || !ALLOWED_STATUS.includes(value))) {
        errors.push(`status ${ALLOWED_STATUS.join(', ')} degerlerinden biri olmali`);
      }
      break;

    case 'assignee':
      if (value === undefined || value === null || value === '') {
        if (required) errors.push('assignee zorunlu');
      } else if (!isText(value)) {
        errors.push('assignee metin olmali');
      } else if (value.trim().length > 50) {
        errors.push('assignee en fazla 50 karakter');
      }
      break;

    case 'project':
      if (value === undefined || value === '') break;
      if (value === null || typeof value !== 'string') errors.push('project metin olmali');
      else if (value.trim().length > 100) errors.push('project en fazla 100 karakter');
      break;

    case 'dueDate':
      if (value === undefined || value === null || value === '') break;
      if (typeof value !== 'string') errors.push('dueDate metin olmali');
      else if (Number.isNaN(Date.parse(value))) errors.push('dueDate gecerli bir tarih olmali');
      break;

    default:
      break;
  }
}

function invalidBody(res) {
  return res.status(400).json({
    success: false,
    message: 'Istek govdesi JSON nesnesi olmali',
  });
}

function validateCreateTask(req, res, next) {
  if (!isObject(req.body)) {
    return invalidBody(res);
  }

  const errors = [];
  check('title', req.body.title, errors, true);
  check('assignee', req.body.assignee, errors, true);
  check('description', req.body.description, errors);
  check('priority', req.body.priority, errors);
  check('status', req.body.status, errors);
  check('project', req.body.project, errors);
  check('dueDate', req.body.dueDate, errors);

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Gecersiz veri', errors });
  }

  return next();
}

function validateUpdateTask(req, res, next) {
  if (!isObject(req.body)) {
    return invalidBody(res);
  }

  const fields = ['title', 'description', 'priority', 'status', 'assignee', 'project', 'dueDate'];
  const filled = fields.filter((f) => req.body[f] !== undefined);

  if (!filled.length) {
    return res.status(400).json({
      success: false,
      message: 'Guncellenecek alan yok',
      errors: [`Gecerli alanlar: ${fields.join(', ')}`],
    });
  }

  const errors = [];
  filled.forEach((field) => {
    check(field, req.body[field], errors, field === 'title' || field === 'assignee');
  });

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Gecersiz veri', errors });
  }

  return next();
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  ALLOWED_STATUS,
  ALLOWED_PRIORITY,
};
