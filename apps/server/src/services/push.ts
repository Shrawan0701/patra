import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendExpoPush(
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    return;
  }

  const messages: ExpoPushMessage[] = [
    {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('[Expo Push] Failed to send notification:', err);
  }
}
