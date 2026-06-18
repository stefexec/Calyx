import useSettingsStore from '../store/useSettingsStore';

export async function sendNotification(title, message, priority = 'default') {
  // We completely removed Capacitor's LocalNotifications here 
  // because it was sending unwanted desktop/browser popups.
  
  // ntfy HTTP Push Notification
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
      'Content-Type': 'text/plain' // Explicitly set content type
    };

    if (ntfyToken && ntfyToken.trim() !== '') {
      // Basic auth or Bearer auth depending on what the user's ntfy setup is
      // Ntfy usually uses Bearer for access tokens, but some use Basic. 
      // We will default to Bearer as standard for ntfy tokens.
      headers['Authorization'] = `Bearer ${ntfyToken}`;
    }

    const response = await fetch(`${baseUrl}/${ntfyTopic}`, {
      method: 'POST',
      body: message,
      headers: headers
    });
    
    if (!response.ok) {
      console.error('Ntfy push failed with status:', response.status);
    }
  } catch (error) {
    console.error('Failed to send ntfy alert:', error);
  }
}
