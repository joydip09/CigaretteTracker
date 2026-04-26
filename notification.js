import notifee, { AndroidImportance } from '@notifee/react-native';

export async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

export async function showNotification(title, body) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default',
    },
  });
}
