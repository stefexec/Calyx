import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      ntfyUrl: 'https://ntfy.gurk.dev',
      ntfyTopic: 'calyx_alerts',
      ntfyToken: '',
      
      updateNtfySettings: (url, topic, token) => set({ 
        ntfyUrl: url, 
        ntfyTopic: topic, 
        ntfyToken: token 
      }),
    }),
    {
      name: 'calyx-global-settings',
    }
  )
);

export default useSettingsStore;
