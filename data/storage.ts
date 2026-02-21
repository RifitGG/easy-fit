import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutLog, ScheduledWorkout } from './types';

const WORKOUTS_KEY = 'fit_app_workouts';
const LOGS_KEY = 'fit_app_workout_logs';
const SCHEDULED_KEY = 'fit_app_scheduled';

export async function loadWorkouts(): Promise<Workout[]> {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export async function addWorkout(workout: Workout): Promise<Workout[]> {
  const workouts = await loadWorkouts();
  workouts.unshift(workout);
  await saveWorkouts(workouts);
  return workouts;
}

export async function deleteWorkout(id: string): Promise<Workout[]> {
  const workouts = await loadWorkouts();
  const filtered = workouts.filter((w) => w.id !== id);
  await saveWorkouts(filtered);
  return filtered;
}

export async function updateWorkout(updated: Workout): Promise<Workout[]> {
  const workouts = await loadWorkouts();
  const index = workouts.findIndex((w) => w.id === updated.id);
  if (index !== -1) {
    workouts[index] = updated;
  }
  await saveWorkouts(workouts);
  return workouts;
}

export async function loadWorkoutLogs(): Promise<WorkoutLog[]> {
  try {
    const data = await AsyncStorage.getItem(LOGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveWorkoutLog(log: WorkoutLog): Promise<WorkoutLog[]> {
  const logs = await loadWorkoutLogs();
  logs.unshift(log);
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return logs;
}

export async function getLogsByDate(date: string): Promise<WorkoutLog[]> {
  const logs = await loadWorkoutLogs();
  return logs.filter((l) => l.date === date);
}

export async function deleteWorkoutLog(id: string): Promise<WorkoutLog[]> {
  const logs = await loadWorkoutLogs();
  const filtered = logs.filter((l) => l.id !== id);
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
  return filtered;
}


export async function loadScheduledWorkouts(): Promise<ScheduledWorkout[]> {
  try {
    const data = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch {
    return [];
  }
}

export async function saveScheduledWorkouts(items: ScheduledWorkout[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(items));
}

export async function addScheduledWorkout(item: ScheduledWorkout): Promise<ScheduledWorkout[]> {
  const items = await loadScheduledWorkouts();
  items.push(item);
  await saveScheduledWorkouts(items);
  return items;
}

export async function deleteScheduledWorkout(id: string): Promise<ScheduledWorkout[]> {
  const items = await loadScheduledWorkouts();
  const filtered = items.filter((s) => s.id !== id);
  await saveScheduledWorkouts(filtered);
  return filtered;
}

export async function getScheduledByDate(date: string): Promise<ScheduledWorkout[]> {
  const items = await loadScheduledWorkouts();
  return items.filter((s) => s.date === date);
}
