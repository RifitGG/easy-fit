import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, apiGetWater, apiGetWaterWeek, apiSaveWater } from './api';

const WATER_KEY_PREFIX = 'water_intake_';
const GLASS_ML = 250;

export function calculateDailyWaterMl(
  weightKg: number,
  heightCm: number,
  bmi: number,
): number {
  let ml = weightKg * 30;
  if (bmi >= 30) ml += 500;
  else if (bmi >= 25) ml += 250;
  if (heightCm > 180) ml += 200;
  ml = Math.round(ml / 50) * 50;
  return Math.max(1500, Math.min(4500, ml));
}

export function getGlassCount(targetMl: number): number {
  return Math.ceil(targetMl / GLASS_ML);
}

export function getGlassMl(): number {
  return GLASS_ML;
}

function getKey(date: string): string {
  return WATER_KEY_PREFIX + date;
}

function getTodayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

export async function getWaterIntake(date?: string): Promise<number> {
  const d = date || getTodayStr();
  if (await isLoggedIn()) {
    try {
      const resp = await apiGetWater(d);
      await AsyncStorage.setItem(getKey(d), String(resp.glasses));
      return resp.glasses;
    } catch {
    }
  }
  const val = await AsyncStorage.getItem(getKey(d));
  return val ? parseInt(val, 10) : 0;
}

export async function setWaterIntake(glasses: number, date?: string, targetMl?: number): Promise<void> {
  const d = date || getTodayStr();
  const g = Math.max(0, glasses);
  await AsyncStorage.setItem(getKey(d), String(g));
  if (await isLoggedIn()) {
    try {
      await apiSaveWater(g, targetMl || 2000, d);
    } catch {
    }
  }
}

export async function addGlass(date?: string, targetMl?: number): Promise<number> {
  const d = date || getTodayStr();
  const current = await getWaterIntake(d);
  const next = current + 1;
  await setWaterIntake(next, d, targetMl);
  return next;
}

export async function removeGlass(date?: string, targetMl?: number): Promise<number> {
  const d = date || getTodayStr();
  const current = await getWaterIntake(d);
  const next = Math.max(0, current - 1);
  await setWaterIntake(next, d, targetMl);
  return next;
}

export async function getWaterIntakeMulti(dates: string[]): Promise<number[]> {
  if (await isLoggedIn()) {
    try {
      const resp = await apiGetWaterWeek();
      const map: Record<string, number> = {};
      for (const item of resp) {
        map[item.date] = item.glasses;
        await AsyncStorage.setItem(getKey(item.date), String(item.glasses));
      }
      return dates.map(d => map[d] || 0);
    } catch {
    }
  }
  const keys = dates.map(getKey);
  const results = await AsyncStorage.multiGet(keys);
  return results.map(([_, val]) => (val ? parseInt(val, 10) : 0));
}
