import { LocalNotifications } from '@capacitor/local-notifications';

const NTFY_TOPIC = 'calyx_alerts_mock';

export async function sendNotification(title, message, priority = 'default') {
  // 1. Android Native Notification (Capacitor)
  try {
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: message,
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    }
  } catch (error) {
    console.warn('Local Notifications failed (likely running in web browser without Capacitor context):', error);
  }

// 2. ntfy HTTP Push Notification
  try {
    let ntfyPriority = '3'; // default
    if (priority === 'high') ntfyPriority = '5';
    if (priority === 'low') ntfyPriority = '1';

    await fetch(`https://ntfy.gurk.dev/calyx_alerts`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': title,
        'Priority': ntfyPriority,
        'Tags': 'warning,leaves',
        'Authorization': 'Bearer tk_jygqzxp9s8utgky5hasn7k0sgk0cm'
      }
    });
  } catch (error) {
    console.error('Failed to send ntfy alert:', error);
  }
}
