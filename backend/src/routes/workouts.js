const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const CALORIES_PER_SET = {
  'bench-press':8,'incline-bench-press':8,'decline-bench-press':7,'dumbbell-bench-press':7,
  'dumbbell-fly':5,'cable-fly':5,'push-up':6,'diamond-push-up':7,'chest-dip':8,'pec-deck':4,
  'squat':10,'front-squat':10,'goblet-squat':7,'deadlift':12,'sumo-deadlift':11,
  'romanian-deadlift':9,'leg-press':8,'leg-extension':5,'leg-curl':5,'lunges':7,
  'walking-lunges':8,'bulgarian-split-squat':8,'hack-squat':8,'step-up':6,
  'pull-up':8,'chin-up':8,'barbell-row':8,'dumbbell-row':6,'seated-cable-row':6,
  'lat-pulldown':6,'t-bar-row':8,'face-pull':4,'hyperextension':5,'straight-arm-pulldown':5,
  'overhead-press':7,'dumbbell-shoulder-press':7,'arnold-press':7,'lateral-raise':4,
  'front-raise':4,'rear-delt-fly':4,'upright-row':6,'shrug':4,'cable-lateral-raise':4,
  'dumbbell-curl':4,'hammer-curl':4,'barbell-curl':5,'preacher-curl':4,
  'concentration-curl':3,'cable-curl':4,'incline-dumbbell-curl':4,
  'tricep-pushdown':4,'close-grip-bench-press':7,'overhead-tricep-extension':5,
  'skull-crusher':5,'tricep-dip':7,'kickback':3,'rope-pushdown':4,
  'plank':4,'crunch':4,'russian-twist':5,'leg-raise':5,'hanging-leg-raise':6,
  'mountain-climber':8,'ab-wheel-rollout':6,'bicycle-crunch':5,'dead-bug':4,
  'hip-thrust':8,'glute-bridge':5,'cable-pull-through':6,'donkey-kick':4,
  'calf-raise':4,'seated-calf-raise':3,'single-leg-calf-raise':3,
  'wrist-curl':2,'reverse-wrist-curl':2,'farmer-walk':7,
  'kettlebell-swing':10,'kettlebell-goblet-squat':7,'kettlebell-clean-press':9,
  'kettlebell-snatch':10,'kettlebell-turkish-getup':8,
  'resistance-band-pull-apart':3,'band-squat':5,'band-row':4,'band-chest-press':4,'band-lateral-walk':5,
  'box-jump':9,'burpee':12,'jumping-jack':6,'jump-squat':9,'high-knees':7,
  'cable-woodchop':5,'pallof-press':4,'dumbbell-pullover':6,'landmine-press':6,
  'single-arm-farmer-carry':6,'smith-squat':8,'smith-bench-press':7,
  'chest-press-machine':5,'shoulder-press-machine':5,'lat-pulldown-close':6,
  'reverse-fly-machine':4,'cable-crossover':5,
};
const DEFAULT_CAL = 5;

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
    const { id, name, exercises } = req.body;
    if (!name || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'name и exercises обязательны' });
    }

    await client.query('BEGIN');

    let wResult;
    if (id) {
      wResult = await client.query(
        `INSERT INTO workouts (id, user_id, name) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, created_at`,
        [id, req.userId, name]
      );
    } else {
      wResult = await client.query(
        `INSERT INTO workouts (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at`,
        [req.userId, name]
      );
    }
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

    const calQuery = await pool.query(
      `SELECT le.exercise_id, COUNT(cs.*) AS completed_sets
       FROM workout_logs l
       JOIN workout_log_exercises le ON le.log_id = l.id
       JOIN completed_sets cs ON cs.log_exercise_id = le.id AND cs.completed = true
       WHERE l.user_id = $1
       GROUP BY le.exercise_id`,
      [req.userId]
    );
    let totalCalories = 0;
    for (const r of calQuery.rows) {
      totalCalories += (CALORIES_PER_SET[r.exercise_id] || DEFAULT_CAL) * parseInt(r.completed_sets);
    }

    const weekCalQuery = await pool.query(
      `SELECT le.exercise_id, COUNT(cs.*) AS completed_sets
       FROM workout_logs l
       JOIN workout_log_exercises le ON le.log_id = l.id
       JOIN completed_sets cs ON cs.log_exercise_id = le.id AND cs.completed = true
       WHERE l.user_id = $1 AND l.date >= $2
       GROUP BY le.exercise_id`,
      [req.userId, weekStart.toISOString().slice(0, 10)]
    );
    let weekCalories = 0;
    for (const r of weekCalQuery.rows) {
      weekCalories += (CALORIES_PER_SET[r.exercise_id] || DEFAULT_CAL) * parseInt(r.completed_sets);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCalQuery = await pool.query(
      `SELECT le.exercise_id, COUNT(cs.*) AS completed_sets
       FROM workout_logs l
       JOIN workout_log_exercises le ON le.log_id = l.id
       JOIN completed_sets cs ON cs.log_exercise_id = le.id AND cs.completed = true
       WHERE l.user_id = $1 AND l.date = $2
       GROUP BY le.exercise_id`,
      [req.userId, todayStr]
    );
    let todayCalories = 0;
    for (const r of todayCalQuery.rows) {
      todayCalories += (CALORIES_PER_SET[r.exercise_id] || DEFAULT_CAL) * parseInt(r.completed_sets);
    }

    res.json({
      totalWorkouts: parseInt(totalWorkouts.rows[0].count),
      totalMinutes: parseInt(totalMinutes.rows[0].total),
      weekWorkouts: parseInt(weekWorkouts.rows[0].count),
      weekMinutes: parseInt(weekMinutes.rows[0].total),
      totalCalories,
      weekCalories,
      todayCalories,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/scheduled', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_name AS "workoutName", date, time
       FROM scheduled_workouts WHERE user_id = $1 AND date >= CURRENT_DATE ORDER BY date, time`,
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
    const { id, workoutId, workoutName, date, time } = req.body;
    let result;
    if (id) {
      result = await pool.query(
        `INSERT INTO scheduled_workouts (id, user_id, workout_id, workout_name, date, time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET workout_name = EXCLUDED.workout_name, date = EXCLUDED.date, time = EXCLUDED.time
         RETURNING id, workout_id AS "workoutId", workout_name AS "workoutName", date, time`,
        [id, req.userId, workoutId, workoutName, date, time || null]
      );
    } else {
      result = await pool.query(
        `INSERT INTO scheduled_workouts (user_id, workout_id, workout_name, date, time)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, workout_id AS "workoutId", workout_name AS "workoutName", date, time`,
        [req.userId, workoutId, workoutName, date, time || null]
      );
    }
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


router.post('/sync', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { actions = [], lastSync } = req.body;
    await client.query('BEGIN');

    const results = { processed: 0, errors: [] };

    for (const action of actions) {
      try {
        if (action.entity === 'workout' && action.action === 'create' && action.payload) {
          const p = action.payload;
          const exists = await client.query('SELECT id FROM workouts WHERE id = $1 AND user_id = $2', [action.entity_id, req.userId]);
          if (exists.rows.length === 0) {
            await client.query(
              `INSERT INTO workouts (id, user_id, name, created_at) VALUES ($1, $2, $3, to_timestamp($4/1000.0))`,
              [action.entity_id, req.userId, p.name, p.createdAt]
            );
            if (p.exercises) {
              for (let i = 0; i < p.exercises.length; i++) {
                const ex = p.exercises[i];
                await client.query(
                  `INSERT INTO workout_exercises (workout_id, exercise_id, exercise_order, sets, reps, rest_seconds) VALUES ($1, $2, $3, $4, $5, $6)`,
                  [action.entity_id, ex.exerciseId, i, ex.sets || 3, ex.reps || 10, ex.restSeconds || 60]
                );
              }
            }
          }
          results.processed++;
        }

        if (action.entity === 'workout' && action.action === 'delete') {
          await client.query('DELETE FROM workouts WHERE id = $1 AND user_id = $2', [action.entity_id, req.userId]);
          results.processed++;
        }

        if (action.entity === 'workout_log' && action.action === 'create' && action.payload) {
          const p = action.payload;
          const exists = await client.query('SELECT id FROM workout_logs WHERE id = $1 AND user_id = $2', [action.entity_id, req.userId]);
          if (exists.rows.length === 0) {
            await client.query(
              `INSERT INTO workout_logs (id, user_id, workout_id, workout_name, date, started_at, completed_at, duration_minutes) VALUES ($1, $2, $3, $4, $5, to_timestamp($6/1000.0), to_timestamp($7/1000.0), $8)`,
              [action.entity_id, req.userId, p.workoutId, p.workoutName, p.date, p.startedAt, p.completedAt, p.durationMinutes]
            );
            if (p.exercises) {
              for (const ex of p.exercises) {
                const leResult = await client.query(
                  `INSERT INTO workout_log_exercises (log_id, exercise_id, target_sets, target_reps, rest_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                  [action.entity_id, ex.exerciseId, ex.targetSets, ex.targetReps, ex.restSeconds]
                );
                const leId = leResult.rows[0].id;
                if (ex.sets) {
                  for (let s = 0; s < ex.sets.length; s++) {
                    await client.query(
                      `INSERT INTO completed_sets (log_exercise_id, set_order, reps, completed) VALUES ($1, $2, $3, $4)`,
                      [leId, s, ex.sets[s].reps, ex.sets[s].completed]
                    );
                  }
                }
              }
            }
          }
          results.processed++;
        }

        if (action.entity === 'scheduled' && action.action === 'create' && action.payload) {
          const p = action.payload;
          const exists = await client.query('SELECT id FROM scheduled_workouts WHERE id = $1 AND user_id = $2', [action.entity_id, req.userId]);
          if (exists.rows.length === 0) {
            await client.query(
              `INSERT INTO scheduled_workouts (id, user_id, workout_id, workout_name, date, time) VALUES ($1, $2, $3, $4, $5, $6)`,
              [action.entity_id, req.userId, p.workoutId, p.workoutName, p.date, p.time || null]
            );
          }
          results.processed++;
        }

        if (action.entity === 'scheduled' && action.action === 'delete') {
          await client.query('DELETE FROM scheduled_workouts WHERE id = $1 AND user_id = $2', [action.entity_id, req.userId]);
          results.processed++;
        }
      } catch (actionErr) {
        results.errors.push({ entity_id: action.entity_id, error: actionErr.message });
      }
    }

    await client.query('COMMIT');

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

    const logsQuery = await pool.query(
      `SELECT l.id, l.workout_id AS "workoutId", l.workout_name AS "workoutName",
              l.date, l.started_at AS "startedAt", l.completed_at AS "completedAt",
              l.duration_minutes AS "durationMinutes"
       FROM workout_logs l
       WHERE l.user_id = $1
       ORDER BY l.started_at DESC
       LIMIT 200`,
      [req.userId]
    );

    const logsFull = [];
    for (const log of logsQuery.rows) {
      const exRows = await pool.query(
        `SELECT le.id, le.exercise_id AS "exerciseId", le.target_sets AS "targetSets",
                le.target_reps AS "targetReps", le.rest_seconds AS "restSeconds"
         FROM workout_log_exercises le WHERE le.log_id = $1 ORDER BY le.id`,
        [log.id]
      );
      const exercises = [];
      for (const ex of exRows.rows) {
        const setRows = await pool.query(
          `SELECT reps, completed FROM completed_sets WHERE log_exercise_id = $1 ORDER BY set_order`,
          [ex.id]
        );
        exercises.push({
          exerciseId: ex.exerciseId,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds,
          sets: setRows.rows,
        });
      }
      logsFull.push({ ...log, exercises });
    }

    const scheduled = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_name AS "workoutName", date, time
       FROM scheduled_workouts WHERE user_id = $1 AND date >= CURRENT_DATE ORDER BY date, time`,
      [req.userId]
    );

    res.json({
      processed: results.processed,
      errors: results.errors,
      serverTime: new Date().toISOString(),
      data: {
        workouts: workouts.rows.map(w => ({
          ...w,
          exercises: w.exercises[0] === null ? [] : w.exercises,
        })),
        logs: logsFull,
        scheduled: scheduled.rows,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Ошибка синхронизации' });
  } finally {
    client.release();
  }
});


router.get('/water', authMiddleware, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const row = await pool.query(
      'SELECT glasses, target_ml FROM water_intake WHERE user_id = $1 AND date = $2',
      [req.userId, date]
    );
    res.json({
      date,
      glasses: row.rows[0]?.glasses || 0,
      targetMl: row.rows[0]?.target_ml || 2000,
    });
  } catch (err) {
    console.error('Get water error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/water/week', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const rows = await pool.query(
      `SELECT date::text, glasses FROM water_intake
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date`,
      [req.userId, dates[0], dates[6]]
    );
    const map = {};
    for (const r of rows.rows) map[r.date] = r.glasses;

    res.json(dates.map(d => ({ date: d, glasses: map[d] || 0 })));
  } catch (err) {
    console.error('Get water week error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/water', authMiddleware, async (req, res) => {
  try {
    const { glasses, targetMl, date } = req.body;
    const d = date || new Date().toISOString().slice(0, 10);
    const g = Math.max(0, parseInt(glasses) || 0);
    const t = parseInt(targetMl) || 2000;

    await pool.query(
      `INSERT INTO water_intake (user_id, date, glasses, target_ml, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, date) DO UPDATE SET glasses = $3, target_ml = $4, updated_at = now()`,
      [req.userId, d, g, t]
    );
    res.json({ date: d, glasses: g, targetMl: t });
  } catch (err) {
    console.error('Save water error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
