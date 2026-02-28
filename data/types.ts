export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'abs'
  | 'forearms'
  | 'calves';

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  description: string;
  steps: string[];
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: number;
}

export interface CompletedSet {
  reps: number;
  completed: boolean;
}

export interface CompletedExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: CompletedSet[];
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  startedAt: number;
  completedAt: number;
  exercises: CompletedExercise[];
  durationMinutes: number;
}

export interface ScheduledWorkout {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  time?: string;
}

export interface PublishedWorkout {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  views: number;
  likesCount: number;
  createdAt: string;
  authorId: string;
  authorName: string;
  workoutName: string;
  exerciseCount: number;
  liked: boolean;
}

export interface PublishedWorkoutDetail extends PublishedWorkout {
  workoutId: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }[];
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  legs: 'Ноги',
  glutes: 'Ягодицы',
  abs: 'Пресс',
  forearms: 'Предплечья',
  calves: 'Икры',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Штанга',
  dumbbell: 'Гантели',
  cable: 'Тросовый',
  machine: 'Тренажёр',
  bodyweight: 'Своё тело',
  kettlebell: 'Гиря',
  bands: 'Резинки',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};
