import {
  Exercise,
  Workout,
  WorkoutLog,
  CompletedExercise,
  ScheduledWorkout,
  MuscleGroup,
  Equipment,
  Difficulty,
} from './types';

const exercisesMap = new Map<string, Exercise>();
const workoutsMap = new Map<string, Workout>();
const logsMap = new Map<string, WorkoutLog>();
const scheduledMap = new Map<string, ScheduledWorkout>();

export async function upsertExercises(exercises: Exercise[]): Promise<void> {
  for (const ex of exercises) exercisesMap.set(ex.id, ex);
}

export async function upsertExerciseSteps(exerciseId: string, steps: string[]): Promise<void> {
  const ex = exercisesMap.get(exerciseId);
  if (ex) exercisesMap.set(exerciseId, { ...ex, steps });
}

export async function getAllExercises(): Promise<Exercise[]> {
  return Array.from(exercisesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  return exercisesMap.get(id) ?? null;
}

export async function getFilteredExercises(filters: {
  muscle?: string; equipment?: string; difficulty?: string; search?: string;
}): Promise<Exercise[]> {
  let list = Array.from(exercisesMap.values());
  if (filters.muscle) list = list.filter(e => e.muscleGroups.includes(filters.muscle as MuscleGroup));
  if (filters.equipment) list = list.filter(e => e.equipment === filters.equipment);
  if (filters.difficulty) list = list.filter(e => e.difficulty === filters.difficulty);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveWorkoutLocal(workout: Workout): Promise<void> {
  workoutsMap.set(workout.id, workout);
}

export async function getAllWorkoutsLocal(): Promise<Workout[]> {
  return Array.from(workoutsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteWorkoutLocal(id: string): Promise<void> {
  workoutsMap.delete(id);
}

export async function saveWorkoutLogLocal(log: WorkoutLog): Promise<void> {
  logsMap.set(log.id, log);
}

export async function getAllWorkoutLogsLocal(): Promise<WorkoutLog[]> {
  return Array.from(logsMap.values()).sort((a, b) => b.startedAt - a.startedAt);
}

export async function saveScheduledLocal(item: ScheduledWorkout): Promise<void> {
  scheduledMap.set(item.id, item);
}

export async function getAllScheduledLocal(): Promise<ScheduledWorkout[]> {
  return Array.from(scheduledMap.values()).sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time || '').localeCompare(b.time || '');
  });
}

export async function deleteScheduledLocal(id: string): Promise<void> {
  scheduledMap.delete(id);
}

export interface SyncQueueItem {
  id: number;
  entity: string;
  entity_id: string;
  action: string;
  payload: string | null;
  created_at: number;
}

const syncQueue: SyncQueueItem[] = [];
let syncQueueId = 0;

export async function addToSyncQueue(
  entity: string,
  entityId: string,
  action: 'create' | 'delete',
  payload?: any,
): Promise<void> {
  syncQueue.push({
    id: ++syncQueueId,
    entity,
    entity_id: entityId,
    action,
    payload: payload ? JSON.stringify(payload) : null,
    created_at: Math.floor(Date.now() / 1000),
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return [...syncQueue];
}

export async function clearSyncQueue(ids: number[]): Promise<void> {
  const idSet = new Set(ids);
  for (let i = syncQueue.length - 1; i >= 0; i--) {
    if (idSet.has(syncQueue[i].id)) syncQueue.splice(i, 1);
  }
}

export async function clearAllSyncQueue(): Promise<void> {
  syncQueue.length = 0;
}

export async function clearAllUserData(): Promise<void> {
  workoutsMap.clear();
  logsMap.clear();
  scheduledMap.clear();
  syncQueue.length = 0;
}

export async function getSyncMeta(_key: string): Promise<string | null> {
  return null;
}

export async function setSyncMeta(_key: string, _value: string): Promise<void> {
}
