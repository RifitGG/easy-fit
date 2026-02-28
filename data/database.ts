import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';
import {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutLog,
  CompletedExercise,
  CompletedSet,
  ScheduledWorkout,
  MuscleGroup,
  Equipment,
  Difficulty,
} from './types';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitError: string | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  try {
    db = await SQLite.openDatabaseAsync('fitapp.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await createTables(db);
    dbInitError = null;
  } catch (err: any) {
    const msg = `[DB] Init error: ${err?.message || err}`;
    console.error(msg);
    dbInitError = msg;
    throw err;
  }
  return db;
}

async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      equipment TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS exercise_muscles (
      exercise_id TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      PRIMARY KEY (exercise_id, muscle_group),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercise_steps (
      exercise_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (exercise_id, step_order),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      workout_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      sets INTEGER NOT NULL DEFAULT 3,
      reps INTEGER NOT NULL DEFAULT 10,
      rest_seconds INTEGER NOT NULL DEFAULT 60,
      PRIMARY KEY (workout_id, position),
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      date TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS log_exercises (
      log_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER NOT NULL DEFAULT 10,
      rest_seconds INTEGER NOT NULL DEFAULT 60,
      PRIMARY KEY (log_id, position),
      FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS log_sets (
      log_id TEXT NOT NULL,
      exercise_position INTEGER NOT NULL,
      set_index INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (log_id, exercise_position, set_index),
      FOREIGN KEY (log_id, exercise_position) REFERENCES log_exercises(log_id, position) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scheduled_workouts (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_workouts(date);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}


export async function upsertExercises(exercises: Exercise[]): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const ex of exercises) {
      await database.runAsync(
        'INSERT OR REPLACE INTO exercises (id, name, equipment, difficulty, description) VALUES (?, ?, ?, ?, ?)',
        ex.id, ex.name, ex.equipment, ex.difficulty, ex.description
      );
      await database.runAsync('DELETE FROM exercise_muscles WHERE exercise_id = ?', ex.id);
      for (const mg of ex.muscleGroups) {
        await database.runAsync(
          'INSERT OR IGNORE INTO exercise_muscles (exercise_id, muscle_group) VALUES (?, ?)',
          ex.id, mg
        );
      }
      if (ex.steps && ex.steps.length > 0) {
        await database.runAsync('DELETE FROM exercise_steps WHERE exercise_id = ?', ex.id);
        for (let i = 0; i < ex.steps.length; i++) {
          await database.runAsync(
            'INSERT INTO exercise_steps (exercise_id, step_order, text) VALUES (?, ?, ?)',
            ex.id, i, ex.steps[i]
          );
        }
      }
    }
  });
}

export async function upsertExerciseSteps(exerciseId: string, steps: string[]): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM exercise_steps WHERE exercise_id = ?', exerciseId);
    for (let i = 0; i < steps.length; i++) {
      await database.runAsync(
        'INSERT INTO exercise_steps (exercise_id, step_order, text) VALUES (?, ?, ?)',
        exerciseId, i, steps[i]
      );
    }
  });
}

export async function getAllExercises(): Promise<Exercise[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; name: string; equipment: string; difficulty: string; description: string;
  }>('SELECT * FROM exercises ORDER BY name');

  const exercises: Exercise[] = [];
  for (const row of rows) {
    const muscles = await database.getAllAsync<{ muscle_group: string }>(
      'SELECT muscle_group FROM exercise_muscles WHERE exercise_id = ?', row.id
    );
    const steps = await database.getAllAsync<{ text: string }>(
      'SELECT text FROM exercise_steps WHERE exercise_id = ? ORDER BY step_order', row.id
    );
    exercises.push({
      id: row.id,
      name: row.name,
      equipment: row.equipment as Equipment,
      difficulty: row.difficulty as Difficulty,
      description: row.description,
      muscleGroups: muscles.map(m => m.muscle_group as MuscleGroup),
      steps: steps.map(s => s.text),
    });
  }
  return exercises;
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    id: string; name: string; equipment: string; difficulty: string; description: string;
  }>('SELECT * FROM exercises WHERE id = ?', id);
  if (!row) return null;

  const muscles = await database.getAllAsync<{ muscle_group: string }>(
    'SELECT muscle_group FROM exercise_muscles WHERE exercise_id = ?', id
  );
  const steps = await database.getAllAsync<{ text: string }>(
    'SELECT text FROM exercise_steps WHERE exercise_id = ? ORDER BY step_order', id
  );
  return {
    id: row.id,
    name: row.name,
    equipment: row.equipment as Equipment,
    difficulty: row.difficulty as Difficulty,
    description: row.description,
    muscleGroups: muscles.map(m => m.muscle_group as MuscleGroup),
    steps: steps.map(s => s.text),
  };
}

