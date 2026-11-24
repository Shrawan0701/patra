import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_ENABLED_KEY = 'patra_daily_notifs_enabled';

const DAILY_PRODUCT_REMINDERS = [
  {
    hour: 10,
    minute: 0,
    title: 'Fold Something Special Today',
    body: 'Open Patra to spin our 3D wedding, Haldi, birthday, and housewarming pop-up rooms.',
  },
  {
    hour: 15,
    minute: 30,
    title: 'Custom 3D Rooms Wait for You',
    body: 'Mix mandaps, swings, tiered cakes, and pastel garlands in minutes. Free to design and preview.',
  },
  {
    hour: 20,
    minute: 0,
    title: 'Ready to Share in 9:16 HD?',
    body: 'Turn your custom Patra 3D card into a crisp video with music for WhatsApp Status and Reels.',
  },
];

export async function isDailyNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(DAILY_ENABLED_KEY);
  return val !== '0';
}

export async function scheduleDailyProductNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const item of DAILY_PRODUCT_REMINDERS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: item.hour,
          minute: item.minute,
        },
      });
    }

    await AsyncStorage.setItem(DAILY_ENABLED_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyProductNotifications(): Promise<void> {
  if (Platform.OS !== 'web') {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  }
  await AsyncStorage.setItem(DAILY_ENABLED_KEY, '0');
}
