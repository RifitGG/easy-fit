import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}



export function BenchPressIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="7" width="18" height="2" rx="1" fill={color} />
      <Rect x="1" y="5" width="3" height="6" rx="1" fill={color} />
      <Rect x="20" y="5" width="3" height="6" rx="1" fill={color} />
      <Rect x="5" y="6" width="2" height="4" rx="0.5" fill={color} opacity={0.5} />
      <Rect x="17" y="6" width="2" height="4" rx="0.5" fill={color} opacity={0.5} />
      <Rect x="8" y="14" width="8" height="2.5" rx="1" fill={color} opacity={0.35} />
      <Rect x="7" y="17" width="1.5" height="3.5" rx="0.5" fill={color} opacity={0.35} />
      <Rect x="15.5" y="17" width="1.5" height="3.5" rx="0.5" fill={color} opacity={0.35} />
    </Svg>
  );
}

export function SquatIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="2" rx="1" fill={color} />
      <Rect x="1" y="1.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="20" y="1.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="5" y="2.5" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
      <Rect x="17" y="2.5" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
      <Path d="M12 9L12 17" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M8 15L12 20L16 15" fill={color} />
    </Svg>
  );
}

export function DeadliftIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 9L12 4L16 9" fill={color} />
      <Path d="M12 8L12 15" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Rect x="3" y="18" width="18" height="2" rx="1" fill={color} />
      <Rect x="1" y="16.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="20" y="16.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="5" y="17.5" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
      <Rect x="17" y="17.5" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
    </Svg>
  );
}

export function OverheadPressIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="2" rx="1" fill={color} />
      <Rect x="2" y="1.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="19" y="1.5" width="3" height="5" rx="1" fill={color} />
      <Path d="M8 18L8 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5.5 13L8 9L10.5 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 18L16 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M13.5 13L16 9L18.5 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PullUpIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="20" height="3" rx="1.5" fill={color} />
      <Rect x="6" y="5" width="3" height="3.5" rx="1" fill={color} opacity={0.45} />
      <Rect x="15" y="5" width="3" height="3.5" rx="1" fill={color} opacity={0.45} />
      <Path d="M12 21L12 14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M8.5 16L12 11.5L15.5 16" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PushUpIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="19" width="20" height="2.5" rx="1" fill={color} opacity={0.35} />
      <Rect x="5" y="15.5" width="4" height="3.5" rx="1.2" fill={color} opacity={0.55} />
      <Rect x="15" y="15.5" width="4" height="3.5" rx="1.2" fill={color} opacity={0.55} />
      <Path d="M12 13L12 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M8.5 9L12 4.5L15.5 9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DumbbellCurlIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="2" width="6" height="3.5" rx="1" fill={color} />
      <Rect x="10" y="5.5" width="2.5" height="5" rx="0.5" fill={color} opacity={0.45} />
      <Rect x="8" y="10.5" width="6" height="3.5" rx="1" fill={color} />
      <Path d="M19 21C19 15 17 11 14 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray="3 2" />
      <Path d="M17 19L19.5 22L21.5 19" fill={color} />
    </Svg>
  );
}

export function CablePushdownIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="1" width="8" height="3.5" rx="1" fill={color} />
      <Path d="M12 4.5L12 13" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 2" />
      <Rect x="7" y="13" width="10" height="3" rx="1.5" fill={color} />
      <Path d="M12 18L12 20" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M9 19L12 23L15 19" fill={color} />
    </Svg>
  );
}

export function LateralRaiseIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2.5" fill={color} opacity={0.3} />
      <Rect x="0.5" y="10" width="3.5" height="4" rx="1" fill={color} />
      <Rect x="4" y="11" width="4" height="2" rx="0.5" fill={color} opacity={0.45} />
      <Rect x="20" y="10" width="3.5" height="4" rx="1" fill={color} />
      <Rect x="16" y="11" width="4" height="2" rx="0.5" fill={color} opacity={0.45} />
      <Path d="M3 7L1.5 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M1.5 7L3.5 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M21 7L22.5 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M22.5 7L20.5 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function LegPressIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 3L22 19" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Rect x="2" y="16" width="10" height="3" rx="1" fill={color} opacity={0.35} />
      <Path d="M12 10L16 5.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M14 4L17 3.5L16.5 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="19" width="2" height="3" rx="0.5" fill={color} opacity={0.3} />
      <Rect x="9" y="19" width="2" height="3" rx="0.5" fill={color} opacity={0.3} />
    </Svg>
  );
}

export function BarbellRowIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 17L19 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x="2" y="15.5" width="3" height="5" rx="1" fill={color} />
      <Rect x="18" y="10" width="3" height="5" rx="1" fill={color} />
      <Rect x="6" y="15" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
      <Rect x="16" y="11" width="2" height="3" rx="0.5" fill={color} opacity={0.5} />
      <Path d="M12 10L12 3.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M9 6L12 2L15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlankIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth={2} />
      <Path d="M12 9V13L15 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 2H14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx="12" cy="13" r="1.2" fill={color} />
    </Svg>
  );
}

export function CableFlyIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="2" width="3" height="17" rx="1" fill={color} opacity={0.4} />
      <Rect x="20" y="2" width="3" height="17" rx="1" fill={color} opacity={0.4} />
      <Path d="M4 4L12 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M20 4L12 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="12" cy="14" r="3" fill={color} />
      <Path d="M6 7L9 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 7L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function KettlebellSwingIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6.5C9 3.8 10.3 2 12 2C13.7 2 15 3.8 15 6.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="11" r="5.5" fill={color} />
      <Circle cx="12" cy="11" r="1.5" fill={color === '#000' ? '#FFF' : '#000'} opacity={0.15} />
      <Path d="M4 21C4.5 17 6.5 14 9 12.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 2" />
      <Path d="M20 21C19.5 17 17.5 14 15 12.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 2" />
    </Svg>
  );
}