export async function getFilteredExercises(filters: {
  muscle?: string; equipment?: string; difficulty?: string; search?: string;
}): Promise<Exercise[]> {
  const database = await getDb();
  let sql = 'SELECT DISTINCT e.* FROM exercises e';
  const params: any[] = [];

  if (filters.muscle) {
    sql += ' JOIN exercise_muscles em ON em.exercise_id = e.id';
  }

  const conditions: string[] = [];
  if (filters.muscle) {
    conditions.push('em.muscle_group = ?');
    params.push(filters.muscle);
  }
  if (filters.equipment) {
    conditions.push('e.equipment = ?');
    params.push(filters.equipment);
  }
  if (filters.difficulty) {
    conditions.push('e.difficulty = ?');
    params.push(filters.difficulty);
  }
  if (filters.search) {
    conditions.push('(LOWER(e.name) LIKE ? OR LOWER(e.description) LIKE ?)');
    const term = '%' + filters.search.toLowerCase() + '%';
    params.push(term, term);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY e.name';

  const rows = await database.getAllAsync<{
    id: string; name: string; equipment: string; difficulty: string; description: string;
  }>(sql, ...params);

  const exercises: Exercise[] = [];
  for (const row of rows) {
    const muscles = await database.getAllAsync<{ muscle_group: string }>(
      'SELECT muscle_group FROM exercise_muscles WHERE exercise_id = ?', row.id
    );
    exercises.push({
      id: row.id,
      name: row.name,
      equipment: row.equipment as Equipment,
      difficulty: row.difficulty as Difficulty,
      description: row.description,
      muscleGroups: muscles.map(m => m.muscle_group as MuscleGroup),
      steps: [],
    });
  }
  return exercises;
}


export async function saveWorkoutLocal(workout: Workout): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT OR REPLACE INTO workouts (id, name, created_at) VALUES (?, ?, ?)',
      workout.id, workout.name, workout.createdAt
    );
    await database.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', workout.id);
    for (let i = 0; i < workout.exercises.length; i++) {
      const we = workout.exercises[i];
      await database.runAsync(
        'INSERT INTO workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)',
        workout.id, i, we.exerciseId, we.sets, we.reps, we.restSeconds
      );
    }
  });
}

export async function getAllWorkoutsLocal(): Promise<Workout[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; name: string; created_at: number;
  }>('SELECT * FROM workouts ORDER BY created_at DESC');

  const workouts: Workout[] = [];
  for (const row of rows) {
    const exRows = await database.getAllAsync<{
      exercise_id: string; sets: number; reps: number; rest_seconds: number;
    }>('SELECT exercise_id, sets, reps, rest_seconds FROM workout_exercises WHERE workout_id = ? ORDER BY position', row.id);

    workouts.push({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      exercises: exRows.map(e => ({
        exerciseId: e.exercise_id,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.rest_seconds,
      })),
    });
  }
  return workouts;
}

export async function deleteWorkoutLocal(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM workouts WHERE id = ?', id);
}


