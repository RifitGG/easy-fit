import { WorkoutLog, CompletedExercise } from './types';

const CALORIES_PER_SET: Record<string, number> = {
  'bench-press': 8,
  'incline-bench-press': 8,
  'decline-bench-press': 7,
  'dumbbell-bench-press': 7,
  'dumbbell-fly': 5,
  'cable-fly': 5,
  'push-up': 6,
  'diamond-push-up': 7,
  'chest-dip': 8,
  'pec-deck': 4,

  'squat': 10,
  'front-squat': 10,
  'goblet-squat': 7,
  'deadlift': 12,
  'sumo-deadlift': 11,
  'romanian-deadlift': 9,
  'leg-press': 8,
  'leg-extension': 5,
  'leg-curl': 5,
  'lunges': 7,
  'walking-lunges': 8,
  'bulgarian-split-squat': 8,
  'hack-squat': 8,
  'step-up': 6,

  'pull-up': 8,
  'chin-up': 8,
  'barbell-row': 8,
  'dumbbell-row': 6,
  'seated-cable-row': 6,
  'lat-pulldown': 6,
  't-bar-row': 8,
  'face-pull': 4,
  'hyperextension': 5,
  'straight-arm-pulldown': 5,

  'overhead-press': 7,
  'dumbbell-shoulder-press': 7,
  'arnold-press': 7,
  'lateral-raise': 4,
  'front-raise': 4,
  'rear-delt-fly': 4,
  'upright-row': 6,
  'shrug': 4,
  'cable-lateral-raise': 4,

  'dumbbell-curl': 4,
  'hammer-curl': 4,
  'barbell-curl': 5,
  'preacher-curl': 4,
  'concentration-curl': 3,
  'cable-curl': 4,
  'incline-dumbbell-curl': 4,

  'tricep-pushdown': 4,
  'close-grip-bench-press': 7,
  'overhead-tricep-extension': 5,
  'skull-crusher': 5,
  'tricep-dip': 7,
  'kickback': 3,
  'rope-pushdown': 4,

  'plank': 4,
  'crunch': 4,
  'russian-twist': 5,
  'leg-raise': 5,
  'hanging-leg-raise': 6,
  'mountain-climber': 8,
  'ab-wheel-rollout': 6,
  'bicycle-crunch': 5,
  'dead-bug': 4,

  'hip-thrust': 8,
  'glute-bridge': 5,
  'cable-pull-through': 6,
  'donkey-kick': 4,

  'calf-raise': 4,
  'seated-calf-raise': 3,
  'single-leg-calf-raise': 3,

  'wrist-curl': 2,
  'reverse-wrist-curl': 2,
  'farmer-walk': 7,

  'kettlebell-swing': 10,
  'kettlebell-goblet-squat': 7,
  'kettlebell-clean-press': 9,
  'kettlebell-snatch': 10,
  'kettlebell-turkish-getup': 8,

  'resistance-band-pull-apart': 3,
  'band-squat': 5,
  'band-row': 4,
  'band-chest-press': 4,
  'band-lateral-walk': 5,

  'box-jump': 9,
  'burpee': 12,
  'jumping-jack': 6,
  'jump-squat': 9,
  'high-knees': 7,

  'cable-woodchop': 5,
  'pallof-press': 4,
  'dumbbell-pullover': 6,
  'landmine-press': 6,
  'single-arm-farmer-carry': 6,
  'smith-squat': 8,
  'smith-bench-press': 7,
  'chest-press-machine': 5,
  'shoulder-press-machine': 5,
  'lat-pulldown-close': 6,
  'reverse-fly-machine': 4,
  'cable-crossover': 5,
};

const DEFAULT_CALORIES_PER_SET = 5;

export function getCaloriesPerSet(exerciseId: string): number {
  return CALORIES_PER_SET[exerciseId] ?? DEFAULT_CALORIES_PER_SET;
}

export function getExerciseCalories(ce: CompletedExercise): number {
  const perSet = getCaloriesPerSet(ce.exerciseId);
  const completedSets = ce.sets.filter(s => s.completed).length;
  return perSet * completedSets;
}

export function getWorkoutCalories(log: WorkoutLog): number {
  return log.exercises.reduce((total, ce) => total + getExerciseCalories(ce), 0);
}

export function getTotalCalories(logs: WorkoutLog[]): number {
  return logs.reduce((total, log) => total + getWorkoutCalories(log), 0);
}

export function estimateWorkoutCalories(exercises: { exerciseId: string; sets: number }[]): number {
  return exercises.reduce((total, ex) => total + getCaloriesPerSet(ex.exerciseId) * ex.sets, 0);
}
