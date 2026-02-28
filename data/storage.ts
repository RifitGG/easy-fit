import { Workout, WorkoutLog, ScheduledWorkout } from './types';
import {
  getToken,
  apiGetWorkouts,
  apiCreateWorkout,
  apiDeleteWorkout,
  apiGetWorkoutLogs,
  apiSaveWorkoutLog,
  apiGetScheduled,
  apiScheduleWorkout,
  apiDeleteScheduled,
} from './api';
import {
  saveWorkoutLocal,
  getAllWorkoutsLocal,
  deleteWorkoutLocal,
  saveWorkoutLogLocal,
  getAllWorkoutLogsLocal,
  saveScheduledLocal,
  getAllScheduledLocal,
  deleteScheduledLocal,
  addToSyncQueue,
} from './database';

async function isAuthed(): Promise<boolean> {
  const t = await getToken();
  return !!t;
}

export async function loadWorkoutsLocal(): Promise<Workout[]> {
  return getAllWorkoutsLocal();
}

export async function loadWorkouts(): Promise<Workout[]> {
  if (await isAuthed()) {
    try {
      const data = await apiGetWorkouts();
      const workouts = data.map((w: any) => ({
        id: String(w.id),
        name: w.name,
        exercises: w.exercises || [],
        createdAt: new Date(w.created_at).getTime(),
      }));
      for (const wo of workouts) await saveWorkoutLocal(wo);
      return getAllWorkoutsLocal();
    } catch (e: any) {
      console.warn('[Storage] loadWorkouts API error:', e?.message || e);
      return getAllWorkoutsLocal();
    }
  }
  return getAllWorkoutsLocal();
}

export async function addWorkout(workout: Workout): Promise<Workout[]> {
  await saveWorkoutLocal(workout);
  if (await isAuthed()) {
    try {
      await apiCreateWorkout(workout.name, workout.exercises, workout.id);
    } catch {
      await addToSyncQueue('workout', workout.id, 'create', workout);
    }
  }
  return getAllWorkoutsLocal();
}

export async function deleteWorkout(id: string): Promise<Workout[]> {
  await deleteWorkoutLocal(id);
  if (await isAuthed()) {
    try {
      await apiDeleteWorkout(id);
    } catch {
      await addToSyncQueue('workout', id, 'delete');
    }
  }
  return getAllWorkoutsLocal();
}

export async function loadWorkoutLogs(): Promise<WorkoutLog[]> {
  if (await isAuthed()) {
    try {
      const data = await apiGetWorkoutLogs();
      const logs = data.map((l: any) => ({
        id: String(l.id),
        workoutId: String(l.workoutId),
        workoutName: l.workoutName,
        date: typeof l.date === 'string' && l.date.length > 10 ? l.date.slice(0, 10) : l.date,
        startedAt: new Date(l.startedAt).getTime(),
        completedAt: new Date(l.completedAt).getTime(),
        exercises: l.exercises || [],
        durationMinutes: l.durationMinutes,
      }));
      for (const log of logs) await saveWorkoutLogLocal(log);
      return getAllWorkoutLogsLocal();
    } catch (e: any) {
      console.warn('[Storage] loadWorkoutLogs API error:', e?.message || e);
      return getAllWorkoutLogsLocal();
    }
  }
  return getAllWorkoutLogsLocal();
}

export async function saveWorkoutLog(log: WorkoutLog): Promise<WorkoutLog[]> {
  await saveWorkoutLogLocal(log);
  if (await isAuthed()) {
    try {
      await apiSaveWorkoutLog(log);
    } catch {
      await addToSyncQueue('workout_log', log.id, 'create', log);
    }
  }
  return getAllWorkoutLogsLocal();
}

export async function getLogsByDate(date: string): Promise<WorkoutLog[]> {
  const logs = await loadWorkoutLogs();
  return logs.filter((l) => l.date === date);
}

export async function loadScheduledWorkouts(): Promise<ScheduledWorkout[]> {
  if (await isAuthed()) {
    try {
      const items = await apiGetScheduled();
      const mapped = items.map((s: any) => ({
        ...s,
        id: String(s.id),
        workoutId: String(s.workoutId),
        date: typeof s.date === 'string' && s.date.length > 10 ? s.date.slice(0, 10) : s.date,
      }));
      for (const item of mapped) await saveScheduledLocal(item);
      return getAllScheduledLocal();
    } catch (e: any) {
      console.warn('[Storage] loadScheduled API error:', e?.message || e);
      return getAllScheduledLocal();
    }
  }
  return getAllScheduledLocal();
}

export async function addScheduledWorkout(item: ScheduledWorkout): Promise<ScheduledWorkout[]> {
  await saveScheduledLocal(item);
  if (await isAuthed()) {
    try {
      await apiScheduleWorkout(item.workoutId, item.workoutName, item.date, item.time, item.id);
    } catch {
      await addToSyncQueue('scheduled', item.id, 'create', item);
    }
  }
  return getAllScheduledLocal();
}

export async function deleteScheduledWorkout(id: string): Promise<ScheduledWorkout[]> {
  await deleteScheduledLocal(id);
  if (await isAuthed()) {
    try {
      await apiDeleteScheduled(id);
    } catch {
      await addToSyncQueue('scheduled', id, 'delete');
    }
  }
  return getAllScheduledLocal();
}

export async function getScheduledByDate(date: string): Promise<ScheduledWorkout[]> {
  const items = await loadScheduledWorkouts();
  return items.filter((s) => s.date === date);
}
