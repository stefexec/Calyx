import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const TrainingAction = {
  TOPPING: 'Topping',
  FIMING: 'FIMing',
  LST: 'LST',
  DEFOLIATION: 'Defoliation',
  REPOTTING: 'Repotting'
};

const useGrowLogStore = create(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (log) => set((state) => ({ 
        logs: [{
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          timestamp: new Date().toISOString(),
          ...log
        }, ...state.logs] 
      })),
      deleteLog: (id) => set((state) => ({ logs: state.logs.filter(l => l.id !== id) })),
    }),
    {
      name: 'calyx-growlog-storage',
    }
  )
);

export default useGrowLogStore;
