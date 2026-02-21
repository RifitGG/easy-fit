const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await pool.query(
      `SELECT w.id, w.name, w.created_at,
              json_agg(
                json_build_object(
                  'exerciseId', we.exercise_id,
                  'sets', we.sets,
                  'reps', we.reps,
                  'restSeconds', we.rest_seconds
                ) ORDER BY we.exercise_order
              ) AS exercises
       FROM workouts w
       LEFT JOIN workout_exercises we ON we.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    
    const result = workouts.rows.map(w => ({
      ...w,
      exercises: w.exercises[0] === null ? [] : w.exercises,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get workouts error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, exercises } = req.body;
    if (!name || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'name и exercises обязательны' });
    }

    await client.query('BEGIN');

    const wResult = await client.query(
      `INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at`,
      [req.userId, name]
    );
    const workout = wResult.rows[0];

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await client.query(
        `INSERT INTO workout_exercises (workout_id, exercise_id, exercise_order, sets, reps, rest_seconds)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [workout.id, ex.exerciseId, i, ex.sets || 3, ex.reps || 10, ex.restSeconds || 60]
      );
    }

    await client.query('COMMIT');

    workout.exercises = exercises;
    res.status(201).json(workout);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create workout error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Тренировка не найдена' });
    }
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('Delete workout error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


router.post('/logs', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { workoutId, workoutName, date, startedAt, completedAt, durationMinutes, exercises } = req.body;

    await client.query('BEGIN');

    const logResult = await client.query(
      `INSERT INTO workout_logs (user_id, workout_id, workout_name, date, started_at, completed_at, duration_minutes)
       VALUES ($1, $2, $3, $4, to_timestamp($5/1000.0), to_timestamp($6/1000.0), $7)
       RETURNING id`,
      [req.userId, workoutId, workoutName, date, startedAt, completedAt, durationMinutes]
    );
    const logId = logResult.rows[0].id;

    for (const ex of exercises) {
      const leResult = await client.query(
        `INSERT INTO workout_log_exercises (log_id, exercise_id, target_sets, target_reps, rest_seconds)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [logId, ex.exerciseId, ex.targetSets, ex.targetReps, ex.restSeconds]
      );
      const leId = leResult.rows[0].id;

      for (let s = 0; s < ex.sets.length; s++) {
        await client.query(
          `INSERT INTO completed_sets (log_exercise_id, set_order, reps, completed)
           VALUES ($1, $2, $3, $4)`,
          [leId, s, ex.sets[s].reps, ex.sets[s].completed]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: logId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save log error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const logs = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_name AS "workoutName",
              date, started_at AS "startedAt", completed_at AS "completedAt",
              duration_minutes AS "durationMinutes"
       FROM workout_logs
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 100`,
      [req.userId]
    );
    res.json(logs.rows);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalWorkouts = await pool.query(
      'SELECT COUNT(*) as count FROM workout_logs WHERE user_id = $1',
      [req.userId]
    );

    const totalMinutes = await pool.query(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM workout_logs WHERE user_id = $1',
      [req.userId]
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekWorkouts = await pool.query(
      'SELECT COUNT(*) as count FROM workout_logs WHERE user_id = $1 AND date >= $2',
      [req.userId, weekStart.toISOString().slice(0, 10)]
    );

    const weekMinutes = await pool.query(
      'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM workout_logs WHERE user_id = $1 AND date >= $2',
      [req.userId, weekStart.toISOString().slice(0, 10)]
    );

    res.json({
      totalWorkouts: parseInt(totalWorkouts.rows[0].count),
      totalMinutes: parseInt(totalMinutes.rows[0].total),
      weekWorkouts: parseInt(weekWorkouts.rows[0].count),
      weekMinutes: parseInt(weekMinutes.rows[0].total),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/scheduled', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_name AS "workoutName", date
       FROM scheduled_workouts WHERE user_id = $1 ORDER BY date`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get scheduled error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/scheduled', authMiddleware, async (req, res) => {
  try {
    const { workoutId, workoutName, date } = req.body;
    const result = await pool.query(
      `INSERT INTO scheduled_workouts (user_id, workout_id, workout_name, date)
       VALUES ($1, $2, $3, $4) RETURNING id, workout_id AS "workoutId", workout_name AS "workoutName", date`,
      [req.userId, workoutId, workoutName, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/scheduled/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM scheduled_workouts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('Delete scheduled error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
