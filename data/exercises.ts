import { Exercise } from './types';
import { apiGetExercises, apiGetExercise } from './api';
import {
  upsertExercises,
  upsertExerciseSteps,
  getAllExercises,
  getExerciseById as dbGetExerciseById,
  getFilteredExercises,
} from './database';

let cachedExercises: Exercise[] = [];
let cacheLoaded = false;

export async function loadExercises(filters?: { muscle?: string; equipment?: string; difficulty?: string; search?: string }): Promise<Exercise[]> {
  const hasFilters = filters && Object.values(filters).some(v => !!v);

  try {
    const data = await apiGetExercises(filters);
    if (!hasFilters) {
      cachedExercises = data;
      cacheLoaded = true;
      upsertExercises(data).catch((e) => console.error('[Exercises] DB upsert error:', e));
    }
    return data;
  } catch (apiErr: any) {
    console.error('[Exercises] API error:', apiErr?.message || apiErr);
    if (hasFilters) {
      try { return getFilteredExercises(filters!); } catch (e) { console.error('[Exercises] DB filter error:', e); return []; }
    }
    if (cachedExercises.length > 0) return cachedExercises;
    try {
      const local = await getAllExercises();
      if (local.length > 0) {
        cachedExercises = local;
        cacheLoaded = true;
      }
      return local;
    } catch (dbErr: any) {
      console.error('[Exercises] DB read error:', dbErr?.message || dbErr);
      return [];
    }
  }
}

export async function loadExercise(id: string): Promise<Exercise | null> {
  try {
    const ex = await apiGetExercise(id);
    if (ex && ex.steps && ex.steps.length > 0) {
      upsertExerciseSteps(id, ex.steps).catch(() => {});
    }
    return ex;
  } catch {
    const cached = cachedExercises.find(e => e.id === id);
    if (cached && cached.steps && cached.steps.length > 0) return cached;
    return dbGetExerciseById(id);
  }
}

export function getCachedExercises(): Exercise[] {
  return cachedExercises;
}

export function getExerciseFromCache(id: string): Exercise | undefined {
  return cachedExercises.find(e => e.id === id);
}

export async function ensureExercisesLoaded(): Promise<Exercise[]> {
  if (cacheLoaded && cachedExercises.length > 0) return cachedExercises;
  return loadExercises();
}