export async function saveWorkoutLogLocal(log: WorkoutLog): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT OR REPLACE INTO workout_logs (id, workout_id, workout_name, date, started_at, completed_at, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      log.id, log.workoutId, log.workoutName, log.date, log.startedAt, log.completedAt, log.durationMinutes
    );
    await database.runAsync('DELETE FROM log_exercises WHERE log_id = ?', log.id);
    for (let i = 0; i < log.exercises.length; i++) {
      const ce = log.exercises[i];
      await database.runAsync(
        'INSERT INTO log_exercises (log_id, position, exercise_id, target_sets, target_reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)',
        log.id, i, ce.exerciseId, ce.targetSets, ce.targetReps, ce.restSeconds
      );
      for (let j = 0; j < ce.sets.length; j++) {
        await database.runAsync(
          'INSERT INTO log_sets (log_id, exercise_position, set_index, reps, completed) VALUES (?, ?, ?, ?, ?)',
          log.id, i, j, ce.sets[j].reps, ce.sets[j].completed ? 1 : 0
        );
      }
    }
  });
}

export async function getAllWorkoutLogsLocal(): Promise<WorkoutLog[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; workout_id: string; workout_name: string; date: string;
    started_at: number; completed_at: number; duration_minutes: number;
  }>('SELECT * FROM workout_logs ORDER BY started_at DESC');

  const logs: WorkoutLog[] = [];
  for (const row of rows) {
    const exRows = await database.getAllAsync<{
      position: number; exercise_id: string; target_sets: number;
      target_reps: number; rest_seconds: number;
    }>('SELECT * FROM log_exercises WHERE log_id = ? ORDER BY position', row.id);

    const exercises: CompletedExercise[] = [];
    for (const exRow of exRows) {
      const setRows = await database.getAllAsync<{
        reps: number; completed: number;
      }>('SELECT reps, completed FROM log_sets WHERE log_id = ? AND exercise_position = ? ORDER BY set_index', row.id, exRow.position);

      exercises.push({
        exerciseId: exRow.exercise_id,
        targetSets: exRow.target_sets,
        targetReps: exRow.target_reps,
        restSeconds: exRow.rest_seconds,
        sets: setRows.map(s => ({ reps: s.reps, completed: s.completed === 1 })),
      });
    }

    logs.push({
      id: row.id,
      workoutId: row.workout_id,
      workoutName: row.workout_name,
      date: row.date,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMinutes: row.duration_minutes,
      exercises,
    });
  }
  return logs;
}


export async function saveScheduledLocal(item: ScheduledWorkout): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO scheduled_workouts (id, workout_id, workout_name, date, time) VALUES (?, ?, ?, ?, ?)',
    item.id, item.workoutId, item.workoutName, item.date, item.time || null
  );
}

export async function getAllScheduledLocal(): Promise<ScheduledWorkout[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; workout_id: string; workout_name: string; date: string; time: string | null;
  }>('SELECT * FROM scheduled_workouts ORDER BY date, time');

  return rows.map(r => ({
    id: r.id,
    workoutId: r.workout_id,
    workoutName: r.workout_name,
    date: r.date,
    time: r.time || undefined,
  }));
}

export async function deleteScheduledLocal(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM scheduled_workouts WHERE id = ?', id);
}


export interface SyncQueueItem {
  id: number;
  entity: string;
  entity_id: string;
  action: string;
  payload: string | null;
  created_at: number;
}

export async function addToSyncQueue(
  entity: string,
  entityId: string,
  action: 'create' | 'delete',
  payload?: any,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO sync_queue (entity, entity_id, action, payload) VALUES (?, ?, ?, ?)',
    entity, entityId, action, payload ? JSON.stringify(payload) : null,
  );
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = await getDb();
  return database.getAllAsync<SyncQueueItem>('SELECT * FROM sync_queue ORDER BY created_at ASC');
}

export async function clearSyncQueue(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const database = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ...ids);
}

export async function clearAllSyncQueue(): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM sync_queue');
}

export async function clearAllUserData(): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM log_sets');
    await database.runAsync('DELETE FROM log_exercises');
    await database.runAsync('DELETE FROM workout_logs');
    await database.runAsync('DELETE FROM workout_exercises');
    await database.runAsync('DELETE FROM workouts');
    await database.runAsync('DELETE FROM scheduled_workouts');
    await database.runAsync('DELETE FROM sync_queue');
    await database.runAsync('DELETE FROM sync_meta');
  });
}

export async function getSyncMeta(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?', key,
  );
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', key, value,
  );
}
