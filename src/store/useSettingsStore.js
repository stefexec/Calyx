import { create } from 'zustand';
import { fetchApi } from '../utils/api';

const useSettingsStore = create((set) => ({
  ntfyUrl: 'https://ntfy.gurk.dev',
  ntfyTopic: 'calyx_alerts',
  ntfyToken: '',
  defaultVegDays: 28,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await fetchApi('/settings/');
      const settingsMap = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      
      set({ 
        ntfyUrl: settingsMap['ntfyUrl'] || 'https://ntfy.gurk.dev',
        ntfyTopic: settingsMap['ntfyTopic'] || 'calyx_alerts',
        ntfyToken: settingsMap['ntfyToken'] || '',
        defaultVegDays: settingsMap['defaultVegDays'] !== undefined ? parseInt(settingsMap['defaultVegDays']) : 28,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to fetch settings", error);
      set({ isLoading: false });
    }
  },

  updateNtfySettings: async (url, topic, token) => {
    set({ ntfyUrl: url, ntfyTopic: topic, ntfyToken: token }); // Optimistic UI update
    try {
      await Promise.all([
        fetchApi('/settings/ntfyUrl', { method: 'PUT', body: JSON.stringify({ key: 'ntfyUrl', value: url }) }),
        fetchApi('/settings/ntfyTopic', { method: 'PUT', body: JSON.stringify({ key: 'ntfyTopic', value: topic }) }),
        fetchApi('/settings/ntfyToken', { method: 'PUT', body: JSON.stringify({ key: 'ntfyToken', value: token }) })
      ]);
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  },

  updateDefaultVegDays: async (days) => {
    set({ defaultVegDays: days }); // Optimistic UI update
    try {
      await fetchApi('/settings/defaultVegDays', { 
        method: 'PUT', 
        body: JSON.stringify({ key: 'defaultVegDays', value: days.toString() }) 
      });
    } catch (error) {
      console.error("Failed to update veg days", error);
    }
  }
}));

export default useSettingsStore;
