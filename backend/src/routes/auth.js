const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

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
       RETURNING id, email, name, avatar_url, height_cm, weight_kg, birth_date, goal, created_at`,
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
      `SELECT id, email, password_hash, name, avatar_url, height_cm, weight_kg, birth_date, goal, created_at
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
      `SELECT id, email, name, avatar_url, height_cm, weight_kg, birth_date, goal, created_at
       FROM users WHERE id = $1`,
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
       RETURNING id, email, name, avatar_url, height_cm, weight_kg, birth_date, goal, created_at`,
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
