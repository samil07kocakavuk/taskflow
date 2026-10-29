const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

// Testler gecici dosyalarla calissin, data/ degismesin
const suffix = `${process.pid}-${Date.now()}`;
process.env.DATA_FILE = path.join(os.tmpdir(), `taskflow-test-tasks-${suffix}.json`);
process.env.USERS_FILE = path.join(os.tmpdir(), `taskflow-test-users-${suffix}.json`);
process.env.LOG_FILE = path.join(os.tmpdir(), `taskflow-test-log-${suffix}.log`);
process.env.SESSION_SECRET = 'test-secret';

const app = require('../src/app');

let server;
let base;
let cookie = '';
let taskId;

function removeTempFiles() {
  [process.env.DATA_FILE, process.env.USERS_FILE, process.env.LOG_FILE].forEach((file) => {
    try {
      fs.unlinkSync(file);
    } catch {
      // yoksa sorun degil
    }
  });
}

async function api(method, url, body) {
  const headers = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(base + url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);

  if (setCookies.length) {
    cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, json };
}

before(async () => {
  removeTempFiles();

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  removeTempFiles();
});

test('saglik ucu calisiyor', async () => {
  const res = await api('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'ok');
  assert.equal(res.json.name, 'TaskFlow');
});

test('bozuk JSON istegi de loglaniyor', async () => {
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{x}',
  });

  assert.equal(res.status, 400);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const log = fs.readFileSync(process.env.LOG_FILE, 'utf8');
  assert.match(log, /POST\s+\/api\/auth\/login\s+400/);
});

test('giris yapmadan gorevler 401', async () => {
  const res = await api('GET', '/api/tasks');
  assert.equal(res.status, 401);
});

test('kayit olunuyor', async () => {
  const res = await api('POST', '/api/auth/register', {
    username: 'testuser',
    password: '123456',
    name: 'Test',
  });

  assert.equal(res.status, 201);
  assert.equal(res.json.data.username, 'testuser');
  assert.equal(res.json.data.passwordHash, undefined);
});

test('ayni kullanici adi tekrar alinamiyor', async () => {
  const res = await api('POST', '/api/auth/register', {
    username: 'testuser',
    password: '123456',
  });

  assert.equal(res.status, 409);
});

test('kisa sifre reddediliyor', async () => {
  const res = await api('POST', '/api/auth/register', {
    username: 'baskasi',
    password: '123',
  });

  assert.equal(res.status, 400);
});

test('yanlis sifreyle giris 401', async () => {
  const res = await api('POST', '/api/auth/login', {
    username: 'testuser',
    password: 'yanlis',
  });

  assert.equal(res.status, 401);
});

test('giris yapiliyor ve cerez geliyor', async () => {
  const res = await api('POST', '/api/auth/login', {
    username: 'testuser',
    password: '123456',
  });

  assert.equal(res.status, 200);
  assert.match(cookie, /taskflow\.sid=/);
});

test('oturumdaki kullanici donuyor', async () => {
  const res = await api('GET', '/api/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.json.data.username, 'testuser');
});

test('gorev ekleniyor', async () => {
  const res = await api('POST', '/api/tasks', {
    title: '  Sunum hazirla  ',
    assignee: '  samil  ',
    priority: 'high',
  });

  assert.equal(res.status, 201);
  assert.equal(res.json.data.title, 'Sunum hazirla');
  assert.equal(res.json.data.assignee, 'samil');
  assert.equal(res.json.data.status, 'todo');
  taskId = res.json.data.id;
});

test('gorev listeleniyor', async () => {
  const res = await api('GET', '/api/tasks');
  assert.equal(res.status, 200);
  assert.equal(res.json.total, 1);
  assert.equal(res.json.limit, 10);
});

test('gorev detayi geliyor', async () => {
  const res = await api('GET', `/api/tasks/${taskId}`);
  assert.equal(res.status, 200);
  assert.equal(res.json.data.id, taskId);
});

test('gorev PUT ile guncelleniyor', async () => {
  const res = await api('PUT', `/api/tasks/${taskId}`, { status: 'in-progress' });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.status, 'in-progress');
});

