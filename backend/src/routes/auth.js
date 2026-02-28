const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pool = require('../db/pool');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const USER_FIELDS = 'id, email, name, avatar_url, avatar_original_url, height_cm, weight_kg, birth_date, goal, created_at';

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'original_' + req.userId + '_' + Date.now() + ext);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Только изображения (jpg, png, gif, webp)'));
  }
});

async function cropImage(srcPath, cropX, cropY, cropW, cropH, userId) {
  const croppedName = 'avatar_' + userId + '_' + Date.now() + '.jpg';
  const croppedPath = path.join(AVATARS_DIR, croppedName);
  const meta = await sharp(srcPath).metadata();
  let x = Math.max(0, Math.min(cropX, meta.width - 1));
  let y = Math.max(0, Math.min(cropY, meta.height - 1));
  let w = Math.min(cropW, meta.width - x);
  let h = Math.min(cropH, meta.height - y);
  w = Math.max(1, w);
  h = Math.max(1, h);
  await sharp(srcPath)
    .extract({ left: x, top: y, width: w, height: h })
    .resize(400, 400)
    .jpeg({ quality: 85 })
    .toFile(croppedPath);
  return '/uploads/avatars/' + croppedName;
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password и name обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING ${USER_FIELDS}`,
      [email.toLowerCase(), passwordHash, name]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email и password обязательны' });
    }

    const result = await pool.query(
      `SELECT password_hash, ${USER_FIELDS}
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = generateToken(user.id);
    delete user.password_hash;

    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${USER_FIELDS} FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar_url, height_cm, weight_kg, birth_date, goal } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($2, name),
           avatar_url = COALESCE($3, avatar_url),
           height_cm = COALESCE($4, height_cm),
           weight_kg = COALESCE($5, weight_kg),
           birth_date = COALESCE($6, birth_date),
           goal = COALESCE($7, goal)
       WHERE id = $1
       RETURNING ${USER_FIELDS}`,
      [req.userId, name, avatar_url, height_cm, weight_kg, birth_date, goal]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/avatar', authMiddleware, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Файл слишком большой (макс. 5 МБ)' });
      }
      return res.status(400).json({ error: err.message || 'Ошибка загрузки' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });
    const originalUrl = '/uploads/avatars/' + req.file.filename;
    const originalPath = path.join(AVATARS_DIR, req.file.filename);

    const cx = parseInt(req.body.cropX);
    const cy = parseInt(req.body.cropY);
    const cw = parseInt(req.body.cropWidth);
    const ch = parseInt(req.body.cropHeight);

    let avatarUrl;
    if (cw > 0 && ch > 0 && !isNaN(cx) && !isNaN(cy)) {
      avatarUrl = await cropImage(originalPath, cx, cy, cw, ch, req.userId);
    } else {
      const meta = await sharp(originalPath).metadata();
      const side = Math.min(meta.width, meta.height);
      const left = Math.round((meta.width - side) / 2);
      const top = Math.round((meta.height - side) / 2);
      avatarUrl = await cropImage(originalPath, left, top, side, side, req.userId);
    }

    const result = await pool.query(
      `UPDATE users SET avatar_url = $2, avatar_original_url = $3 WHERE id = $1
       RETURNING ${USER_FIELDS}`,
      [req.userId, avatarUrl, originalUrl]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/avatar/crop', authMiddleware, async (req, res) => {
  try {
    const { cropX, cropY, cropWidth, cropHeight } = req.body;
    if (!cropWidth || !cropHeight) return res.status(400).json({ error: 'Не указаны параметры кадрирования' });

    const userRow = await pool.query('SELECT avatar_original_url FROM users WHERE id = $1', [req.userId]);
    if (!userRow.rows.length || !userRow.rows[0].avatar_original_url) {
      return res.status(400).json({ error: 'Оригинал аватара не найден' });
    }

    const origRelPath = userRow.rows[0].avatar_original_url;
    const origAbsPath = path.join(__dirname, '../..', origRelPath);
    if (!fs.existsSync(origAbsPath)) {
      return res.status(400).json({ error: 'Файл оригинала не найден' });
    }

    const avatarUrl = await cropImage(
      origAbsPath,
      parseInt(cropX), parseInt(cropY),
      parseInt(cropWidth), parseInt(cropHeight),
      req.userId
    );

    const result = await pool.query(
      `UPDATE users SET avatar_url = $2 WHERE id = $1
       RETURNING ${USER_FIELDS}`,
      [req.userId, avatarUrl]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Avatar crop error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password и new_password обязательны' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.userId, hash]);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
