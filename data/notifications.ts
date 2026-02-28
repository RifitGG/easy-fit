import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleWorkoutNotification(
  workoutName: string,
  date: string,
  time: string,
  scheduledId: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const trigger = new Date(year, month - 1, day, hours, minutes, 0);

  if (trigger.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏋️ Время тренировки!',
      body: `Запланировано: ${workoutName}`,
      data: { scheduledId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });

  return id;
}

export async function cancelWorkoutNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}
