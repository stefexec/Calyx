import { LocalNotifications } from '@capacitor/local-notifications';
import useSettingsStore from '../store/useSettingsStore';

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

    const { ntfyUrl, ntfyTopic, ntfyToken } = useSettingsStore.getState();

    if (!ntfyUrl || !ntfyTopic) {
      console.warn('ntfy URL or Topic not configured. Skipping push notification.');
      return;
    }

    // Clean trailing slashes from URL
    const baseUrl = ntfyUrl.replace(/\/$/, '');

    const headers = {
      'Title': title,
      'Priority': ntfyPriority,
      'Tags': 'warning,leaves',
    };

    if (ntfyToken) {
      headers['Authorization'] = `Bearer ${ntfyToken}`;
    }

    await fetch(`${baseUrl}/${ntfyTopic}`, {
      method: 'POST',
      body: message,
      headers: headers
    });
  } catch (error) {
    console.error('Failed to send ntfy alert:', error);
  }
}
