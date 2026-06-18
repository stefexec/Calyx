import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useConnectionStore = create(
  persist(
    (set) => ({
      serverUrl: '', // If empty, will fallback to window.location.hostname in api.js
      apiKey: '',
      
      setConnectionDetails: (url, key) => set({ serverUrl: url, apiKey: key }),
      clearConnectionDetails: () => set({ serverUrl: '', apiKey: '' }),
    }),
    {
      name: 'calyx-connection-storage', // unique name
    }
  )
);

export default useConnectionStore;
