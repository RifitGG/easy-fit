const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { muscle, equipment, difficulty, search } = req.query;

    let sql = `
      SELECT e.id, e.name, e.equipment, e.difficulty, e.description,
             array_agg(DISTINCT em.muscle_group) AS "muscleGroups"
      FROM exercises e
      LEFT JOIN exercise_muscles em ON em.exercise_id = e.id
    `;
    const conditions = [];
    const params = [];

    if (muscle) {
      params.push(muscle);
      conditions.push(`em.muscle_group = $${params.length}::muscle_group`);
    }
    if (equipment) {
      params.push(equipment);
      conditions.push(`e.equipment = $${params.length}::equipment_type`);
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`e.difficulty = $${params.length}::difficulty_level`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(e.name) LIKE $${params.length} OR LOWER(e.description) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY e.id ORDER BY e.name';

    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      ...r,
      muscleGroups: Array.isArray(r.muscleGroups)
        ? r.muscleGroups.filter(Boolean)
        : typeof r.muscleGroups === 'string'
          ? r.muscleGroups.replace(/[{}]/g, '').split(',').filter(Boolean)
          : [],
    }));
    res.json(rows);
  } catch (err) {
    console.error('Get exercises error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exResult = await pool.query(
      `SELECT e.id, e.name, e.equipment, e.difficulty, e.description,
              array_agg(DISTINCT em.muscle_group) AS "muscleGroups"
       FROM exercises e
       LEFT JOIN exercise_muscles em ON em.exercise_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id]
    );

    if (exResult.rows.length === 0) {
      return res.status(404).json({ error: 'Упражнение не найдено' });
    }

    const stepsResult = await pool.query(
      `SELECT text FROM exercise_steps WHERE exercise_id = $1 ORDER BY step_order`,
      [req.params.id]
    );

    const exercise = exResult.rows[0];
    exercise.muscleGroups = Array.isArray(exercise.muscleGroups)
      ? exercise.muscleGroups.filter(Boolean)
      : typeof exercise.muscleGroups === 'string'
        ? exercise.muscleGroups.replace(/[{}]/g, '').split(',').filter(Boolean)
        : [];
    exercise.steps = stepsResult.rows.map(r => r.text);

    res.json(exercise);
  } catch (err) {
    console.error('Get exercise error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
