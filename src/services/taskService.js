const config = require('../config');
const { readJson, writeJsonAtomic, withLock } = require('../utils/fileStore');
const HttpError = require('../utils/HttpError');

// data/tasks.json -> { nextId, tasks: [] }
const EMPTY = { nextId: 1, tasks: [] };

function normalize(store) {
  const tasks = Array.isArray(store && store.tasks) ? store.tasks : [];
  const maxId = tasks.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
  const stored = Number(store && store.nextId);

  return {
    nextId: Number.isInteger(stored) && stored > maxId ? stored : maxId + 1,
    tasks,
  };
}

async function load() {
  return normalize(await readJson(config.dataFile, EMPTY));
}

async function save(store) {
  await writeJsonAtomic(config.dataFile, store);
}

// Oku, degistir, yaz. Ayni dosyaya ayni anda iki yazma girmesin.
function mutate(fn) {
  return withLock(config.dataFile, async () => {
    const store = await load();
    const result = await fn(store);
    await save(store);
    return result;
  });
}

const lower = (v) => String(v).trim().toLowerCase();

async function list(query = {}) {
  const { tasks } = await load();
  let result = [...tasks];

  if (query.status) {
    const status = lower(query.status);
    result = result.filter((t) => lower(t.status) === status);
  }

  if (query.priority) {
    const priority = lower(query.priority);
    result = result.filter((t) => lower(t.priority) === priority);
  }

  if (query.assignee) {
    const assignee = lower(query.assignee);
    result = result.filter((t) => lower(t.assignee) === assignee);
  }

  if (query.project) {
    const project = lower(query.project);
    result = result.filter((t) => lower(t.project) === project);
  }

  if (query.keyword) {
    const keyword = lower(query.keyword);
    result = result.filter((t) =>
      `${t.title} ${t.description || ''}`.toLowerCase().includes(keyword)
    );
  }

  // Sirala
  const sortable = ['id', 'createdAt', 'updatedAt', 'priority', 'title', 'dueDate'];
  let field = 'createdAt';
  let desc = false;

  if (typeof query.sort === 'string') {
    const raw = query.sort.trim();
    const name = raw.startsWith('-') ? raw.slice(1) : raw;

    if (sortable.includes(name)) {
      field = name;
      desc = raw.startsWith('-');
    }
  }

  const weight = { high: 3, medium: 2, low: 1 };

  result.sort((a, b) => {
    let x = a[field];
    let y = b[field];

    if (field === 'priority') {
      x = weight[lower(x)] || 0;
      y = weight[lower(y)] || 0;
    }

    if (x === undefined || x === null) x = '';
    if (y === undefined || y === null) y = '';

    if (x < y) return desc ? 1 : -1;
    if (x > y) return desc ? -1 : 1;
    return 0;
  });

  // Sayfala
  const total = result.length;
  const pageInput = Number.parseInt(query.page, 10);
  const limitInput = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(pageInput) && pageInput > 0 ? pageInput : 1;
  const limit =
    Number.isInteger(limitInput) && limitInput > 0 ? Math.min(limitInput, 100) : 10;

  const start = (page - 1) * limit;

  return {
    data: result.slice(start, start + limit),
    total,
    count: Math.min(limit, Math.max(0, total - start)),
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function toId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(404, `Gorev bulunamadi: id=${id}`);
  }
  return n;
}

async function getById(id) {
  const numericId = toId(id);
  const { tasks } = await load();
  const task = tasks.find((t) => t.id === numericId);

  if (!task) {
    throw new HttpError(404, `Gorev bulunamadi: id=${id}`);
  }

  return task;
}

async function create(payload) {
  return mutate((store) => {
    const now = new Date().toISOString();

    const task = {
      id: store.nextId,
      title: payload.title.trim(),
      description:
        payload.description === undefined || payload.description === null
          ? ''
          : String(payload.description).trim(),
      status: payload.status || 'todo',
      priority: payload.priority || 'medium',
      assignee: payload.assignee.trim(),
      project: payload.project ? String(payload.project).trim() : 'genel',
      dueDate: payload.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    store.tasks.push(task);
    store.nextId += 1;

    return task;
  });
}

async function update(id, payload) {
  const numericId = toId(id);

  return mutate((store) => {
    const index = store.tasks.findIndex((t) => t.id === numericId);

    if (index === -1) {
      throw new HttpError(404, `Gorev bulunamadi: id=${id}`);
    }

    const current = store.tasks[index];
    const fields = ['title', 'description', 'priority', 'status', 'assignee', 'project', 'dueDate'];
    const changes = {};

    fields.forEach((field) => {
      if (payload[field] === undefined) return;

      const value = payload[field];

      if (field === 'dueDate') {
        changes.dueDate = value ? String(value).trim() : null;
      } else if (field === 'project') {
        const text = typeof value === 'string' ? value.trim() : '';
        changes.project = text || 'genel';
      } else if (value === null) {
        changes[field] = '';
      } else {
        changes[field] = typeof value === 'string' ? value.trim() : value;
      }
    });

    const updated = {
      ...current,
      ...changes,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    store.tasks[index] = updated;

    return updated;
  });
}

async function remove(id) {
  const numericId = toId(id);

  return mutate((store) => {
    const index = store.tasks.findIndex((t) => t.id === numericId);

    if (index === -1) {
      throw new HttpError(404, `Gorev bulunamadi: id=${id}`);
    }

    const [deleted] = store.tasks.splice(index, 1);
    return deleted;
  });
}

async function reportCompleted() {
  const { tasks } = await load();
  const completed = tasks.filter((t) => t.status === 'completed');

  return { count: completed.length, tasks: completed };
}

async function reportPending() {
  const { tasks } = await load();
  const pending = tasks.filter((t) => t.status !== 'completed');

  return { count: pending.length, tasks: pending };
}

async function reportSummary() {
  const { tasks } = await load();

  const countStatus = (s) => tasks.filter((t) => t.status === s).length;
  const countPriority = (p) => tasks.filter((t) => t.priority === p).length;
  const assignees = [...new Set(tasks.map((t) => t.assignee))];

  return {
    total: tasks.length,
    completed: countStatus('completed'),
    pending: countStatus('todo') + countStatus('in-progress'),
    byStatus: {
      todo: countStatus('todo'),
      'in-progress': countStatus('in-progress'),
      completed: countStatus('completed'),
    },
    byPriority: {
      high: countPriority('high'),
      medium: countPriority('medium'),
      low: countPriority('low'),
    },
    assignees,
    assigneeCount: assignees.length,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  reportCompleted,
  reportPending,
  reportSummary,
};
