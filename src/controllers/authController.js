const userService = require('../services/userService');

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function register(req, res) {
  const { username, password, name } = req.body || {};
  const errors = [];

  if (!isText(username)) {
    errors.push('username zorunlu');
  } else if (username.trim().length < 3 || username.trim().length > 30) {
    errors.push('username 3-30 karakter olmali');
  }

  if (!isText(password)) {
    errors.push('password zorunlu');
  } else if (password.length < 6) {
    errors.push('password en az 6 karakter olmali');
  } else if (password.length > 100) {
    errors.push('password en fazla 100 karakter olmali');
  }

  if (name !== undefined && name !== null && typeof name !== 'string') {
    errors.push('name metin olmali');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Gecersiz veri', errors });
  }

  const user = await userService.create({ username, password, name });

  return res.status(201).json({
    success: true,
    message: 'Kullanici olusturuldu.',
    data: user,
  });
}

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!isText(username) || !isText(password)) {
    return res.status(400).json({
      success: false,
      message: 'username ve password zorunlu',
    });
  }

  const user = await userService.login(username, password);

  // Oturum sabitlemeyi onlemek icin yeni oturum ac
  return req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    return res.json({
      success: true,
      message: 'Giris yapildi.',
      data: user,
    });
  });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('taskflow.sid');
    res.json({ success: true, message: 'Cikis yapildi.' });
  });
}

async function me(req, res) {
  const user = await userService.getById(req.session.userId);

  req.session.touch();
  res.json({ success: true, data: user });
}

module.exports = { register, login, logout, me };