test('gorev PATCH ile guncelleniyor', async () => {
  const res = await api('PATCH', `/api/tasks/${taskId}`, { priority: 'low' });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.priority, 'low');
  assert.equal(res.json.data.status, 'in-progress');
});

test('null enum degerleri reddediliyor, bos project genele donuyor', async () => {
  for (const field of ['status', 'priority', 'project']) {
    const res = await api('PATCH', `/api/tasks/${taskId}`, { [field]: null });
    assert.equal(res.status, 400);
  }

  const project = await api('PATCH', `/api/tasks/${taskId}`, { project: '   ' });
  assert.equal(project.status, 200);
  assert.equal(project.json.data.project, 'genel');
});

test('eksik alan 400 donuyor', async () => {
  const res = await api('POST', '/api/tasks', { assignee: 'samil' });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.includes('title zorunlu'));
});

test('gecersiz priority 400 donuyor', async () => {
  const res = await api('POST', '/api/tasks', {
    title: 'deneme',
    assignee: 'samil',
    priority: 'urgent',
  });

  assert.equal(res.status, 400);
});

test('bos guncelleme 400 donuyor', async () => {
  const res = await api('PUT', `/api/tasks/${taskId}`, {});
  assert.equal(res.status, 400);
});

test('olmayan gorev 404 donuyor', async () => {
  const res = await api('GET', '/api/tasks/9999');
  assert.equal(res.status, 404);
});

test('arama calisiyor', async () => {
  const res = await api('GET', '/api/tasks/search?keyword=sunum');
  assert.equal(res.status, 200);
  assert.equal(res.json.total, 1);
});

test('keyword olmadan arama 400', async () => {
  const res = await api('GET', '/api/tasks/search');
  assert.equal(res.status, 400);
});

test('filtre ve sayfalama calisiyor', async () => {
  await api('POST', '/api/tasks', { title: 'ikinci', assignee: 'samil', priority: 'high' });
  await api('POST', '/api/tasks', { title: 'ucuncu', assignee: 'kerem' });

  const filtered = await api('GET', '/api/tasks?priority=high');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.json.total, 1);

  const page = await api('GET', '/api/tasks?page=1&limit=2');
  assert.equal(page.json.count, 2);
});

test('raporlar donuyor', async () => {
  const summary = await api('GET', '/api/reports/summary');
  assert.equal(summary.status, 200);
  assert.equal(summary.json.data.total, 3);

  const pending = await api('GET', '/api/reports/pending');
  assert.equal(pending.status, 200);
  assert.equal(pending.json.count, 3);
});

test('gorev siliniyor', async () => {
  const res = await api('DELETE', `/api/tasks/${taskId}`);
  assert.equal(res.status, 200);

  const gone = await api('GET', `/api/tasks/${taskId}`);
  assert.equal(gone.status, 404);
});

test('silinen id tekrar kullanilmiyor', async () => {
  const res = await api('POST', '/api/tasks', { title: 'yeni', assignee: 'samil' });
  assert.notEqual(res.json.data.id, taskId);

  await api('DELETE', `/api/tasks/${res.json.data.id}`);
});

test('ayni anda gelen yazmalar kaybolmuyor', async () => {
  const before = (await api('GET', '/api/tasks')).json.total;

  const statuses = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      api('POST', '/api/tasks', { title: `paralel ${i}`, assignee: 'test' })
        .then((r) => r.status)
    )
  );

  const after = (await api('GET', '/api/tasks')).json.total;

  assert.deepEqual(statuses, Array(10).fill(201));
  assert.equal(after, before + 10);
});

test('cikis yapilinca oturum kapaniyor', async () => {
  const out = await api('POST', '/api/auth/logout');
  assert.equal(out.status, 200);

  const res = await api('GET', '/api/tasks');
  assert.equal(res.status, 401);
});