export function LungeIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="16.5" width="7" height="3.5" rx="1.5" fill={color} opacity={0.4} />
      <Rect x="14" y="13" width="7.5" height="4" rx="1.5" fill={color} />
      <Path d="M7 10L16 5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M13 3.5L17 4L14.5 7.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 16.5L7 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
      <Path d="M17.5 13L16 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    </Svg>
  );
}

export function CalfRaiseIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="17" width="16" height="4" rx="1.5" fill={color} opacity={0.35} />
      <Rect x="8" y="14" width="8" height="3" rx="1" fill={color} />
      <Path d="M12 12L12 5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M8.5 8L12 3.5L15.5 8" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DumbbellFlyIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="18" width="10" height="2.5" rx="1" fill={color} opacity={0.3} />
      <Rect x="1" y="5" width="3.5" height="7" rx="1" fill={color} transform="rotate(-25 2.75 8.5)" />
      <Rect x="19.5" y="5" width="3.5" height="7" rx="1" fill={color} transform="rotate(25 21.25 8.5)" />
      <Path d="M10 13L5 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <Path d="M14 13L19 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <Circle cx="12" cy="14" r="1.5" fill={color} opacity={0.4} />
    </Svg>
  );
}

export function BandPullIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="3" cy="12" r="2.5" fill={color} />
      <Circle cx="21" cy="12" r="2.5" fill={color} />
      <Path d="M5.5 12C7 9.5 9 10.5 10.5 12C12 13.5 13.5 13.5 15 12C16.5 10.5 18 9.5 19.5 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M3 7.5L1.5 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M1.5 7.5H3.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M21 7.5L22.5 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M22.5 7.5H20.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function HammerCurlIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8.5" y="2" width="7" height="4" rx="1" fill={color} />
      <Rect x="10.5" y="6" width="3" height="5.5" rx="0.5" fill={color} opacity={0.45} />
      <Rect x="8.5" y="11.5" width="7" height="4" rx="1" fill={color} />
      <Path d="M20 21L20 13" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17.5 15.5L20 12L22.5 15.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LegCurlIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="10" width="16" height="3" rx="1" fill={color} opacity={0.35} />
      <Rect x="3" y="13" width="2" height="5.5" rx="0.5" fill={color} opacity={0.3} />
      <Rect x="15" y="13" width="2" height="5.5" rx="0.5" fill={color} opacity={0.3} />
      <Circle cx="20" cy="10" r="2.5" fill={color} opacity={0.55} />
      <Path d="M20 7.5C18 4 14 3 12 4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M13.5 2.5L11 4.5L13 6.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


export function PlayIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3L20 12L6 21V3Z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="5" height="16" rx="1.5" fill={color} />
      <Rect x="14" y="4" width="5" height="16" rx="1.5" fill={color} />
    </Svg>
  );
}

export function TimerIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth={2} />
      <Path d="M12 9V13L15 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 2H14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M16 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth={2} />
      <Rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} />
    </Svg>
  );
}

export function TrophyIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 21H16M12 17V21M6 4H18V8C18 12 15 15 12 15C9 15 6 12 6 8V4Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 7H3V9C3 11 4.5 12 6 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 7H21V9C21 11 19.5 12 18 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarPlusIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M16 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth={2} />
      <Path d="M12 14V18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M10 16H14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

import { MuscleGroup } from '@/data/types';

const EXERCISE_ICON_MAP: Record<string, React.FC<IconProps>> = {
  'bench-press': BenchPressIcon,
  'squat': SquatIcon,
  'deadlift': DeadliftIcon,
  'overhead-press': OverheadPressIcon,
  'pull-up': PullUpIcon,
  'push-up': PushUpIcon,
  'dumbbell-curl': DumbbellCurlIcon,
  'tricep-pushdown': CablePushdownIcon,
  'lateral-raise': LateralRaiseIcon,
  'leg-press': LegPressIcon,
  'barbell-row': BarbellRowIcon,
  'plank': PlankIcon,
  'cable-fly': CableFlyIcon,
  'kettlebell-swing': KettlebellSwingIcon,
  'lunges': LungeIcon,
  'calf-raise': CalfRaiseIcon,
  'dumbbell-fly': DumbbellFlyIcon,
  'resistance-band-pull-apart': BandPullIcon,
  'hammer-curl': HammerCurlIcon,
  'leg-curl': LegCurlIcon,
};

const MUSCLE_FALLBACK: Record<MuscleGroup, React.FC<IconProps>> = {
  chest: BenchPressIcon,
  back: BarbellRowIcon,
  shoulders: LateralRaiseIcon,
  biceps: DumbbellCurlIcon,
  triceps: CablePushdownIcon,
  legs: SquatIcon,
  glutes: LungeIcon,
  abs: PlankIcon,
  forearms: HammerCurlIcon,
  calves: CalfRaiseIcon,
};

export function ExerciseIcon({ exerciseId, size = 24, color = '#000' }: IconProps & { exerciseId: string }) {
  const Icon = EXERCISE_ICON_MAP[exerciseId] || BenchPressIcon;
  return <Icon size={size} color={color} />;
}

export function ExerciseMuscleIcon({ muscleGroup, size = 24, color = '#000' }: IconProps & { muscleGroup: MuscleGroup }) {
  const Icon = MUSCLE_FALLBACK[muscleGroup] || BenchPressIcon;
  return <Icon size={size} color={color} />;
}
