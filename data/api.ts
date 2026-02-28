import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://89.111.171.11/api',
  ios: 'http://89.111.171.11/api',
  default: 'http://89.111.171.11/api',
});

export const BASE_URL = Platform.select({
  android: 'http://89.111.171.11',
  ios: 'http://89.111.171.11',
  default: 'http://89.111.171.11',
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


async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 8000): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (fetchErr: any) {
    clearTimeout(timer);
    const msg = fetchErr?.name === 'AbortError'
      ? `[API] Timeout (${timeoutMs}ms) for ${path}`
      : `[API] Network error for ${path}: ${fetchErr?.message || fetchErr}`;
    console.error(msg);
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }

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

export async function apiUploadAvatar(uri: string, crop?: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }) {
  const token = await getToken();
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const file = new File([blob], `avatar.${ext}`, { type: blob.type || 'image/jpeg' });
    formData.append('avatar', file);
  } else {
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('avatar', {
      uri,
      name: filename,
      type: mimeType,
    } as any);
  }

  if (crop) {
    formData.append('cropX', String(crop.cropX));
    formData.append('cropY', String(crop.cropY));
    formData.append('cropWidth', String(crop.cropWidth));
    formData.append('cropHeight', String(crop.cropHeight));
  }

  const response = await fetch(`${API_URL}/auth/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  await setCachedUser(data.user);
  return data.user;
}

export async function apiCropAvatar(crop: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }) {
  const data = await apiFetch('/auth/avatar/crop', {
    method: 'POST',
    body: JSON.stringify(crop),
  });
  await setCachedUser(data.user);
  return data.user;
}


export async function apiGetWorkouts() {
  return apiFetch('/workouts');
}

export async function apiCreateWorkout(name: string, exercises: any[], id?: string) {
  return apiFetch('/workouts', {
    method: 'POST',
    body: JSON.stringify({ id, name, exercises }),
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

export async function apiScheduleWorkout(workoutId: string, workoutName: string, date: string, time?: string, id?: string) {
  return apiFetch('/workouts/scheduled', {
    method: 'POST',
    body: JSON.stringify({ id, workoutId, workoutName, date, time }),
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


export async function apiGetCommunity(params?: { sort?: string; difficulty?: string; search?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.difficulty) qs.set('difficulty', params.difficulty);
  if (params?.search) qs.set('search', params.search);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const q = qs.toString();
  return apiFetch(`/community${q ? '?' + q : ''}`);
}

export async function apiGetCommunityDetail(id: string) {
  return apiFetch(`/community/${id}`);
}

export async function apiPublishWorkout(workoutId: string, title: string, description: string, difficulty: string) {
  return apiFetch('/community/publish', {
    method: 'POST',
    body: JSON.stringify({ workoutId, title, description, difficulty }),
  });
}

export async function apiUpdatePublished(id: string, fields: { title?: string; description?: string; difficulty?: string }) {
  return apiFetch(`/community/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export async function apiDeletePublished(id: string) {
  return apiFetch(`/community/${id}`, { method: 'DELETE' });
}

export async function apiToggleLike(id: string) {
  return apiFetch(`/community/${id}/like`, { method: 'POST' });
}

export async function apiCopyWorkout(id: string) {
  return apiFetch(`/community/${id}/copy`, { method: 'POST' });
}

export async function apiGetMyPublished() {
  return apiFetch('/community/my/list');
}


export async function apiSync(actions: any[], lastSync?: string) {
  return apiFetch('/workouts/sync', {
    method: 'POST',
    body: JSON.stringify({ actions, lastSync }),
  }, 15000);
}


export async function apiGetWater(date?: string): Promise<{ date: string; glasses: number; targetMl: number }> {
  const qs = date ? `?date=${date}` : '';
  return apiFetch(`/workouts/water${qs}`);
}

export async function apiGetWaterWeek(): Promise<{ date: string; glasses: number }[]> {
  return apiFetch('/workouts/water/week');
}

export async function apiSaveWater(glasses: number, targetMl: number, date?: string): Promise<{ date: string; glasses: number; targetMl: number }> {
  return apiFetch('/workouts/water', {
    method: 'POST',
    body: JSON.stringify({ glasses, targetMl, date }),
  });
}
