const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'fitapp_secret';
  try {
    const decoded = jwt.verify(header.slice(7), secret);
    req.userId = decoded.id;
  } catch {
    req.userId = null;
  }
  next();
}

router.post('/publish', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { workoutId, title, description, difficulty } = req.body;
    if (!workoutId || !title) {
      return res.status(400).json({ error: 'workoutId и title обязательны' });
    }

    const wo = await client.query(
      'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
      [workoutId, req.userId]
    );
    if (wo.rows.length === 0) {
      return res.status(404).json({ error: 'Тренировка не найдена' });
    }

    const existing = await client.query(
      'SELECT id FROM published_workouts WHERE workout_id = $1 AND user_id = $2',
      [workoutId, req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Тренировка уже опубликована' });
    }

    const result = await client.query(
      `INSERT INTO published_workouts (workout_id, user_id, title, description, difficulty)
       VALUES ($1, $2, $3, $4, COALESCE($5::difficulty_level, 'intermediate'))
       RETURNING id, title, description, difficulty, views, likes_count, created_at`,
      [workoutId, req.userId, title, description || '', difficulty || 'intermediate']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, difficulty } = req.body;
    const result = await pool.query(
      `UPDATE published_workouts
       SET title = COALESCE($3, title),
           description = COALESCE($4, description),
           difficulty = COALESCE($5::difficulty_level, difficulty),
           updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, description, difficulty, views, likes_count, created_at, updated_at`,
      [req.params.id, req.userId, title, description, difficulty]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Публикация не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update published error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM published_workouts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Публикация не найдена' });
    }
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('Delete published error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort, difficulty, search, limit, offset } = req.query;
    const params = [];
    const conditions = [];

    if (difficulty) {
      params.push(difficulty);
      conditions.push(`pw.difficulty = $${params.length}::difficulty_level`);
    }
    if (search) {
      params.push('%' + search.toLowerCase() + '%');
      conditions.push(`(LOWER(pw.title) LIKE $${params.length} OR LOWER(pw.description) LIKE $${params.length})`);
    }

    let orderBy = 'pw.created_at DESC';
    if (sort === 'popular') orderBy = 'pw.likes_count DESC, pw.views DESC';
    if (sort === 'views') orderBy = 'pw.views DESC';

    const lim = Math.min(parseInt(limit) || 20, 50);
    const off = parseInt(offset) || 0;

    let sql = `
      SELECT pw.id, pw.title, pw.description, pw.difficulty,
             pw.views, pw.likes_count AS "likesCount",
             pw.created_at AS "createdAt",
             u.id AS "authorId", u.name AS "authorName",
             w.name AS "workoutName",
             (SELECT COUNT(*) FROM workout_exercises we WHERE we.workout_id = pw.workout_id) AS "exerciseCount"
    `;

    if (req.userId) {
      sql += `, EXISTS(SELECT 1 FROM published_workout_likes pl WHERE pl.published_id = pw.id AND pl.user_id = $${params.length + 1}) AS "liked"`;
      params.push(req.userId);
    }

    sql += `
      FROM published_workouts pw
      JOIN users u ON u.id = pw.user_id
      JOIN workouts w ON w.id = pw.workout_id
    `;

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY ${orderBy} LIMIT ${lim} OFFSET ${off}`;

    const result = await pool.query(sql, params);

    const rows = result.rows.map(r => ({
      ...r,
      exerciseCount: parseInt(r.exerciseCount),
      liked: r.liked === true || r.liked === 't',
    }));

    res.json(rows);
  } catch (err) {
    console.error('Get community error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE published_workouts SET views = views + 1 WHERE id = $1',
      [req.params.id]
    );

    const params = [req.params.id];
    let likedSql = '';
    if (req.userId) {
      params.push(req.userId);
      likedSql = `, EXISTS(SELECT 1 FROM published_workout_likes pl WHERE pl.published_id = pw.id AND pl.user_id = $2) AS "liked"`;
    }

    const result = await client.query(
      `SELECT pw.id, pw.title, pw.description, pw.difficulty,
              pw.views, pw.likes_count AS "likesCount",
              pw.created_at AS "createdAt",
              u.id AS "authorId", u.name AS "authorName",
              w.id AS "workoutId", w.name AS "workoutName"
              ${likedSql}
       FROM published_workouts pw
       JOIN users u ON u.id = pw.user_id
       JOIN workouts w ON w.id = pw.workout_id
       WHERE pw.id = $1`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Публикация не найдена' });
    }

    const pub = result.rows[0];
    pub.liked = pub.liked === true || pub.liked === 't';

    const exResult = await client.query(
      `SELECT we.exercise_id AS "exerciseId", we.sets, we.reps, we.rest_seconds AS "restSeconds",
              e.name AS "exerciseName"
       FROM workout_exercises we
       LEFT JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = $1
       ORDER BY we.exercise_order`,
      [pub.workoutId]
    );

    pub.exercises = exResult.rows;

    res.json(pub);
  } catch (err) {
    console.error('Get published detail error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT 1 FROM published_workout_likes WHERE user_id = $1 AND published_id = $2',
      [req.userId, req.params.id]
    );

    if (existing.rows.length > 0) {
      await client.query(
        'DELETE FROM published_workout_likes WHERE user_id = $1 AND published_id = $2',
        [req.userId, req.params.id]
      );
      await client.query(
        'UPDATE published_workouts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
        [req.params.id]
      );
      await client.query('COMMIT');
      return res.json({ liked: false });
    }

    await client.query(
      'INSERT INTO published_workout_likes (user_id, published_id) VALUES ($1, $2)',
      [req.userId, req.params.id]
    );
    await client.query(
      'UPDATE published_workouts SET likes_count = likes_count + 1 WHERE id = $1',
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ liked: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Like error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.post('/:id/copy', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const pub = await client.query(
      `SELECT pw.workout_id, w.name
       FROM published_workouts pw
       JOIN workouts w ON w.id = pw.workout_id
       WHERE pw.id = $1`,
      [req.params.id]
    );
    if (pub.rows.length === 0) {
      return res.status(404).json({ error: 'Публикация не найдена' });
    }

    const sourceId = pub.rows[0].workout_id;
    const name = pub.rows[0].name;

    await client.query('BEGIN');

    const wResult = await client.query(
      'INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [req.userId, name]
    );
    const newWorkout = wResult.rows[0];

    const exRows = await client.query(
      'SELECT exercise_id, exercise_order, sets, reps, rest_seconds FROM workout_exercises WHERE workout_id = $1 ORDER BY exercise_order',
      [sourceId]
    );

    for (const ex of exRows.rows) {
      await client.query(
        'INSERT INTO workout_exercises (workout_id, exercise_id, exercise_order, sets, reps, rest_seconds) VALUES ($1, $2, $3, $4, $5, $6)',
        [newWorkout.id, ex.exercise_id, ex.exercise_order, ex.sets, ex.reps, ex.rest_seconds]
      );
    }

    await client.query('COMMIT');

    newWorkout.exercises = exRows.rows.map(ex => ({
      exerciseId: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.rest_seconds,
    }));

    res.status(201).json(newWorkout);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Copy workout error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.get('/my/list', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pw.id, pw.title, pw.description, pw.difficulty,
              pw.views, pw.likes_count AS "likesCount",
              pw.created_at AS "createdAt",
              pw.workout_id AS "workoutId",
              w.name AS "workoutName"
       FROM published_workouts pw
       JOIN workouts w ON w.id = pw.workout_id
       WHERE pw.user_id = $1
       ORDER BY pw.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get my published error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
