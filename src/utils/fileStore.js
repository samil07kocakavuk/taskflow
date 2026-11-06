const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

const queues = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withLock(key, task) {
  const previous = queues.get(key) || Promise.resolve();
  const current = previous.then(task, task);

  queues.set(key, current.then(
    () => undefined,
    () => undefined
  ));

  return current;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function ensureFile(file, initial) {
  if (await exists(file)) {
    return;
  }

  await fs.mkdir(path.dirname(file), { recursive: true });

  try {
    await fs.writeFile(file, JSON.stringify(initial, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
    });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function renameWithRetry(from, to, attempts = 5) {
  let lastError;

  for (let i = 0; i < attempts; i += 1) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      lastError = err;

      const retryable = ['EPERM', 'EACCES', 'EBUSY'].includes(err.code);
      if (!retryable || i === attempts - 1) throw err;

      await sleep(20 * (i + 1));
    }
  }

  throw lastError;
}

async function writeJsonAtomic(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });

  const temp = `${file}.${process.pid}.${Date.now()}.${Math.random()
    .toString(16)
    .slice(2)}.tmp`;

  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');

  try {
    await renameWithRetry(temp, file);
  } catch (err) {
    await fs.unlink(temp).catch(() => {});
    throw err;
  }
}

async function readJson(file, fallback) {
  await ensureFile(file, fallback);

  const raw = await fs.readFile(file, 'utf8');
  if (!raw.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Veri dosyasi okunamadi (bozuk JSON): ${file}`);
  }
}

module.exports = {
  readJson,
  writeJsonAtomic,
  withLock,
};
