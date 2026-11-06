const crypto = require('crypto');
const config = require('../config');
const { readJson, writeJsonAtomic, withLock } = require('../utils/fileStore');
const HttpError = require('../utils/HttpError');

const EMPTY = { nextId: 1, users: [] };

function normalize(store) {
  const users = Array.isArray(store && store.users) ? store.users : [];
  const maxId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
  const stored = Number(store && store.nextId);

  return {
    nextId: Number.isInteger(stored) && stored > maxId ? stored : maxId + 1,
    users,
  };
}

async function load() {
  return normalize(await readJson(config.usersFile, EMPTY));
}

function sanitize(user) {
  return { id: user.id, username: user.username, name: user.name };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const actual = crypto.scryptSync(password, parts[1], 64);
  const expected = Buffer.from(parts[2], 'hex');

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function create({ username, password, name }) {
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanName = name ? String(name).trim() : cleanUsername;

  return withLock(config.usersFile, async () => {
    const store = await load();

    if (store.users.some((u) => u.username === cleanUsername)) {
      throw new HttpError(409, 'Bu kullanici adi alinmis');
    }

    const user = {
      id: store.nextId,
      username: cleanUsername,
      name: cleanName,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    store.users.push(user);
    store.nextId += 1;
    await writeJsonAtomic(config.usersFile, store);

    return sanitize(user);
  });
}

async function login(username, password) {
  const cleanUsername = String(username).trim().toLowerCase();
  const { users } = await load();
  const user = users.find((u) => u.username === cleanUsername);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'Kullanici adi veya sifre hatali');
  }

  return sanitize(user);
}

async function getById(id) {
  const { users } = await load();
  const user = users.find((u) => u.id === Number(id));

  if (!user) {
    throw new HttpError(401, 'Oturum gecersiz');
  }

  return sanitize(user);
}

module.exports = {
  create,
  login,
  getById,
};
