import { getToken, apiSync } from './api';
import {
  getSyncQueue,
  clearSyncQueue,
  clearAllSyncQueue,
  getSyncMeta,
  setSyncMeta,
  saveWorkoutLocal,
  getAllWorkoutsLocal,
  saveWorkoutLogLocal,
  saveScheduledLocal,
  deleteWorkoutLocal,
  deleteScheduledLocal,
  getAllWorkoutLogsLocal,
  getAllScheduledLocal,
} from './database';
import { Workout, WorkoutLog, ScheduledWorkout } from './types';

let syncing = false;

export async function runSync(): Promise<{ success: boolean; processed?: number }> {
  const token = await getToken();
  if (!token) return { success: false };

  if (syncing) return { success: false };
  syncing = true;

  try {
    const queue = await getSyncQueue();
    const lastSync = await getSyncMeta('lastSyncTime');

    const actions = queue.map(item => ({
      entity: item.entity,
      entity_id: item.entity_id,
      action: item.action,
      payload: item.payload ? JSON.parse(item.payload) : null,
    }));

    const response = await apiSync(actions, lastSync || undefined);

    if (queue.length > 0) {
      await clearSyncQueue(queue.map(q => q.id));
    }

    if (response.data) {
      await mergeServerData(response.data);
    }

    if (response.serverTime) {
      await setSyncMeta('lastSyncTime', response.serverTime);
    }

    return { success: true, processed: response.processed || 0 };
  } catch (err) {
    console.warn('[Sync] Failed:', err);
    return { success: false };
  } finally {
    syncing = false;
  }
}

async function mergeServerData(data: {
  workouts: any[];
  logs: any[];
  scheduled: any[];
}): Promise<void> {
  if (data.workouts) {
    const localWorkouts = await getAllWorkoutsLocal();
    const serverWorkoutIds = new Set(data.workouts.map((w: any) => w.id));

    const pendingQueue = await getSyncQueue();
    const pendingIds = new Set(pendingQueue.map(q => q.entity_id));

    for (const local of localWorkouts) {
      if (!serverWorkoutIds.has(local.id) && !pendingIds.has(local.id)) {
        await deleteWorkoutLocal(local.id);
      }
    }

    for (const w of data.workouts) {
      const workout: Workout = {
        id: w.id,
        name: w.name,
        exercises: w.exercises || [],
        createdAt: new Date(w.created_at).getTime(),
      };
      await saveWorkoutLocal(workout);
    }
  }

  if (data.logs) {
    for (const l of data.logs) {
      const log: WorkoutLog = {
        id: l.id,
        workoutId: l.workoutId,
        workoutName: l.workoutName,
        date: typeof l.date === 'string' && l.date.length > 10 ? l.date.slice(0, 10) : l.date,
        startedAt: new Date(l.startedAt).getTime(),
        completedAt: new Date(l.completedAt).getTime(),
        exercises: (l.exercises || []).map((ex: any) => ({
          exerciseId: ex.exerciseId,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds,
          sets: (ex.sets || []).map((s: any) => ({
            reps: s.reps,
            completed: typeof s.completed === 'boolean' ? s.completed : s.completed === true,
          })),
        })),
        durationMinutes: l.durationMinutes,
      };
      await saveWorkoutLogLocal(log);
    }
  }

  if (data.scheduled) {
    const localScheduled = await getAllScheduledLocal();
    const serverScheduledIds = new Set(data.scheduled.map((s: any) => s.id));
    const pendingQueue = await getSyncQueue();
    const pendingIds = new Set(pendingQueue.map(q => q.entity_id));

    for (const local of localScheduled) {
      if (!serverScheduledIds.has(local.id) && !pendingIds.has(local.id)) {
        await deleteScheduledLocal(local.id);
      }
    }

    for (const s of data.scheduled) {
      const item: ScheduledWorkout = {
        id: s.id,
        workoutId: s.workoutId,
        workoutName: s.workoutName,
        date: typeof s.date === 'string' && s.date.length > 10 ? s.date.slice(0, 10) : s.date,
        time: s.time || undefined,
      };
      await saveScheduledLocal(item);
    }
  }
}

export async function hasPendingSync(): Promise<boolean> {
  const queue = await getSyncQueue();
  return queue.length > 0;
}

export async function getPendingSyncCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}
