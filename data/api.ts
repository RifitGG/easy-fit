import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://192.168.0.103:3000/api',
  ios: 'http://192.168.0.103:3000/api',
  default: 'http://localhost:3000/api',
});

const TOKEN_KEY = 'fit_app_token';
const USER_KEY = 'fit_app_user';


export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}


export async function getCachedUser(): Promise<any | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function setCachedUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function removeCachedUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}


async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}


export async function apiRegister(email: string, password: string, name: string) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  await setToken(data.token);
  await setCachedUser(data.user);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  await setCachedUser(data.user);
  return data;
}

export async function apiLogout() {
  await removeToken();
  await removeCachedUser();
}

export async function apiGetMe() {
  const data = await apiFetch('/auth/me');
  await setCachedUser(data.user);
  return data.user;
}

export async function apiUpdateProfile(fields: {
  name?: string;
  avatar_url?: string;
  height_cm?: number;
  weight_kg?: number;
  birth_date?: string;
  goal?: string;
}) {
  const data = await apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
  await setCachedUser(data.user);
  return data.user;
}

export async function apiChangePassword(current_password: string, new_password: string) {
  return apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password, new_password }),
  });
}


export async function apiGetWorkouts() {
  return apiFetch('/workouts');
}

export async function apiCreateWorkout(name: string, exercises: any[]) {
  return apiFetch('/workouts', {
    method: 'POST',
    body: JSON.stringify({ name, exercises }),
  });
}

export async function apiDeleteWorkout(id: string) {
  return apiFetch(`/workouts/${id}`, { method: 'DELETE' });
}


export async function apiSaveWorkoutLog(log: any) {
  return apiFetch('/workouts/logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

export async function apiGetWorkoutLogs() {
  return apiFetch('/workouts/logs');
}

export async function apiGetStats() {
  return apiFetch('/workouts/stats');
}


export async function apiGetScheduled() {
  return apiFetch('/workouts/scheduled');
}

export async function apiScheduleWorkout(workoutId: string, workoutName: string, date: string) {
  return apiFetch('/workouts/scheduled', {
    method: 'POST',
    body: JSON.stringify({ workoutId, workoutName, date }),
  });
}

export async function apiDeleteScheduled(id: string) {
  return apiFetch(`/workouts/scheduled/${id}`, { method: 'DELETE' });
}


export async function apiGetExercises(filters?: { muscle?: string; equipment?: string; difficulty?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.muscle) params.set('muscle', filters.muscle);
  if (filters?.equipment) params.set('equipment', filters.equipment);
  if (filters?.difficulty) params.set('difficulty', filters.difficulty);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return apiFetch(`/exercises${qs ? '?' + qs : ''}`);
}

export async function apiGetExercise(id: string) {
  return apiFetch(`/exercises/${id}`);
}
